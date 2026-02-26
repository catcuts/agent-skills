#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 URL 下载 HTML 内容并保存到临时文件

降级策略（自动安装）：
1. 首选：urllib.request（快速、轻量）
2. 第二：agent-browser skill（自动安装）
3. 最后：Playwright（自动安装）

支持 Cookie：
- 从环境变量读取：COOKIE_<域名>（域名中的 . 替换为 _）
- 例如：COOKIE_x_com、COOKIE_twitter_com
"""

import sys
import urllib.request
import urllib.error
import subprocess
import tempfile
import os
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


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
    ]

    for keyword in anti_crawl_keywords:
        if keyword in html_lower:
            return True

    return False


def get_cookie_for_url(url):
    """根据 URL 获取对应的环境变量 Cookie"""
    parsed = urlparse(url)
    domain = parsed.netloc  # 例如：x.com, twitter.com

    # 将域名中的 . 替换为 _，作为环境变量名
    env_var_name = f"COOKIE_{domain.replace('.', '_')}"

    # 从环境变量读取 Cookie
    cookie = os.environ.get(env_var_name)

    if cookie:
        print(f"[Cookie] 找到环境变量 {env_var_name}", file=sys.stderr)
        print(f"[Cookie] 使用 Cookie: {cookie[:50]}...", file=sys.stderr)
    else:
        print(f"[Cookie] 未找到环境变量 {env_var_name}，不使用 Cookie", file=sys.stderr)

    return cookie


def check_agent_browser_skill_installed():
    """检查 agent-browser skill 是否已安装"""
    home_dir = Path.home()
    skill_path = home_dir / '.claude' / 'skills' / 'agent-browser'
    return skill_path.exists()


def install_agent_browser_skill():
    """自动安装 agent-browser skill"""
    print("[agent-browser] Not installed, installing automatically...", file=sys.stderr)
    print("[agent-browser] This may take a minute...", file=sys.stderr)

    try:
        # 使用 npx skills add 安装，添加必要参数免交互
        cmd = [
            'npx', 'skills', 'add',
            'vercel-labs/agent-browser',
            '--skill', 'agent-browser',
            '-y',  # 自动确认
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180,  # 3分钟超时
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode == 0:
            print("[agent-browser] ✓ Installation successful!", file=sys.stderr)
            return True
        else:
            print(f"[agent-browser] ✗ Installation failed: {result.stderr}", file=sys.stderr)
            return False

    except subprocess.TimeoutExpired:
        print("[agent-browser] ✗ Installation timed out", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[agent-browser] ✗ Installation error: {e}", file=sys.stderr)
        return False


def ensure_agent_browser_skill():
    """确保 agent-browser skill 已安装"""
    if check_agent_browser_skill_installed():
        print("[agent-browser] ✓ Already installed", file=sys.stderr)
        return True

    # 尝试自动安装
    return install_agent_browser_skill()


def download_html_with_urllib(url):
    """使用 urllib 下载 HTML（首选方案）"""
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
        print(f"ERROR: Failed to download URL: {e}", file=sys.stderr)
        return None, None, 'urllib'
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}", file=sys.stderr)
        return None, None, 'urllib'


def download_html_with_agent_browser(url):
    """使用 agent-browser skill 下载 HTML"""
    print("[fallback] Trying agent-browser skill...", file=sys.stderr)

    # 确保已安装
    if not ensure_agent_browser_skill():
        print("[agent-browser] Failed to install, skipping...", file=sys.stderr)
        return None, None, 'agent_browser_unavailable'

    try:
        # 使用 agent-browser 命令行工具
        print("[agent-browser] Opening page...", file=sys.stderr)
        result = subprocess.run(
            ['agent-browser', 'open', url],
            capture_output=True,
            timeout=60,
            check=True
        )

        # 等待页面加载
        print("[agent-browser] Waiting for page load...", file=sys.stderr)
        subprocess.run(
            ['agent-browser', 'wait', '--load', 'networkidle'],
            capture_output=True,
            timeout=30,
            check=True
        )

        # 获取 HTML
        print("[agent-browser] Extracting HTML...", file=sys.stderr)
        result = subprocess.run(
            ['agent-browser', 'get', 'html'],
            capture_output=True,
            text=True,
            timeout=10,
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode == 0:
            html = result.stdout
            print(f"[agent-browser] ✓ Success, HTML size: {(len(html) / 1024):.2f} KB", file=sys.stderr)

            # 关闭浏览器
            subprocess.run(
                ['agent-browser', 'close'],
                capture_output=True,
                timeout=10
            )

            return html, 200, 'agent_browser'
        else:
            print(f"[agent-browser] Failed to get HTML", file=sys.stderr)
            subprocess.run(['agent-browser', 'close'], capture_output=True, timeout=10)
            return None, None, 'agent_browser_failed'

    except subprocess.TimeoutExpired:
        print("[agent-browser] Timeout", file=sys.stderr)
        subprocess.run(['agent-browser', 'close'], capture_output=True, timeout=10)
        return None, None, 'agent_browser_failed'
    except subprocess.CalledProcessError as e:
        print(f"[agent-browser] Error: {e}", file=sys.stderr)
        subprocess.run(['agent-browser', 'close'], capture_output=True, timeout=10)
        return None, None, 'agent_browser_failed'
    except Exception as e:
        print(f"[agent-browser] Unexpected error: {e}", file=sys.stderr)
        subprocess.run(['agent-browser', 'close'], capture_output=True, timeout=10)
        return None, None, 'agent_browser_failed'


def check_playwright_installed():
    """检查 Playwright 是否已安装"""
    script_dir = Path(__file__).parent
    playwright_path = script_dir / 'node_modules' / 'playwright'
    return playwright_path.exists()


def install_playwright():
    """自动安装 Playwright"""
    print("[Playwright] Not installed, installing automatically...", file=sys.stderr)
    print("[Playwright] This may take a few minutes...", file=sys.stderr)

    script_dir = Path(__file__).parent

    try:
        # 安装依赖
        print("[Playwright] Installing npm packages...", file=sys.stderr)
        result = subprocess.run(
            ['npm', 'install'],
            cwd=script_dir,
            capture_output=True,
            timeout=300,  # 5分钟超时
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode != 0:
            print(f"[Playwright] npm install failed: {result.stderr}", file=sys.stderr)
            return False

        # 安装浏览器
        print("[Playwright] Installing Chromium browser...", file=sys.stderr)
        result = subprocess.run(
            ['npx', 'playwright', 'install', 'chromium'],
            cwd=script_dir,
            capture_output=True,
            timeout=600,  # 10分钟超时
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode == 0:
            print("[Playwright] ✓ Installation successful!", file=sys.stderr)
            return True
        else:
            print(f"[Playwright] Browser installation failed: {result.stderr}", file=sys.stderr)
            return False

    except subprocess.TimeoutExpired:
        print("[Playwright] ✗ Installation timed out", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[Playwright] ✗ Installation error: {e}", file=sys.stderr)
        return False


def ensure_playwright():
    """确保 Playwright 已安装"""
    if check_playwright_installed():
        print("[Playwright] ✓ Already installed", file=sys.stderr)
        return True

    # 尝试自动安装
    return install_playwright()


def download_html_with_playwright(url):
    """使用 Playwright 下载 HTML（最后备用方案）"""
    print("[fallback] Trying Playwright...", file=sys.stderr)

    script_dir = Path(__file__).parent
    script_path = script_dir / 'download_html_playwright.js'

    # 检查脚本是否存在
    if not script_path.exists():
        print(f"[Playwright] Script not found: {script_path}", file=sys.stderr)
        return None, None, 'playwright_unavailable'

    # 检查 node 是否可用
    try:
        subprocess.run(['node', '--version'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[Playwright] Node.js not found.", file=sys.stderr)
        return None, None, 'playwright_unavailable'

    # 确保已安装
    if not ensure_playwright():
        print("[Playwright] Failed to install, skipping...", file=sys.stderr)
        return None, None, 'playwright_unavailable'

    # 检查是否配置了代理
    proxy = os.environ.get('PLAYWRIGHT_PROXY')
    if proxy:
        print(f"[Playwright] 检测到代理配置: {proxy}", file=sys.stderr)

    try:
        if proxy:
            print(f"[Playwright] 使用代理下载: {proxy}", file=sys.stderr)
        else:
            print("[Playwright] 直连下载（无代理）", file=sys.stderr)

        # 传递环境变量给 Playwright 脚本
        env = os.environ.copy()

        result = subprocess.run(
            ['node', str(script_path), url],
            capture_output=True,
            text=True,
            timeout=120,
            encoding='utf-8',
            errors='replace',
            env=env  # 使用当前环境变量（包含 COOKIE_xxx 和 PLAYWRIGHT_PROXY）
        )

        if result.returncode == 0:
            temp_path = result.stdout.strip()
            # 读取下载的 HTML
            with open(temp_path, 'r', encoding='utf-8') as f:
                html = f.read()
            return html, 200, 'playwright'
        else:
            print(f"[Playwright] 下载失败: {result.stderr}", file=sys.stderr)
            return None, None, 'playwright_failed'

    except subprocess.TimeoutExpired:
        print("[Playwright] 超时", file=sys.stderr)
        return None, None, 'playwright_failed'
    except Exception as e:
        print(f"[Playwright] 错误: {e}", file=sys.stderr)
        return None, None, 'playwright_failed'


def download_html(url):
    """
    下载 HTML 内容（自动降级并自动安装依赖）

    Returns:
        (html, status_code, method)
    """
    # 首选：使用 urllib
    html, status_code, method = download_html_with_urllib(url)

    # 检测是否需要降级
    if html and is_anti_crawl_response(html, status_code):
        print("[urllib] Anti-crawl detected, trying fallback...", file=sys.stderr)

        # 第一降级：agent-browser skill（自动安装）
        html, status_code, method = download_html_with_agent_browser(url)

        # 如果 agent-browser 失败，继续降级到 Playwright
        if html is None:
            html, status_code, method = download_html_with_playwright(url)

    elif html is None:
        # 如果是 urllib 网络错误（非反爬），尝试 Playwright
        html, status_code, method = download_html_with_playwright(url)

    return html, status_code, method


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

    # 下载 HTML（自动降级并自动安装）
    html, status_code, method = download_html(url)

    if html is None:
        print(f"ERROR: All download methods failed for: {url}", file=sys.stderr)
        sys.exit(1)

    # 保存到临时文件
    temp_path = save_to_temp_file(html)

    # 输出临时文件路径
    print(temp_path)
    # 输出使用的方法和 URL 到 stderr
    print(f"METHOD:{method}", file=sys.stderr)
    print(f"URL:{url}", file=sys.stderr)


if __name__ == '__main__':
    main()
