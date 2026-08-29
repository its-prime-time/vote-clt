/**
 * issues.ts
 *
 * Collects data-quality findings during an ingest run. Nothing here decides
 * what to do about a problem — the transform decides whether a row is
 * publishable; this just remembers what was found so the report can tell the
 * editorial team.
 */

/**
 * - `error`   the row can't be published as intended (a candidate is missing
 *             from the site, or shown incomplete) until the sheet is fixed.
 * - `warning` published as-is, but someone should take a look.
 */
export type Severity = 'error' | 'warning';

export interface Issue {
  severity: Severity;
  /** Which tab (or "Candidate Images") the issue is in. */
  where: string;
  /** How editors will recognise the row: usually the candidate's ballot name. */
  subject: string;
  /** Spreadsheet row number when known. */
  row?: number;
  /** What's wrong and what to change, in plain language. */
  message: string;
}

export class IssueLog {
  readonly issues: Issue[] = [];

  error(where: string, subject: string, message: string, row?: number): void {
    this.issues.push({ severity: 'error', where, subject, message, row });
  }

  warning(where: string, subject: string, message: string, row?: number): void {
    this.issues.push({ severity: 'warning', where, subject, message, row });
  }

  get errors(): Issue[] {
    return this.issues.filter((issue) => issue.severity === 'error');
  }

  get warnings(): Issue[] {
    return this.issues.filter((issue) => issue.severity === 'warning');
  }
}
