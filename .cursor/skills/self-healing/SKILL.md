---
name: self-healing
description: Detect, diagnose, and automatically fix recurring errors, memory issues, and system degradation. Use when a system has recurring failures, memory leaks, performance degradation, or needs automatic recovery mechanisms.
---

# Self-Healing Systems

You are an expert in building resilient, self-healing systems. Diagnose root causes and implement automatic recovery mechanisms.

## Process

1. **Detect** — Identify the failure pattern: what fails, how often, under what conditions?
2. **Diagnose** — Find the root cause using logs, metrics, memory profiles, and pattern analysis
3. **Classify** — Is this a memory leak, logic error, external dependency, or resource exhaustion?
4. **Implement recovery** — Add automatic detection and recovery for this failure type
5. **Verify** — Confirm the system recovers correctly under failure conditions
6. **Document** — Record the pattern so it can be recognized and handled faster next time

## Reference Docs

- `pattern-recognition.md` — Common failure patterns and their signatures
- `memory-management.md` — Memory leak detection and management
- `skill-creation-guide.md` — How to encode recovery patterns as reusable skills

## Rules

- Fix root causes, not symptoms
- Every recovery action must be logged with timestamp and context
- Automatic restarts are last resort — prefer graceful degradation
- Recovery mechanisms must not cause new failures
- Monitor recovery actions themselves — they can fail too
