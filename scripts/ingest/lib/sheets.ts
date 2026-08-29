/**
 * sheets.ts
 *
 * Reads a tab of the editorial Google Sheet as rows of strings.
 *
 * The spreadsheet is shared "anyone with the link", so we can use the public
 * "gviz" CSV export and need no credentials. The URL takes the tab by *name*,
 * which is friendlier than the numeric `gid` and survives tab reordering.
 *
 * Each row comes back as an object keyed by the header row, plus the 1-based
 * spreadsheet row number so the data-quality report can point editors at the
 * exact row.
 */

import { parse } from 'csv-parse/sync';

/** One spreadsheet row: column header → cell text (trimmed), plus its row number. */
export interface SheetRow {
  /** 1-based row number as shown in the Google Sheets UI (header is row 1). */
  rowNumber: number;
  cells: Record<string, string>;
}

export interface SheetTab {
  name: string;
  headers: string[];
  rows: SheetRow[];
}

/** Build the public CSV export URL for one tab. */
function csvExportUrl(sheetId: string, tabName: string): string {
  const params = new URLSearchParams({
    tqx: 'out:csv',
    sheet: tabName,
    // Tell gviz the first row is a header so it never guesses wrong.
    headers: '1',
  });
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${params}`;
}

/**
 * Download and parse one tab. Throws if the sheet can't be fetched — that is a
 * blocking failure (nothing sensible can be produced without the data).
 */
export async function fetchSheetTab(sheetId: string, tabName: string): Promise<SheetTab> {
  const url = csvExportUrl(sheetId, tabName);
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Could not download tab "${tabName}": HTTP ${response.status} from ${url}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/csv')) {
    // Google answers with an HTML sign-in page when the sheet isn't shared.
    throw new Error(
      `Tab "${tabName}" did not come back as CSV (${contentType}). ` +
        'Is the spreadsheet still shared with "anyone with the link"?',
    );
  }
  return parseCsvTab(tabName, await response.text());
}

/**
 * Turn CSV text into rows. Separated from the download so the parser can be
 * exercised on a saved file without the network.
 */
export function parseCsvTab(tabName: string, csvText: string): SheetTab {
  // `columns: false` gives us raw arrays so we can keep the header row and
  // number the rows ourselves. Blurbs contain quoted newlines; csv-parse
  // handles those correctly, which is why we don't split on "\n" by hand.
  const records = parse(csvText, {
    columns: false,
    relax_column_count: true,
    skip_empty_lines: false,
    bom: true,
  }) as string[][];

  if (records.length === 0) {
    throw new Error(`Tab "${tabName}" is empty.`);
  }

  const headers = records[0].map((h) => h.trim());
  const rows: SheetRow[] = [];

  records.slice(1).forEach((record, index) => {
    const cells: Record<string, string> = {};
    headers.forEach((header, column) => {
      // Unnamed columns (the notes area on the Profiles tab) get positional
      // keys so their content is still reachable if we ever need it.
      const key = header || `__col${column}`;
      cells[key] = (record[column] ?? '').trim();
    });
    rows.push({ rowNumber: index + 2, cells });
  });

  return { name: tabName, headers, rows };
}

/** True when every cell in the row is blank — trailing rows in the export. */
export function isBlankRow(row: SheetRow): boolean {
  return Object.values(row.cells).every((value) => value === '');
}

/** Throw if a tab is missing any column the transform relies on. */
export function requireColumns(tab: SheetTab, required: string[]): void {
  const missing = required.filter((name) => !tab.headers.includes(name));
  if (missing.length > 0) {
    throw new Error(
      `Tab "${tab.name}" is missing expected column(s): ${missing.join(', ')}. ` +
        `Found: ${tab.headers.filter(Boolean).join(', ')}`,
    );
  }
}
