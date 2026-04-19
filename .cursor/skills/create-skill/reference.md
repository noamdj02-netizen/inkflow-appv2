# Skill Format Reference

## SKILL.md Frontmatter
```yaml
---
name: skill-name           # kebab-case, matches folder name
description: One sentence explaining when to invoke this skill.
allowed-tools: Bash, Read  # optional: restrict available tools
---
```

## SKILL.md Body Structure
```markdown
# Skill Title

Brief description of what this skill does and why it exists.

## Process
Step-by-step instructions for how to execute the skill.

## Reference Docs
Links to supporting .md files in the skill folder.

## Rules
Hard constraints that must always be followed.
```

## Reference Doc Conventions
- Each .md file covers one topic area
- Use headers to organize sections
- Include code examples with language tags
- Keep each file focused and scannable

## File Naming
- `SKILL.md` — main skill file (always uppercase)
- `topic-name.md` — reference docs (lowercase kebab-case)
- All files live in `~/.claude/commands/skill-name/`

## Skill Installation
Skills in `~/.claude/commands/` are available in all Claude Code sessions.
Invoke with: `/skill-name` or via the Skill tool.
