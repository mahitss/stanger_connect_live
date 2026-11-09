# Mr. Stranger — Structured Engineering & Product Documentation (`docs/`)

This directory serves as the **Single Source of Truth (SSOT)** for product requirements, design system tokens, API contracts, database schemas, security baselines, observability SLAs, and quality gates for **Mr. Stranger**.

## Phased Execution Workflow

Every engineering task in this repository follows the 7-phase vertical slice workflow:

`Discovery → Specification → Architecture → Design → Planning → Vertical Slice Implementation → Verification`

## 7-Pillar Documentation Index

| Pillar | Document | Scope |
| :--- | :--- | :--- |
| **1. Product Discovery & Scope** | [`docs/01-product-discovery-and-scope.md`](./01-product-discovery-and-scope.md) | Vision, target audience, core problem, value proposition, business model, and explicit MVP vs. Post-MVP scope |
| **2. Detailed Feature Requirements** | [`docs/02-detailed-feature-requirements.md`](./02-detailed-feature-requirements.md) | Logical module breakdown and explicit deterministic feature specifications (including unique post likes and cursor pagination) |
| **3. UI/UX & Design System** | [`docs/03-ui-ux-design-system.md`](./03-ui-ux-design-system.md) | Quiet Study Sanctuary tokens, color palette, typography, spacing scale, 9 screen states, skeleton loading, and optimistic updates |
| **4. Technical Architecture & DB** | [`docs/04-technical-architecture-and-database.md`](./04-technical-architecture-and-database.md) | Tech stack, folder structure, REST & WebSocket API contracts, pagination schemas, and database entity constraints |
| **5. Auth & Security Engineering** | [`docs/05-auth-and-security-engineering.md`](./05-auth-and-security-engineering.md) | Separation of authentication vs. server-side RBAC/ownership, OWASP ASVS L2 controls, KDF hashing, and Firestore Zero-Trust rules |
| **6. Performance & Observability** | [`docs/06-performance-and-observability.md`](./06-performance-and-observability.md) | `p95 < 300ms` read latency targets, caching, correlation IDs (`X-Correlation-Id`), and structured telemetry |
| **7. Agent Guidelines & Quality Gates** | [`docs/07-agent-guidelines-and-quality-gates.md`](./07-agent-guidelines-and-quality-gates.md) | SSOT rules, phased vertical-slice workflow, and 6 mandatory automated quality gates |
