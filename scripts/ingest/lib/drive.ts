/**
 * drive.ts
 *
 * Lists and downloads the candidate photos from the shared Google Drive
 * folder.
 *
 * Downloading a link-shared file needs no credentials. LISTING the folder is
 * the awkward part: the Drive API refuses anonymous requests even for public
 * folders. So we try two approaches, best first:
 *
 *   1. The Drive API with an OAuth token. We take one from the
 *      DRIVE_ACCESS_TOKEN environment variable, or ask the gcloud CLI for the
 *      signed-in user's token (`gcloud auth login --enable-gdrive-access` once,
 *      then `gcloud auth print-access-token` works).
 *   2. Google's public "embedded folder view" — the same page that renders
 *      when you open a shared folder without signing in. It is plain HTML with
 *      each file's id and name, so we parse it. This is not an official API
 *      and could change shape; it exists here so a teammate without gcloud
 *      can still run the ingest. When it stops working, approach 1 still does.
 */

import { execFileSync } from 'node:child_process';

/** What we need to know about one file in the images folder. */
export interface DriveFile {
  id: string;
  /** File name including extension, e.g. "raygan_jason_angel.jpg". */
  name: string;
}

export interface FolderListing {
  files: DriveFile[];
  /** Which approach produced the listing, for the run summary. */
  method: 'drive-api' | 'public-folder-view';
}

/** List the files in a folder, trying the API first and the public view second. */
export async function listFolder(folderId: string): Promise<FolderListing> {
  const token = findAccessToken();
  if (token) {
    try {
      return { files: await listWithDriveApi(folderId, token), method: 'drive-api' };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`Drive API listing failed (${reason}); falling back to the public folder view.`);
    }
  }
  return { files: await listWithPublicView(folderId), method: 'public-folder-view' };
}

/** An OAuth token from the environment or from gcloud, or undefined if neither is available. */
function findAccessToken(): string | undefined {
  const fromEnv = process.env.DRIVE_ACCESS_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    return execFileSync('gcloud', ['auth', 'print-access-token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

async function listWithDriveApi(folderId: string, token: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}` +
          (response.status === 403
            ? ' — the token has no Drive scope; run `gcloud auth login --enable-gdrive-access`'
            : ''),
      );
    }
    const page = (await response.json()) as { nextPageToken?: string; files: DriveFile[] };
    files.push(...page.files);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return files;
}

async function listWithPublicView(folderId: string): Promise<DriveFile[]> {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Could not list the images folder: HTTP ${response.status} from ${url}`);
  }
  const html = await response.text();

  // Each file renders as:
  //   <div class="flip-entry" id="entry-<fileId>"> … <div class="flip-entry-title">name.jpg</div>
  const pattern = /<div class="flip-entry" id="entry-([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
  const files: DriveFile[] = [];
  for (const match of html.matchAll(pattern)) {
    files.push({ id: match[1], name: decodeHtmlEntities(match[2].trim()) });
  }

  if (files.length === 0) {
    throw new Error(
      'The public folder view returned no files. Either the folder is empty, is no longer ' +
        'shared with "anyone with the link", or Google changed the page layout. ' +
        'Set DRIVE_ACCESS_TOKEN or run `gcloud auth login --enable-gdrive-access` to use the Drive API instead.',
    );
  }
  return files;
}

/** Download one link-shared file's bytes. */
export async function downloadFile(file: DriveFile): Promise<Buffer> {
  const url = `https://drive.google.com/uc?export=download&id=${file.id}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} downloading ${file.name}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.startsWith('text/html')) {
    // Google serves an interstitial page instead of the bytes for files it
    // can't virus-scan (very large) or that aren't shared.
    throw new Error(`Google returned a web page instead of ${file.name}; is the file shared?`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** The handful of entities Google uses in file names on the folder page. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
