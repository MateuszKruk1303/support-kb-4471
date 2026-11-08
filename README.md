# kb — the support knowledge base

**kb** = knowledge base. What the support desk knows about how our products break, written
down where the code can keep it honest.

One desk takes reports for every product we run: `sched-prod` (calendar invites for about
300k people) and the rest. When something
goes wrong, the reports reach the desk first. This kb is how the desk triages them, what each
incident turned out to be, and why we decided what we decided.

## What's here

```
src/routes/kb/      the pages (.svx: Markdown with components)
  triage/           how the desk handles incoming reports
  incidents/        one page per big ticket
  decisions/        numbered decision records
src/lib/kb/         components and the logic they run
src/lib/layouts/    the frame every page shares
src/lib/data/       exports from the ticket system
```

## Conventions

- Words in the page, logic in `src/lib` (imported as `#lib/…`). A number that can be computed belongs in a component.
- Every page starts with frontmatter: `title`, `owner`, `status`, `reviewed`.
- A decision is never edited after it is accepted. A new record replaces it.
- A page you add is signed: its frontmatter carries your `signature` and it ends with `<RenderStamp {signature} />`, so the desk knows who wrote it.

## Owners

Support desk. Decision records: whoever signed them.

---

Exported 2026-10-04 from the `support` repo, `apps/kb/` → `src/`.

---

## Added here: #4471 split by problem

Desk ticket #4471 holds more than one problem. This repo is the kb export above, unchanged, plus:

- `src/routes/kb/incidents/4471/problems/+page.svx`: the signed page about the split.
- `src/lib/kb/problems.ts`, `ProblemSplit.svelte`, `ProblemCount.svelte`: the logic and the components
  that count each problem from `src/lib/data` at render time. The page types no counts.
- `rendered/`: the kb as the desk sees it, built from this repo. The page is
  `rendered/kb/incidents/4471/problems.html` (styles inline, opens on its own).
- `package.json`, `svelte.config.js`, `vite.config.js`, `src/app.html`, `src/routes/+layout.js`: a minimal
  SvelteKit + mdsvex build, so the pages render. `npm install && npm run build` writes `rendered/`.

One issue per problem is filed in this repo's Issues, each with the number of reports it covers.
