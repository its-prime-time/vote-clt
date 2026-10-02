/**
 * report.ts
 *
 * Renders the data-quality report (data_quality_issues.md) for the editorial
 * team. It is rewritten from scratch every run, so its git history is a log of
 * issues appearing and being fixed.
 *
 * The audience is editors, not developers: plain language, grouped by
 * severity, each line naming the tab and row to look at.
 */

import type { Issue, IssueLog } from './issues';

export interface ReportSummary {
  sheetTitle: string;
  sheetUrl: string;
  generatedAt: Date;
  candidates: number;
  contests: number;
  completeProfiles: number;
  spanishBlurbs: number;
  /** Ballot names of candidates whose Spanish blurb is a machine translation. */
  machineSpanish: string[];
  /** The "EN Completed" number from the Profiles tab tally, if present. */
  tallyEnCompleted: number | null;
  /** Profiles with an English blurb, to compare against the tally. */
  englishBlurbs: number;
}

export function renderReport(summary: ReportSummary, log: IssueLog): string {
  const lines: string[] = [];
  const total = log.issues.length;

  lines.push('# Candidate data quality report');
  lines.push('');
  lines.push(
    `Generated ${formatDate(summary.generatedAt)} from [${summary.sheetTitle}](${summary.sheetUrl}) by \`make ingest\`. ` +
      'This file is rewritten on every ingest — fix the rows below in the spreadsheet and the entries disappear on the next run.',
  );
  lines.push('');
  lines.push(
    `**${summary.candidates} candidates · ${summary.contests} contests · ${summary.completeProfiles} complete profiles ` +
      `(website + blurb + photo) · ${summary.spanishBlurbs} Spanish blurbs (${summary.machineSpanish.length} machine-translated) · ${total} issue${total === 1 ? '' : 's'}**`,
  );

  if (summary.tallyEnCompleted !== null && summary.tallyEnCompleted !== summary.englishBlurbs) {
    lines.push('');
    lines.push(
      `> The "EN Completed" tally on the Candidate Profiles tab says ${summary.tallyEnCompleted}, ` +
        `but ${summary.englishBlurbs} profiles have an English blurb.`,
    );
  }

  lines.push('');
  lines.push('## Needs fixing');
  lines.push('');
  lines.push('_A candidate is missing from the site, or shown without part of their profile, until these are resolved._');
  lines.push('');
  lines.push(...renderIssues(log.errors));

  lines.push('');
  lines.push('## Worth a look');
  lines.push('');
  lines.push('_Published as-is, but probably not what was intended._');
  lines.push('');
  lines.push(...renderIssues(log.warnings));

  lines.push('');
  lines.push('## Machine-translated Spanish');
  lines.push('');
  lines.push(
    '_These candidates have no Spanish blurb in the sheet, so the site shows a machine translation of the English one. ' +
      'Type a Spanish blurb into the "Policy Blurb (ES)" column to replace it; accents are added automatically if your keyboard can\'t type them._',
  );
  lines.push('');
  lines.push(...(summary.machineSpanish.length > 0 ? summary.machineSpanish.map((name) => `- ${name}`) : ['None.']));
  lines.push('');

  return lines.join('\n');
}

function renderIssues(issues: Issue[]): string[] {
  if (issues.length === 0) return ['Nothing to report.'];
  return issues.map((issue) => {
    const where = issue.row ? `${issue.where}, row ${issue.row}` : issue.where;
    return `- **${issue.subject}** (${where}) — ${issue.message}`;
  });
}

/** "2026-08-29 15:30 UTC" — unambiguous, sorts naturally in the git log. */
function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}
