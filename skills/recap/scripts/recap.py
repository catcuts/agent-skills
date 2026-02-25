#!/usr/bin/env python3
"""
Claude Code Activity Recap Script

Analyzes Claude Code history.jsonl to generate daily activity reports.
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict


def get_history_path():
    """Get the path to history.jsonl based on platform."""
    home = Path.home()
    history_path = home / ".claude" / "history.jsonl"
    if not history_path.exists():
        # Alternative location for Windows
        history_path = home / "AppData" / "Roaming" / "Claude" / "history.jsonl"
    return history_path


def parse_history(target_date, history_path=None):
    """
    Parse Claude Code history for a specific date.

    Args:
        target_date: str in format 'YYYY-MM-DD'
        history_path: optional path to history.jsonl

    Returns:
        dict: sessions grouped by session_id
    """
    if history_path is None:
        history_path = get_history_path()

    if not history_path.exists():
        print(f"Error: History file not found at {history_path}")
        return {}

    sessions = defaultdict(lambda: {
        'project': '',
        'count': 0,
        'activities': []
    })

    with open(history_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue

            try:
                data = json.loads(line)
                timestamp = data['timestamp'] / 1000
                dt = datetime.fromtimestamp(timestamp)
                date_str = dt.strftime('%Y-%m-%d')

                if date_str == target_date:
                    session_id = data.get('sessionId', 'unknown')[:8]
                    project = data.get('project', 'unknown')
                    display = data.get('display', '')

                    sessions[session_id]['project'] = project
                    sessions[session_id]['count'] += 1
                    time_str = dt.strftime('%H:%M:%S')
                    sessions[session_id]['activities'].append(f'[{time_str}] {display}')

            except (json.JSONDecodeError, KeyError) as e:
                continue

    return dict(sessions)


def generate_report(sessions, target_date):
    """Generate a formatted activity report."""
    if not sessions:
        return f"No activity found for {target_date}"

    total_interactions = sum(s['count'] for s in sessions.values())

    # Calculate time range
    all_times = []
    for s in sessions.values():
        for act in s['activities']:
            try:
                time_str = act.split(']')[0].strip('[')
                all_times.append(datetime.strptime(time_str, '%H:%M:%S'))
            except:
                continue

    time_range = ""
    if all_times:
        time_range = f"{min(all_times).strftime('%H:%M')} - {max(all_times).strftime('%H:%M')}"

    lines = []
    lines.append(f"## 📅 Claude Code 活动报告 - {target_date}")
    lines.append("")
    lines.append(f"**统计概览**")
    lines.append(f"- 会话数量: {len(sessions)} 个")
    lines.append(f"- 交互次数: {total_interactions} 次")
    if time_range:
        lines.append(f"- 活跃时段: {time_range}")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Group sessions by project
    projects = defaultdict(list)
    for session_id, info in sessions.items():
        projects[info['project']].append((session_id, info))

    for project, session_list in projects.items():
        lines.append(f"### 📁 {project}")
        lines.append("")

        for session_id, info in session_list:
            lines.append(f"**会话 {session_id}** ({info['count']} 次交互)")
            lines.append("")

            # Show all activities
            for act in info['activities']:
                lines.append(f"  {act}")

            lines.append("")

    return '\n'.join(lines)


def main():
    """Main entry point."""
    # Ensure UTF-8 output for Windows
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    # Default to yesterday
    target_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

    # Allow date override via command line
    if len(sys.argv) > 1:
        target_date = sys.argv[1]

    sessions = parse_history(target_date)
    report = generate_report(sessions, target_date)
    print(report)


if __name__ == "__main__":
    main()
