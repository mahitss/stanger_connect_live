# 6. Performance & Observability Targets

## 6.1 Performance Standards & SLAs

- **API Read & Mutation Latency Target**:
  - **p95 API Read Latency**: **< 300 ms** (production baseline typically `< 15 ms` for in-memory/indexed reads).
  - **p99 API Read Latency**: **< 500 ms**.
- **Pagination & List Virtualization**:
  - Post likers (`GET /api/moments/:momentId/likes`) and Moment comment threads use bounded cursor/offset pagination (`limit` clamped `1..50`) and collapsible nested comment threads (`toggleCollapsedCommentThread`) so DOM node counts remain bounded regardless of dataset size.
- **Image & Asset Optimization**:
  - Client-side canvas downscaling and data-URL compression cap uploaded Moment images to `<= 650KB`.
  - Three.js 3D showcase automatically detects software WebGL renderers (`SwiftShader`/`llvmpipe`) and adapts pixel ratio and shadow maps to maintain smooth frame pacing.
- **Caching & State Synchronization**:
  - Single multiplexed WebSocket connection (`/ws`) broadcasts delta events (`moment:publish`, `moment:like_update`, `study:chat`, `game:update`) so clients never poll REST endpoints in background loops.

---

## 6.2 Observability, Correlation IDs & Telemetry

1. **Request / Correlation IDs (`X-Correlation-Id`)**:
   - Every incoming `/api/*` request is assigned a deterministic correlation ID (`req_<timestampBase36>_<randomHex>` or a validated client `X-Correlation-Id` header matching `^[a-zA-Z0-9_\-:.]{4,64}$`).
   - Returned on every response via `X-Correlation-Id` and `X-Response-Time-Ms` headers and embedded in JSON payloads.
2. **Rolling Latency Histogram (`p50 / p95 / p99`)**:
   - The server records execution duration (`performance.now()`) for every `/api/*` request in a bounded ring buffer (last 200 requests) and computes `p50Ms`, `p95Ms`, `p99Ms`, `avgMs`, and `withinSlaTarget` (`p95Ms < 300`) via `computeApiLatencyPercentiles`.
3. **Structured Request Logging**:
   - Recent API requests are recorded as structured telemetry entries (`{ correlationId, method, path, statusCode, durationMs, timestamp }`) inspectable live via `GET /api/engineering/spec-status` and the in-app **7-Pillar Engineering Specification & Observability Suite**.
