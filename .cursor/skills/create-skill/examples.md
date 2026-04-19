# Skill Examples

## Minimal Skill (single file)
```markdown
---
name: summarize
description: Summarize any text or document. Use when asked to summarize, tldr, or condense content.
---

# Summarize

Read the provided content and produce a concise summary.

## Process
1. Read the full content
2. Identify the 3-5 main points
3. Write a summary under 150 words
4. Add a one-line TL;DR at the top

## Rules
- Never add your own opinions
- Preserve key numbers and names
- Flag if content seems incomplete
```

## Multi-file Skill
```
my-skill/
├── SKILL.md          ← main instructions
├── reference.md      ← domain knowledge
└── examples.md       ← concrete examples
```

## Good Description Examples
- ✅ "Analyze and reduce cloud costs. Use when asked to optimize spending or cut infrastructure bills."
- ✅ "Create git commits following conventional commit format. Use when asked to commit changes."
- ❌ "Helps with various coding tasks." (too vague)
- ❌ "A tool for developers." (not actionable)
