# BabyCare — Newborn Lab Requests

A React and TypeScript frontend implementing the supplied admission and lab-request flowchart. All patient data is fictional. This application uses an in-memory mock API, not a hospital backend; reloading resets the demo.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Serve `dist/` with SPA fallback to `index.html` so direct routes work.

## Architecture

- `src/pages`: overview, admission, lab requests, and the Medpoint integration boundary.
- `src/components`: application shell, demo controls, patient summary, loading, progress, and feedback components.
- `src/features/admission`: React Hook Form / Zod child editor with single and multiple birth validation and multiple-child review.
- `src/features/admission/AdmissionSearch.tsx`, `MotherSummary.tsx`, and `ChildrenTable.tsx`: focused admission presentation components; the page coordinates the workflow.
- `src/features/registers/useRegisterView.tsx`: URL-backed filtering, column selection, sorting, and pagination, separate from register presentation.
- `src/lib`: shared patient-name formatting and route presentation metadata.
- `src/components/WorkflowDialog.tsx`: shared modal behavior, independent of bracelet printing.
- `src/features/labRequests`: request selection, newborn review and processing, and Medpoint callback integration.
- `src/store/workflow.ts`: Zustand discriminated union for shared newborn selections. Changing mother or baby clears dependent selections.
- `src/services/workflows.ts`: typed asynchronous service functions and sequential lab orchestration. Replace these service implementations with your REST client while preserving the public contracts.
- `src/repositories/mockRepository.ts`: in-memory tables, simulated latency, audit log, and one-shot failure injection.
- `src/mocks/data.ts`: fictional admissions, babies and requests.
- `src/tests`: service consistency tests and user-facing workflow integration tests.

The UI uses Lucide icons, Tailwind CSS v4, and compact custom components. No component library is needed for the current controls.

## Styling and responsive layouts

`src/styles.css` is the single CSS entry point. `src/theme.css` owns the light/dark
palette; Tailwind's `@theme inline` maps those variables to utilities such as
`bg-surface`, `text-heading`, and `text-brand-ink`. Feature styles use `@apply`
where equivalent utilities preserve the existing design. Exact dimensions,
decorative artwork, print rules, and complex selectors remain in CSS.

The import order is intentional: shared controls and base styles, workspace
and admission refinements, then `src/styles/responsive.css`. Preserve that order
when changing styles. Existing desktop rules are retained to avoid visual
regressions; a complete replacement with utility-only JSX is not required.

At widths of 900px and below, pages scroll naturally, admission navigation sits
above the work area, and dashboard charts stack. Phone forms use one column.
Wide clinical tables retain all selected columns and scroll within a named,
keyboard-focusable region. Coarse-pointer controls have larger touch targets.
Bracelet printing keeps its dedicated print rules.

## Review checks

```sh
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Use `npm run format` before submitting changes. Browser tests cover 320, 390,
768, and 1440px layouts, admission navigation, editing, register filters, theme
switching, and a phone request-confirmation/results workflow. They save captures
under the ignored `artifacts/` directory.

Playwright uses installed Microsoft Edge (`channel: "msedge"`). On another
machine, install Edge or change that setting and install the corresponding
Playwright browser. The test server uses port 5175. Unit tests use jsdom and are
limited to `src/tests`; browser tests live in `e2e`.

## Demonstration

- `CASE-2026-00127` / Layla Haddad / `ADM-260641`: single baby with two pending requests.
- `CASE-2026-00128` / Nour Khoury / `ADM-260642`: twins; one baby has a request and one has none.
- `CASE-2026-00129` / Sara Mansour / `ADM-260643`: triplets; two babies have pending requests.
- `CASE-2026-00130` / Maya Saad: discharged admission.
- `CASE-2026-00131` / Rana Nasser: active admission with no babies yet.
- Any unknown case, such as `CASE-2026-99999`: no matching mother.

The Newborn Record & Request workspace offers suggestions by name, MRN, case number, phone, or admission number. Selecting an active mother opens her details and linked children on the left, with Add baby and Babies & pending requests tabs on the right. Baby drafts remain intact when switching tabs. Add Baby creates additional form sections; at least one must remain. Optional name fields precede required birth details, and the editable last name is prefilled from the mother's surname. Multiple babies are reviewed before creation. Child creation does not invent lab requests.

The overview reads current mock counts immediately and refreshes them after changes. KPI sparklines and yesterday comparisons use fictional demo history; the newest point uses the live mock count. The unified care card links to the combined patient workspace. Desktop workspaces use viewport height with independent scrolling for long child lists and work panels. The theme switch is at the bottom of the sidebar. The topbar patient search opens the same patient workspace; its logout action closes the local demo and clears selections, without claiming to sign out of an external account.

Lab requests are handled in the patient workspace?s Babies & pending requests tab. Request codes contain one or more tests. Queue update runs before `NewBornSent` is set; successful processing navigates directly to Request Proceeded. The old lab-request URL redirects to the combined workspace. Mother requests remain outside this app.

Use **Demo tools** in the footer to inject a one-shot network, child creation, queue, or admission update failure and inspect the service operation log. To demonstrate partial failure, select **Admission request update** immediately before clicking Proceed; the queue update succeeds, finalization fails, and Retry Proceed recovers without inserting a duplicate queue entry.

## Integration notes

The legacy `continueWithMedpointFlow(request)` service remains for compatibility. The visible workflow now ends at Request Proceeded. Processing updates only the in-memory repository; no external laboratory integration is connected.

Child creation validates the entire batch before changing the in-memory New Born and Person representations. A real backend must enforce an atomic transaction, patient/request ownership, idempotency, and concurrency checks. The mock queue uses request ID as its idempotency key, making partial-failure retries safe within the current demo session. These controls must be enforced server-side when connecting a real system.

No authentication, clinical decision-making, billing, or external integrations are included.

### Admission workflow

Admission search accepts case numbers. Selecting a mother replaces search with a full-width summary and Change Mother resets the workspace. Add Children requires a confirmed count, creates the linked records as one batch, and opens View Children. The lab tab lists children with pending requests and requires modal confirmation before processing. Bracelet icons open the browser print dialog directly with only bracelet content; birth/admission date and time are used for the child/mother respectively. Missing demographic fields are displayed as Not recorded. The Layla fixture includes fictional extended demographics, and demo newborn MRNs are stored separately from record identifiers.

Confirmed newborn counts remain visible in the form header. Focusing the count pauses child inputs until reconfirmation; retained rows preserve entered values, and new rows inherit the mother?s middle and last names. The lab workflow requires explicit child selection followed by request selection before confirmation.
