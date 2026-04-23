# Encoding Recovery Patterns as Skills

## Why Create Recovery Skills
- Recurring failures should be solved once and encoded
- Future occurrences can be detected and fixed automatically
- Knowledge is preserved even as team changes

## Recovery Skill Structure
```markdown
---
name: fix-[failure-type]
description: Automatically detect and fix [failure type]. Use when [symptoms].
---

# Fix [Failure Type]

## Detection
How to confirm this is actually this failure type.

## Root Cause Analysis
Common causes and how to identify which one it is.

## Fix Steps
1. Step one
2. Step two

## Verification
How to confirm the fix worked.

## Prevention
How to prevent this from happening again.
```

## Example: Memory Leak Recovery Skill
When you find and fix a memory leak, encode:
1. The pattern that caused it (e.g., "event listeners not cleaned up in React useEffect")
2. How to detect it quickly next time
3. The standard fix
4. A test to verify it's fixed

## Continuous Improvement
After each incident:
- Update the relevant skill with new learnings
- Add the failure signature to `pattern-recognition.md`
- Add the fix to the appropriate skill file
