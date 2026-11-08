<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEM_LABEL, byCount, splitTicket, type Problem } from '#lib/kb/problems';

  // tickets: problem → link to the ticket filed for it. state: problem → where it stands (words from the page).
  let {
    ticket,
    tickets = {},
    state = {},
  }: { ticket: number; tickets?: Partial<Record<Problem, string>>; state?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const twice = $derived(split.groups.reduce((n, g) => n + g.reports.length, 0) - split.merged.length);
  const issue = (url: string) => url.replace(/^.*\/issues\//, '#');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>tagged at intake as</th><th>seen</th><th>state</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr class:open={state[g.problem] === 'open'}>
        <td><code>{g.problem}</code><br /><span class="what">{PROBLEM_LABEL[g.problem]}</span></td>
        <td class="n">
          {g.reports.length}
          {#each Object.entries(g.alsoIn) as [p, n] (p)}<br /><span class="what">{n} also in <code>{p}</code></span>{/each}
        </td>
        <td>{g.tenants.length}</td>
        <td class="small">{byCount(g.channels)}</td>
        <td class="small">{byCount(g.taggedAs)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td class="state">{state[g.problem] ?? '—'}</td>
        <td>
          {#if tickets[g.problem]}<a href={tickets[g.problem]}>{issue(tickets[g.problem] ?? '')}</a>
          {:else}<span class="none">no ticket yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if twice}
  <p class="note">
    {twice} {twice === 1 ? 'report is' : 'reports are'} in two rows: filed under the tenant's cause, the way the
    desk's own table counts, and read by the desk as a one-day move. The rows add up to more than #{ticket}.
  </p>
{/if}

<style>
  .sum { font-size: 1.1rem; }
  .what, .small, .note { color: var(--muted); font-size: 0.85em; }
  .n { font-weight: 600; }
  .state { font-weight: 600; }
  .open td { background: var(--warn-bg); }
  .open .state { color: var(--warn); }
  .none { color: var(--warn); font-weight: 600; }
</style>
