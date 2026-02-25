---
name: recap
description: Generate comprehensive daily activity reports from multiple sources. Includes (1) Claude Code usage analysis from history.jsonl showing session count, interaction frequency, active time ranges, and project-based grouping; (2) Chrome browser history analysis showing visited sites, categories, and time-based activity breakdown. Use when user asks "what did I do yesterday/last week", "show my activity history", "recap my work", "check my browser history", "what websites did I visit", or needs to review usage patterns from either Claude Code or Chrome browser.
---

# Daily Activity Recap

Generate comprehensive activity reports from multiple data sources to review your work and browsing patterns.

## Overview

This skill provides two types of activity reports:

1. **Claude Code Activity Report** - Analyzes your Claude Code usage sessions
2. **Browser History Report** - Analyzes Chrome browser browsing activity

## Claude Code Activity Report

Analyze Claude Code usage history from `history.jsonl`.

### Quick Start

Generate a report for yesterday (default):

```bash
python scripts/recap.py
```

Generate a report for a specific date:

```bash
python scripts/recap.py 2026-02-24
```

### Report Contents

- **Statistics overview**: Total sessions, interaction count, active time range
- **Activity by project**: All sessions grouped by project directory
- **Detailed timeline**: Each interaction with timestamp

### Script Location

The `scripts/recap.py` script automatically locates `history.jsonl` at:
- `~/.claude/history.jsonl` (Linux/Mac)
- `~/AppData/Roaming/Claude/history.jsonl` (Windows)

### Output Format

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

## Browser History Report

Analyze Chrome browser history from all active Chrome profiles.

### Quick Start

Generate a report for yesterday (default):

```bash
python scripts/browser_history.py
```

Generate a report for a specific date:

```bash
python scripts/browser_history.py 2026-02-24
```

Generate a report for today:

```bash
python scripts/browser_history.py today
```

### Report Contents

- **Profile detection**: Automatically finds all Chrome profiles (Default, Profile 3, etc.)
- **Visit statistics**: Total visit count, time distribution
- **Categorized activity**: Groups visits by category (GitHub, Google, local servers, etc.)
- **Time-based breakdown**: Shows activity by morning/afternoon/evening/night

### Browser History Locations

The script automatically checks these paths:

**Chrome**:
- `C:\Users\<username>\AppData\Local\Google\Chrome\User Data\Default\History`
- `C:\Users\<username>\AppData\Local\Google\Chrome\User Data\Profile 3\History`
- `C:\Users\<username>\AppData\Local\Google\Chrome\User Data\Profile 4\History`
- etc.

**Edge** (not yet fully implemented):
- `C:\Users\<username>\AppData\Local\Microsoft\Edge\User Data\Default\History`

### Important Notes

1. **Locked profiles**: If Chrome is currently running, the active profile's history file will be locked. The script will skip locked profiles and report which ones couldn't be read.

2. **Close Chrome first**: For complete history including the currently active profile, close all Chrome windows before running the script.

3. **Automatic categorization**: Visits are automatically categorized by domain:
   - GitHub, GitLab, NPM
   - Google services (Cloud, Gemini, etc.)
   - Local development servers (localhost)
   - Social media (X/Twitter, LinkedIn, YouTube)
   - And more

### Output Format

```markdown
📱 浏览器活动报告 - 2026-02-24
================================================================================

✓ 已读取配置文件: Default, Profile 3
✓ 总访问次数: 239 次

【上午 (06:00-12:00)】 - 共 86 次访问
--------------------------------------------------------------------------------

  GitHub (13 次)
    [17:06] godkingjay/selenium-twitter-scraper
    [17:06] vladkens/twscrape: 2025! X / Twitter API scrapper
    ...

  本地开发服务器 (12 次)
    [17:29] 智慧物联管理平台
    [16:42] 智慧物聯管理平台
    ...
```

## Implementation Notes

### recap.py

The script:
1. Parses JSONL format from `history.jsonl`
2. Converts millisecond timestamps to readable dates
3. Groups activities by `sessionId`
4. Supports cross-platform execution (Windows/Linux/Mac)
5. Handles UTF-8 encoding for international characters

### browser_history.py

The script:
1. Scans all Chrome profile directories
2. Copies locked history files to temp location for safe reading
3. Converts Chrome timestamps (microseconds since 1601-01-01) to readable dates
4. Categorizes URLs by domain patterns
5. Groups activity by time periods (morning/afternoon/evening/night)
6. Handles permission errors gracefully for locked profiles
