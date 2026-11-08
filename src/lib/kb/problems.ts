// Splits a big ticket into the problems its reports really are. Pages explain it; this file is what runs.
//
// It counts the way the desk's own view does (CauseTable, causes.ts): the tenant decides the cause
// (locale + booking form), never the intake tag, and every report is counted under that cause.
// On top of that it takes the desk's own reading of a report (desk-notes.json): a report the desk read
// as a one-day move is also counted as that problem. CauseTable only footnotes those; here they get a
// row of their own, and they stay counted where the desk files them. So a report can sit in two rows.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

// One line each, for tables. The page says the rest in words.
export const PROBLEM_LABEL: Record<Problem, string> = {
  parser: 'parser reads day-first dates month first',
  hint: 'booking-v3 form hint says MM/DD/YYYY',
  'one-day': 'date moves one day earlier',
  unplaced: 'no cause on file (tenant unknown or month-first)',
};

// Where the desk files the report (its tenant's cause), then any problem the desk read it as.
export function problemsOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem[] {
  const filed: Problem = causeOf(r, t) ?? 'unplaced';
  return oneDayMove.includes(r.id) ? [filed, 'one-day'] : [filed];
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count. Shown so nobody counts by it.
  taggedAs: Record<string, number>;
  // Reports in this row that are counted in another row too: problem → count.
  alsoIn: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export type Split = { merged: Report[]; groups: ProblemGroup[] };

const tally = (rs: Report[], key: (r: Report) => string): Record<string, number> =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

// Every report merged into `ticket`, counted once per id, grouped by problem, biggest first.
export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  const problems = new Map<string, Problem[]>();
  for (const r of merged) {
    const ps = problemsOf(r, tenantOf(r), oneDayMove);
    problems.set(r.id, ps);
    for (const p of ps) byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      const others = rs.flatMap((r) => (problems.get(r.id) ?? []).filter((p) => p !== problem));
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: tally(rs, (r) => r.channel),
        taggedAs: tally(rs, (r) => r.meta.intakeTag),
        alsoIn: others.reduce<Record<string, number>>((n, p) => ({ ...n, [p]: (n[p] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { merged, groups };
}

// "app ×12 · email ×3", biggest first.
export const byCount = (n: Record<string, number>): string =>
  Object.entries(n)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ×${v}`)
    .join(' · ');
