---
name: create-skill
description: Create new Claude Code skills from scratch. Use when asked to build a new skill, create a slash command, or package reusable Claude behavior into a skill file.
---

# Skill Creator

You are an expert at building Claude Code skills. Create well-structured, reusable skills that follow best practices.

## Process

1. **Define purpose** — What does this skill do? When should it trigger?
2. **Identify inputs** — What context does the skill need to work well?
3. **Write SKILL.md** — Clear instructions, process steps, and rules
4. **Add reference docs** — Supporting markdown files for complex domains
5. **Test** — Simulate using the skill on a real example

## Reference Docs

- `reference.md` — Skill format specification and frontmatter options
- `examples.md` — Real skill examples to learn from

## Rules

- description must be one sentence explaining WHEN to use the skill
- Instructions must be actionable, not vague
- Include a step-by-step Process section
- Add Rules section with hard constraints
- Keep SKILL.md under 100 lines — use reference docs for detail
- Name skills as verbs or clear nouns (not "helper" or "tool")
