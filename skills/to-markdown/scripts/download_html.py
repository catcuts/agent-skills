#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 URL 下载 HTML 内容并保存到临时文件
"""

import sys
import urllib.request
import urllib.error
from datetime import datetime
import tempfile
import os
from urllib.parse import urlparse


def download_html(url):
    """下载 HTML 内容"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }

    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            # 自动检测编码
            charset = response.headers.get_content_charset() or 'utf-8'
            html = response.read().decode(charset, errors='replace')
            return html
    except urllib.error.URLError as e:
        print(f"ERROR: Failed to download URL: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


def save_to_temp_file(html, prefix='downloaded_html'):
    """保存到临时文件"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    random_suffix = os.urandom(2).hex()
    filename = f'{prefix}_{timestamp}_{random_suffix}.html'
    temp_path = os.path.join(tempfile.gettempdir(), filename)

    with open(temp_path, 'w', encoding='utf-8') as f:
        f.write(html)

    return temp_path


def main():
    if len(sys.argv) < 2:
        print("ERROR: URL is required", file=sys.stderr)
        print("Usage: python download_html.py <URL>", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]

    # 验证 URL 格式
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            print(f"ERROR: Invalid URL format: {url}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: Invalid URL: {e}", file=sys.stderr)
        sys.exit(1)

    # 下载 HTML
    html = download_html(url)

    # 保存到临时文件
    temp_path = save_to_temp_file(html)

    # 输出临时文件路径
    print(temp_path)
    # 输出 URL 到 stderr（用于后续标签库匹配）
    print(f"URL:{url}", file=sys.stderr)


if __name__ == '__main__':
    main()
