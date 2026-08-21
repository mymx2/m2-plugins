# Observability Review Checklist

Load and work this checklist when reviewing a feature that will run in production, or any change adding I/O, retries, queues, or cross-service calls. A feature that ships without telemetry is unoperable — the first user bug becomes archaeology.

## On-Call Questions First

- [ ] The on-call engineer's questions about this feature are written down, and each signal maps to one. If you can't name the questions, telemetry is noise.

## Structured Logging

- [ ] Log lines are structured (JSON) with a stable event name and machine-readable fields, not string interpolation.
- [ ] A correlation/request ID is generated at the system boundary and attached to every log line and outbound call.
- [ ] Correlation ID propagated on every outbound call and async boundary (HTTP headers, queue metadata).
- [ ] Log levels consistent: `error` = invariant broken; `warn` = degraded but handled; `info` = significant business event; `debug` = off in production.
- [ ] No secrets, tokens, passwords, or full PII in log lines; fields are allowlisted (no whole request/response bodies, no auth headers).
- [ ] Actual output spot-checked: structured fields, not `[object Object]`.

## Metrics

- [ ] RED metrics (Rate, Errors, Duration-as-histogram) for request-driven endpoints/dependencies; USE (Utilization, Saturation, Errors) for resources.
- [ ] Cardinality bounded: labels come from small fixed sets (route template, status class, provider) — never user IDs, raw URLs, or error-message text.
- [ ] Latency tracked as a histogram with p50/p95/p99, never an average.
- [ ] Status codes grouped by class (`5xx`, not `503`); queue depth and processing duration tracked for every worker/queue.

## Tracing

- [ ] Distributed tracing (OpenTelemetry) initialized at startup before other imports; auto-instrumentation for HTTP, gRPC, and DB clients.
- [ ] Trace context propagated on every outbound call (W3C `traceparent`/`tracestate`) and extracted from every inbound request; survives async boundaries.
- [ ] Manual spans only around meaningful internal units of work, with attributes on-call will filter by; no secrets or PII as span attributes.
- [ ] Head-based sampling at a low default rate; keep 100% of errors if tail sampling is available.

## Alerting

- [ ] Alerts are on symptoms users feel, not causes (CPU/memory).
- [ ] Every alert is actionable, links a runbook, has a threshold justified by SLO/data, and uses two severities (page / ticket).
- [ ] Each new alert test-fired once: reached the right channel, runbook link works; no alerts that fire daily and get acknowledged without action.

## Dashboards

- [ ] Service health dashboard exists: error rate, latency p99, traffic, saturation.
- [ ] Dependency health panel shows per-service error rates and latency.
- [ ] Dashboard answers the on-call questions from the top of this checklist — not "everything except the answer"; default time range sensible (1h-6h, not 30d).

## Pre-Launch Gate

- [ ] Structured logs flowing to the log aggregator.
- [ ] RED metrics visible in dashboards for every new endpoint and dependency.
- [ ] At least one symptom-based alert configured, with runbook, test-fired.
- [ ] A request can be traced across every service it touches; on-call knows where the runbooks are.

## Verify the Telemetry

- [ ] Telemetry itself was verified: an induced failure in staging was located via logs/metrics/traces alone.
