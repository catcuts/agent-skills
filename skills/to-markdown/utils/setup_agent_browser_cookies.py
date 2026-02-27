#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为 agent-browser 设置 cookies

从环境变量 COOKIE_<域名> 读取并设置到 agent-browser
"""

import os
import sys
import subprocess
from urllib.parse import urlparse


def get_domain_from_url(url):
    """从 URL 提取域名"""
    try:
        parsed = urlparse(url)
        return parsed.netloc
    except Exception:
        return None


def get_cookie_env_name(domain):
    """根据域名生成环境变量名"""
    # x.com -> COOKIE_x_com
    # twitter.com -> COOKIE_twitter_com
    return f"COOKIE_{domain.replace('.', '_')}"


def parse_cookie_string(cookie_string):
    """解析 cookie 字符串（格式：name1=value1; name2=value2; ...）

    返回：[(name1, value1), (name2, value2), ...]
    """
    if not cookie_string:
        return []

    cookies = []
    parts = cookie_string.split(';')

    for part in parts:
        part = part.strip()
        if not part:
            continue

        # 只分割第一个 =
        if '=' in part:
            name, value = part.split('=', 1)
            cookies.append((name.strip(), value.strip()))
        else:
            print(f"[cookies] 跳过无效 cookie: {part}", file=sys.stderr)

    return cookies


def set_cookie_to_agent_browser(name, value, domain=None):
    """设置单个 cookie 到 agent-browser"""
    try:
        cmd = ['agent-browser', 'cookies', 'set', name, value]

        if domain:
            cmd.extend(['--domain', domain])

        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=10,
            text=True
        )

        if result.returncode == 0:
            print(f"[cookies] ✓ 设置: {name}", file=sys.stderr)
            return True
        else:
            print(f"[cookies] ✗ 失败: {name} - {result.stderr}", file=sys.stderr)
            return False

    except subprocess.TimeoutExpired:
        print(f"[cookies] ✗ 超时: {name}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[cookies] ✗ 错误: {name} - {e}", file=sys.stderr)
        return False


def setup_cookies_for_url(url):
    """为 URL 设置 cookies"""
    domain = get_domain_from_url(url)
    if not domain:
        print(f"[cookies] ERROR: 无法解析域名: {url}", file=sys.stderr)
        return False

    env_name = get_cookie_env_name(domain)
    cookie_string = os.environ.get(env_name)

    if not cookie_string:
        print(f"[cookies] 未找到环境变量 {env_name}，跳过 cookie 设置", file=sys.stderr)
        return False

    print(f"[cookies] 从 {env_name} 读取到 {len(cookie_string)} 字节的 cookie 字符串", file=sys.stderr)

    # 解析 cookie 字符串
    cookies = parse_cookie_string(cookie_string)

    if not cookies:
        print(f"[cookies] ERROR: 未找到有效的 cookie", file=sys.stderr)
        return False

    print(f"[cookies] 开始设置 {len(cookies)} 个 cookies 到 {domain}...", file=sys.stderr)

    # 设置每个 cookie
    success_count = 0
    fail_count = 0

    for name, value in cookies:
        # 跳过过长的 cookie 值（可能导致错误）
        if len(value) > 1000:
            print(f"[cookies] ⚠ 跳过过长的 cookie: {name} ({len(value)} 字符)", file=sys.stderr)
            fail_count += 1
            continue

        if set_cookie_to_agent_browser(name, value, domain):
            success_count += 1
        else:
            fail_count += 1

    print(f"[cookies] 完成！成功: {success_count}, 失败: {fail_count}", file=sys.stderr)

    return success_count > 0


def main():
    if len(sys.argv) < 2:
        print("Usage: python setup_agent_browser_cookies.py <URL>", file=sys.stderr)
        print("", file=sys.stderr)
        print("环境变量格式：", file=sys.stderr)
        print("  COOKIE_x_com=cookie_string", file=sys.stderr)
        print("  COOKIE_twitter_com=cookie_string", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]

    if setup_cookies_for_url(url):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
