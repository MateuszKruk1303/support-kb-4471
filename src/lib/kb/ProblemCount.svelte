<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/problems';

  // A count for a sentence: <ProblemCount ticket={4471} problem="hint" />. Leave out `problem` for every
  // report merged into the ticket (each once), or ask for `of="problems"` to count the problems themselves.
  let { ticket, problem, of = 'reports' }: { ticket: number; problem?: Problem; of?: 'reports' | 'problems' } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const n = $derived(
    of === 'problems'
      ? split.groups.length
      : problem
        ? (split.groups.find((g) => g.problem === problem)?.reports.length ?? 0)
        : split.merged.length,
  );
</script>

<strong>{n}</strong>
