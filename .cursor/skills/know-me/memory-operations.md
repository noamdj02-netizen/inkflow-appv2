# Memory Operations

## Memory File Locations
```
~/.claude/projects/[project]/memory/
├── MEMORY.md          ← index of all memory files
├── user.md            ← user profile and preferences
├── decisions.md       ← important decisions made
├── people.md          ← people the user works with
└── preferences.md     ← working style and preferences
```

## Reading Memory
Always read MEMORY.md first for the index, then load specific files relevant to the current task.

## Writing Memory
Use the Write or Edit tool to update memory files. Always:
1. Read the file first
2. Update or append (don't overwrite unrelated content)
3. Add date to time-sensitive entries

## Memory Entry Format
```markdown
## [Category]

**[Topic]** (added: YYYY-MM-DD)
[Content]
```

## Updating MEMORY.md Index
When adding a new memory file, add a line to MEMORY.md:
```
- [filename.md](filename.md) — brief description
```

## Memory Hygiene
- Review and clean up stale memories monthly
- Remove memories that are no longer relevant
- Consolidate duplicate information
- Flag memories that need verification
