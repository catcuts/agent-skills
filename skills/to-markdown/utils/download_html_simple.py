#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化的 HTML 下载脚本 - 只使用 urllib

当 urllib 失败时，返回特殊错误代码，让上层决定是否使用 agent-browser 或 Playwright
"""

import sys
import urllib.request
import urllib.error
import tempfile
import os
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


def get_cookie_for_url(url):
    """根据 URL 获取对应的环境变量 Cookie"""
    parsed = urlparse(url)
    domain = parsed.netloc

    # 将域名中的 . 替换为 _，作为环境变量名
    env_var_name = f"COOKIE_{domain.replace('.', '_')}"

    # 从环境变量读取 Cookie
    cookie = os.environ.get(env_var_name)

    if cookie:
        print(f"[Cookie] ✓ Using {env_var_name}", file=sys.stderr)
    else:
        print(f"[Cookie] No {env_var_name} found", file=sys.stderr)

    return cookie


def download_html_with_urllib(url):
    """使用 urllib 下载 HTML"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }

    # 检查是否有 Cookie
    cookie = get_cookie_for_url(url)
    if cookie:
        headers['Cookie'] = cookie

    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            # 自动检测编码
            charset = response.headers.get_content_charset() or 'utf-8'
            html = response.read().decode(charset, errors='replace')
            return html, response.status, 'urllib'
    except urllib.error.HTTPError as e:
        # 返回错误响应（可能包含错误页面内容）
        charset = e.headers.get_content_charset() or 'utf-8'
        html = e.read().decode(charset, errors='replace') if e.fp else ''
        return html, e.code, 'urllib'
    except urllib.error.URLError as e:
        print(f"[urllib] Network error: {e}", file=sys.stderr)
        return None, None, 'network_error'
    except Exception as e:
        print(f"[urllib] Unexpected error: {e}", file=sys.stderr)
        return None, None, 'unknown_error'


def is_anti_crawl_response(html, status_code=None):
    """检测是否遇到反爬限制"""
    if not html:
        return True

    # 检查状态码
    if status_code in [403, 429, 503]:
        return True

    # 检查内容长度
    if len(html) < 1000:
        return True

    # 检查反爬关键词
    html_lower = html.lower()
    anti_crawl_keywords = [
        'captcha',
        'access denied',
        'rate limit',
        'too many requests',
        'blocked',
        'verification required',
        'checking your browser',
        'security check',
        'javascript is not available',
    ]

    for keyword in anti_crawl_keywords:
        if keyword in html_lower:
            return True

    return False


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
        print("Usage: python download_html_simple.py <URL>", file=sys.stderr)
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

    # 尝试使用 urllib 下载
    html, status_code, method = download_html_with_urllib(url)

    # 判断是否需要降级
    if html and is_anti_crawl_response(html, status_code):
        print("[urllib] Anti-crawl detected or content incomplete", file=sys.stderr)
        print("SUGGEST_FALLBACK: agent-browser", file=sys.stderr)
        sys.exit(10)  # 特殊退出码：建议使用 agent-browser

    elif html is None:
        # urllib 网络错误
        print(f"[urllib] Download failed", file=sys.stderr)
        print("SUGGEST_FALLBACK: agent-browser", file=sys.stderr)
        sys.exit(11)  # 特殊退出码：网络错误，建议使用 agent-browser

    else:
        # urllib 成功
        temp_path = save_to_temp_file(html)
        print(temp_path)
        print(f"METHOD:urllib", file=sys.stderr)
        print(f"STATUS:{status_code}", file=sys.stderr)
        sys.exit(0)


if __name__ == '__main__':
    main()
