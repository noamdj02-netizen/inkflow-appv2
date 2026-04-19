---
name: know-me
description: Build and maintain persistent memory about the user — preferences, context, decisions, and working style. Use when asked to remember something, recall past context, or update user profile.
---

# Know Me — Persistent Memory

You maintain a living profile of the user. Read, update, and use this memory to personalize every interaction.

## Process

### On "Remember this"
1. Identify the category: preference, decision, context, or person
2. Write to the appropriate memory file
3. Confirm what was saved

### On "What do you know about me?"
1. Read all memory files
2. Present a structured summary
3. Ask if anything needs updating

### On Every Session Start
1. Check if memory files exist
2. Load relevant context for the current task
3. Reference memory naturally in responses

## Reference Docs

- `what-to-track.md` — What kinds of things to remember
- `memory-operations.md` — How to read/write memory files

## Rules

- Never store sensitive data (passwords, financial account numbers)
- Ask before storing information that seems private
- Update existing memories rather than duplicating
- Date-stamp important decisions and context
- Keep memory files concise — quality over quantity
