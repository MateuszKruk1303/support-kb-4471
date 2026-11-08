// Splits a big ticket into the problems its reports really are. Pages explain it; this file is what runs.
//
// It builds on causes.ts: the tenant decides the cause (locale + booking form), never the intake tag.
// On top of that it takes the desk's own reading of a report (desk-notes.json): a report the desk read
// as a one-day move is that problem, whatever its tenant. CauseTable counts those under their tenant's
// cause and footnotes them; here they are counted where they belong, once.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

// One line each, for tables. The page says the rest in words.
export const PROBLEM_LABEL: Record<Problem, string> = {
  parser: 'parser reads day-first dates month first',
  hint: 'booking-v3 form hint says MM/DD/YYYY',
  'one-day': 'date moves one day earlier',
  unplaced: 'no cause on file (tenant unknown or month-first)',
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count. Shown so nobody counts by it.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (rs: Report[], key: (r: Report) => string): Record<string, number> =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

// Every report merged into `ticket`, counted once (one id, one report), grouped by problem, biggest first.
export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: tally(rs, (r) => r.channel),
        taggedAs: tally(rs, (r) => r.meta.intakeTag),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

// "app ×12 · email ×3", biggest first.
export const byCount = (n: Record<string, number>): string =>
  Object.entries(n)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ×${v}`)
    .join(' · ');
