/**
 * photos.ts
 *
 * Resolves each candidate's headshot: finds the file named `<id>.<ext>` in the
 * Drive folder, downloads it, and normalizes it with sharp into a fixed-size
 * JPEG under public/candidates/.
 *
 * Every source image goes through the same pipeline regardless of what the
 * editors uploaded (a 4 MB phone photo or a 7 KB thumbnail), so the site never
 * serves an oversized file. The SHA-256 of the source bytes is recorded in the
 * JSON; on the next run, an unchanged source is skipped and an updated one is
 * re-processed — the git diff then shows exactly which photo changed.
 */

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { CandidatePhoto } from '../../../src/data/candidateTypes';
import { OUTPUT_PHOTOS_DIR, PHOTO, PHOTO_URL_PREFIX } from '../config';
import { downloadFile, listFolder, type DriveFile } from './drive';
import type { IssueLog } from './issues';
import type { CandidateDraft } from './transform';

const IMAGES_WHERE = 'Candidate Images folder';

export interface PhotoSyncOptions {
  /** Photos from the previous run, by candidate id, so unchanged sources can be skipped. */
  previous: Map<string, CandidatePhoto>;
  /** When true, nothing is written or deleted; results describe what WOULD happen. */
  dryRun: boolean;
}

export interface PhotoSyncResult {
  photos: Map<string, CandidatePhoto>;
  listingMethod: string;
  fetched: number;
  skipped: number;
  removed: string[];
  /** True if any photo was (or would be) written or removed. */
  changed: boolean;
}

export async function syncPhotos(
  folderId: string,
  candidates: CandidateDraft[],
  log: IssueLog,
  options: PhotoSyncOptions,
): Promise<PhotoSyncResult> {
  const listing = await listFolder(folderId);
  const filesByStem = indexByStem(listing.files, log);

  const photos = new Map<string, CandidatePhoto>();
  let fetched = 0;
  let skipped = 0;
  const wantedIds = new Set<string>();

  for (const candidate of candidates) {
    const file = filesByStem.get(candidate.id);

    if (!candidate.wantsPhoto) {
      if (file) {
        log.warning(IMAGES_WHERE, candidate.name, `there is a photo "${file.name}" in the folder, but the Image box is not ticked on the Candidate Profiles tab. Not shown until it is.`);
      }
      continue;
    }
    if (!file) {
      log.error(IMAGES_WHERE, candidate.name, `the Image box is ticked, but there is no file named "${candidate.id}.jpg" (or .jpeg/.png) in the folder. Shown without a photo.`);
      continue;
    }

    wantedIds.add(candidate.id);
    const outputPath = path.join(OUTPUT_PHOTOS_DIR, `${candidate.id}.jpg`);

    let bytes: Buffer;
    try {
      bytes = await downloadFile(file);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      log.error(IMAGES_WHERE, candidate.name, `could not download "${file.name}" (${reason}). Shown without a photo.`);
      continue;
    }

    const sourceHash = createHash('sha256').update(bytes).digest('hex');
    const previous = options.previous.get(candidate.id);

    // Same bytes as last time and the output still exists: nothing to do,
    // but keep reporting a small original so the note doesn't disappear
    // from the report just because the photo was already processed.
    if (previous?.sourceHash === sourceHash && (await fileExists(outputPath))) {
      const photo = { ...previous, path: `${PHOTO_URL_PREFIX}/${candidate.id}.jpg`, sourceName: file.name };
      warnIfSmall(photo.sourceWidth, photo.sourceHeight, candidate.name, file.name, log);
      photos.set(candidate.id, photo);
      skipped++;
      continue;
    }

    try {
      const { output, width, height } = await normalize(bytes);
      warnIfSmall(width, height, candidate.name, file.name, log);
      if (!options.dryRun) {
        await mkdir(OUTPUT_PHOTOS_DIR, { recursive: true });
        await writeFile(outputPath, output);
      }
      photos.set(candidate.id, {
        path: `${PHOTO_URL_PREFIX}/${candidate.id}.jpg`,
        sourceName: file.name,
        sourceHash,
        sourceWidth: width,
        sourceHeight: height,
      });
      fetched++;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      log.error(IMAGES_WHERE, candidate.name, `"${file.name}" could not be read as an image (${reason}). Re-save it as a JPEG or PNG. Shown without a photo.`);
    }
  }

  // Files in the folder that match no candidate at all are usually misnamed.
  const candidateIds = new Set(candidates.map((c) => c.id));
  for (const [stem, file] of filesByStem) {
    if (!candidateIds.has(stem)) {
      log.warning(IMAGES_WHERE, file.name, 'does not match any ID on the spreadsheet (compare the file name with the ID column). Not used.');
    }
  }

  // Remove local photos that no longer belong to a candidate with a ticked Image box.
  const removed: string[] = [];
  await mkdir(OUTPUT_PHOTOS_DIR, { recursive: true });
  for (const name of await readdir(OUTPUT_PHOTOS_DIR)) {
    const stem = path.parse(name).name;
    if (name.startsWith('.') || wantedIds.has(stem)) continue;
    removed.push(name);
    if (!options.dryRun) await unlink(path.join(OUTPUT_PHOTOS_DIR, name));
  }

  return {
    photos,
    listingMethod: listing.method,
    fetched,
    skipped,
    removed,
    changed: fetched > 0 || removed.length > 0,
  };
}

/** Crop-to-fit, resize, strip metadata, encode as JPEG. Also reports the source size. */
async function normalize(bytes: Buffer): Promise<{ output: Buffer; width: number; height: number }> {
  const image = sharp(bytes, { failOn: 'error' }).rotate(); // .rotate() with no args applies EXIF orientation
  const meta = await image.metadata();
  // After auto-rotation the stored width/height may be swapped.
  const swapped = (meta.orientation ?? 1) >= 5;
  const width = (swapped ? meta.height : meta.width) ?? 0;
  const height = (swapped ? meta.width : meta.height) ?? 0;
  const output = await image
    .resize(PHOTO.width, PHOTO.height, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: PHOTO.jpegQuality, mozjpeg: true })
    .toBuffer();
  return { output, width, height };
}

/** A source smaller than the card is upscaled and looks soft — worth telling the editors. */
function warnIfSmall(width: number, height: number, subject: string, fileName: string, log: IssueLog): void {
  if (width > 0 && height > 0 && (width < PHOTO.width || height < PHOTO.height)) {
    log.warning(IMAGES_WHERE, subject, `"${fileName}" is only ${width}×${height} pixels; it will look soft on the card (target is ${PHOTO.width}×${PHOTO.height}). Use a larger original if one is available.`);
  }
}

/** Map "raygan_jason_angel.jpg" → file, keyed by the name without extension. */
function indexByStem(files: DriveFile[], log: IssueLog): Map<string, DriveFile> {
  const byStem = new Map<string, DriveFile>();
  for (const file of files) {
    const { name: stem, ext } = path.parse(file.name);
    if (!/^\.(jpe?g|png|webp)$/i.test(ext)) {
      log.warning(IMAGES_WHERE, file.name, 'is not a .jpg, .jpeg, or .png file; ignored.');
      continue;
    }
    if (byStem.has(stem)) {
      log.warning(IMAGES_WHERE, stem, `has more than one file (${byStem.get(stem)!.name} and ${file.name}). Delete the one that shouldn't be used; "${byStem.get(stem)!.name}" is used for now.`);
      continue;
    }
    byStem.set(stem, file);
  }
  return byStem;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}
