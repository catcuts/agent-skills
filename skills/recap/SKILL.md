---
name: recap
description: Analyze Claude Code usage history from history.jsonl to generate daily activity reports. Shows session count, interaction frequency, active time ranges, and groups activities by project. Use when user asks "what did I do yesterday/last week", "show my activity history", "recap my work", or needs to review their Claude Code usage patterns for any time period.
---

# Claude Code Activity Recap

Generate structured reports of Claude Code usage by analyzing the session history.

## Quick Start

Generate a report for yesterday (default):

```bash
python scripts/recap.py
```

Generate a report for a specific date:

```bash
python scripts/recap.py 2026-02-24
```

## Report Contents

The report includes:

- **Statistics overview**: Total sessions, interaction count, active time range
- **Activity by project**: All sessions grouped by project directory
- **Detailed timeline**: Each interaction with timestamp

## Script Location

The `scripts/recap.py` script automatically locates `history.jsonl` at:
- `~/.claude/history.jsonl` (Linux/Mac)
- `~/AppData/Roaming/Claude/history.jsonl` (Windows)

## Output Format

Reports use Markdown format with emoji indicators for readability:

```markdown
## 📅 Claude Code 活动报告 - 2026-02-24

**统计概览**
- 会话数量: 26 个
- 交互次数: 60 次
- 活跃时段: 09:07 - 18:03

### 📁 /path/to/project
**会话 abc12345** (5 次交互)
  [09:15:28] User message here
  [09:20:31] Another interaction
```

## Implementation Notes

The script:
1. Parses JSONL format from `history.jsonl`
2. Converts millisecond timestamps to readable dates
3. Groups activities by `sessionId`
4. Supports cross-platform execution (Windows/Linux/Mac)
5. Handles UTF-8 encoding for international characters
