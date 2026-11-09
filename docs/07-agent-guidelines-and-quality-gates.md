# 7. Agent Guidelines, Documentation & Quality Gates

## 7.1 Single Source of Truth (`docs/`)

- All architectural decisions, entity schemas (`firebase-blueprint.json`), security rules (`firestore.rules`), and API contracts (`server.ts` & `src/utils/rules.ts`) are synchronized with the 7 documents in `/docs/`.
- Whenever a new feature or schema field is introduced, the corresponding specification in `/docs/`, `firebase-blueprint.json`, `firestore.rules`, and `src/utils/rules.test.ts` must be updated in the same vertical slice.

---

## 7.2 7-Phase Execution Workflow

1. **Phase 1 — Discovery**: Confirm user problem, persona impact, and MVP vs. Post-MVP boundary (`docs/01-product-discovery-and-scope.md`).
2. **Phase 2 — Specification**: Define deterministic state transitions, uniqueness rules, and edge cases (`docs/02-detailed-feature-requirements.md`).
3. **Phase 3 — Architecture**: Specify REST/WebSocket contracts, pagination parameters, and Firestore entity constraints (`docs/04-technical-architecture-and-database.md`).
4. **Phase 4 — Design**: Map UI tokens, typography, and all 9 screen states (`docs/03-ui-ux-design-system.md`).
5. **Phase 5 — Planning**: Decouple pure business logic in `src/utils/rules.ts` from React view components.
6. **Phase 6 — Vertical Slice Implementation**: Implement pure logic, unit tests, backend routes, Firestore security rules, and React UI controls end-to-end.
7. **Phase 7 — Verification**: Execute all 6 Quality Gates and inspect the rendered application in a real headless browser via `playwright-cli`.

---

## 7.3 Strict Quality Gates (Mandatory Pass Criteria)

No engineering task is marked complete until all 6 automated quality gates pass:

| Gate ID | Quality Gate | Command / Verification Method | Pass Criterion |
| :--- | :--- | :--- | :--- |
| **QG-01** | **TypeScript Type Checking** | `npm run lint` (`tsc --noEmit`) | Exit code `0` with zero type errors |
| **QG-02** | **Production Bundle Compilation** | `compile_applet` (`vite build`) | Clean production build with zero unresolved imports |
| **QG-03** | **Firestore Security Rules ESLint** | `npx eslint firestore.rules` | Exit code `0` with zero security rule lint violations |
| **QG-04** | **Unit & Dirty Dozen Security Tests** | `npx --yes tsx --test src/utils/rules.test.ts firestore.rules.test.ts` | 100% pass rate across all unit & security rule tests (`0 fail`) |
| **QG-05** | **Authorization, Uniqueness & SLA Gate** | `GET /api/engineering/spec-status` & `/api/moments/:id/likes` | `uniqueConstraintEnforced === true` & `p95Ms < 300` |
| **QG-06** | **Real Browser E2E & Console Gate** | `playwright-cli` inspection at `1440x900` & `375x812` | Zero console errors, zero uncaught page errors, zero unimplemented buttons |
