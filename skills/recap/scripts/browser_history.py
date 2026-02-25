"""
Chrome Browser History Recap

Generates structured reports of Chrome browsing activity by analyzing
browser history databases for all Chrome profiles.

Usage:
    python scripts/browser_history.py              # Yesterday's history
    python scripts/browser_history.py 2026-02-24   # Specific date
    python scripts/browser_history.py today        # Today's history
"""

import os
import sys
import shutil
import sqlite3
from datetime import datetime, timedelta
from urllib.parse import urlparse
import argparse

# Chrome data paths
CHROME_BASE = r"C:\Users\catcuts\AppData\Local\Google\Chrome\User Data"
EDGE_BASE = r"C:\Users\catcuts\AppData\Local\Microsoft\Edge\User Data"


def get_all_profiles(base_path, profile_names):
    """Get all available profiles from browser base path."""
    profiles = []
    for profile in profile_names:
        history_path = os.path.join(base_path, profile, "History")
        if os.path.exists(history_path):
            profiles.append((profile, history_path))
    return profiles


def read_history_safe(history_path, target_date):
    """Safely read history file, handling locked files."""
    temp_path = None
    try:
        # Try to copy file (works if browser is not using that profile)
        import tempfile
        temp_fd, temp_path = tempfile.mkstemp(suffix='.db')
        os.close(temp_fd)
        shutil.copy2(history_path, temp_path)

        conn = sqlite3.connect(temp_path)
        cursor = conn.cursor()

        # Query for target date
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        query = """
        SELECT url, title, last_visit_time, visit_count, typed_count
        FROM urls
        WHERE last_visit_time/1000000-11644473600 >= ? AND last_visit_time/1000000-11644473600 < ?
        ORDER BY last_visit_time DESC
        """

        cursor.execute(query, (start_of_day.timestamp(), end_of_day.timestamp()))
        results = cursor.fetchall()

        conn.close()
        return results

    except PermissionError:
        return None  # File is locked (profile is in use)
    except Exception as e:
        return []
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass


def categorize_url(url, title):
    """Categorize URLs by domain/pattern."""
    if 'localhost' in url:
        return '本地开发服务器'

    domain = urlparse(url).netloc.lower()

    if 'github.com' in domain:
        return 'GitHub'
    elif 'gitlab.com' in domain:
        return 'GitLab'
    elif 'google.com' in domain or 'googleapis.com' in domain:
        if 'cloud.google.com' in url:
            return 'Google Cloud'
        elif 'gemini.google.com' in url:
            return 'Gemini AI'
        else:
            return 'Google 服务'
    elif 'lovable.dev' in domain:
        return 'Lovable (AI 开发)'
    elif 'rss.app' in domain:
        return 'RSS 工具'
    elif 'npmjs.com' in domain:
        return 'NPM'
    elif 'x.com' in domain or 'twitter.com' in domain:
        return 'X/Twitter'
    elif 'linkedin.com' in domain:
        return 'LinkedIn'
    elif 'youtube.com' in domain:
        return 'YouTube'
    elif 'stackoverflow.com' in domain:
        return 'Stack Overflow'
    else:
        return f'其他 ({domain})'


def format_timestamp(chrome_timestamp):
    """Convert Chrome timestamp to readable datetime."""
    return datetime.fromtimestamp(chrome_timestamp/1000000-11644473600)


def generate_report(target_date):
    """Generate browsing history report for target date."""

    # Profile lists to check
    chrome_profiles = ["Default", "Profile 3", "Profile 4", "Profile 5", "Profile 6", "Profile 8"]
    edge_profiles = ["Default", "Profile 1", "Profile 2", "Profile 3"]

    print(f"\n{'='*80}")
    print(f"[Browser Report] {target_date.strftime('%Y-%m-%d')}")
    print(f"{'='*80}\n")

    # Check Chrome profiles
    chrome_profiles_list = get_all_profiles(CHROME_BASE, chrome_profiles)

    if not chrome_profiles_list:
        print("未找到 Chrome 配置文件")
        return

    all_visits = []
    active_profiles = []

    for profile_name, history_path in chrome_profiles_list:
        visits = read_history_safe(history_path, target_date)

        if visits is None:
            # Profile is locked (in use)
            print(f"[!] {profile_name}: 正在使用，无法读取")
            continue
        elif isinstance(visits, list):
            active_profiles.append(profile_name)
            for url, title, visit_time, visit_count, typed_count in visits:
                actual_time = format_timestamp(visit_time)
                category = categorize_url(url, title)

                all_visits.append({
                    'time': actual_time,
                    'url': url,
                    'title': title if title else '(无标题)',
                    'category': category,
                    'profile': profile_name
                })

    if not all_visits:
        print(f"[X] {target_date.strftime('%Y-%m-%d')} 没有浏览记录")
        return

    # Sort by time
    all_visits.sort(key=lambda x: x['time'], reverse=True)

    print(f"[OK] 已读取配置文件: {', '.join(active_profiles)}")
    print(f"[OK] 总访问次数: {len(all_visits)} 次\n")

    # Group by time periods
    time_periods = {
        '上午 (06:00-12:00)': [],
        '下午 (12:00-18:00)': [],
        '晚上 (18:00-24:00)': [],
        '深夜 (00:00-06:00)': []
    }

    for visit in all_visits:
        hour = visit['time'].hour

        if 6 <= hour < 12:
            period = '上午 (06:00-12:00)'
        elif 12 <= hour < 18:
            period = '下午 (12:00-18:00)'
        elif 18 <= hour < 24:
            period = '晚上 (18:00-24:00)'
        else:
            period = '深夜 (00:00-06:00)'

        time_periods[period].append(visit)

    # Display by time period
    for period_name, visits in time_periods.items():
        if not visits:
            continue

        print(f"\n【{period_name}】 - 共 {len(visits)} 次访问")
        print("-" * 80)

        # Group by category
        categories = {}
        for visit in visits:
            cat = visit['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(visit)

        # Display each category
        for cat, cat_visits in sorted(categories.items(), key=lambda x: len(x[1]), reverse=True):
            print(f"\n  {cat} ({len(cat_visits)} 次)")
            for v in cat_visits[:5]:  # Show top 5 per category
                time_str = v['time'].strftime("%H:%M")
                title = v['title'][:60] if v['title'] else '(无标题)'
                print(f"    [{time_str}] {title}")
            if len(cat_visits) > 5:
                print(f"    ... 还有 {len(cat_visits) - 5} 条")

    print(f"\n{'='*80}\n")


def main():
    parser = argparse.ArgumentParser(description='Generate browser history recap')
    parser.add_argument('date', nargs='?', help='Target date (YYYY-MM-DD) or "today"')
    args = parser.parse_args()

    # Determine target date
    if args.date:
        if args.date.lower() == 'today':
            target_date = datetime.now()
        else:
            try:
                target_date = datetime.strptime(args.date, '%Y-%m-%d')
            except ValueError:
                print("Invalid date format. Use YYYY-MM-DD or 'today'")
                sys.exit(1)
    else:
        # Default to yesterday
        target_date = datetime.now() - timedelta(days=1)

    generate_report(target_date)


if __name__ == '__main__':
    main()
