#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为 agent-browser 生成 JavaScript Cookie 设置代码

从环境变量 COOKIE_<域名> 读取并生成 JavaScript 代码片段，
用于在 agent-browser 打开的页面上下文中设置 cookies。
"""

import os
import sys
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


def generate_javascript_code(url):
    """为 URL 生成 JavaScript cookie 设置代码"""
    domain = get_domain_from_url(url)
    if not domain:
        print(f"[cookies] ERROR: 无法解析域名: {url}", file=sys.stderr)
        return None

    env_name = get_cookie_env_name(domain)
    cookie_string = os.environ.get(env_name)

    if not cookie_string:
        print(f"[cookies] 未找到环境变量 {env_name}，跳过 cookie 设置", file=sys.stderr)
        return None

    print(f"[cookies] 从 {env_name} 读取到 {len(cookie_string)} 字节的 cookie 字符串", file=sys.stderr)

    # 解析 cookie 字符串
    cookies = parse_cookie_string(cookie_string)

    if not cookies:
        print(f"[cookies] ERROR: 未找到有效的 cookie", file=sys.stderr)
        return None

    print(f"[cookies] 生成 JavaScript 代码以设置 {len(cookies)} 个 cookies 到 {domain}...", file=sys.stderr)

    # 生成 JavaScript 代码
    js_code = f'''// JavaScript 代码：在 agent-browser 页面上下文中设置 cookies
// 使用方法：
//   1. 先打开页面: agent-browser open "{url}"
//   2. 执行此代码: agent-browser eval --stdin <<'EVALEOF'
//                <粘贴此代码>
//                EVALEOF
//   3. 刷新页面: agent-browser open "{url}"

(function() {{
  const cookieString = `{cookie_string}`;

  // 解析 cookie 字符串
  const cookies = cookieString.split(';').map(c => {{
    const [name, value] = c.trim().split('=');
    return {{ name, value }};
  }});

  const domain = "{domain}";
  let setCount = 0;

  // 设置每个 cookie
  cookies.forEach(cookie => {{
    if (cookie.name && cookie.value) {{
      // 设置 cookie（适用于当前域名和子域名）
      document.cookie = `${{cookie.name}}=${{cookie.value}}; domain=.${{domain}}; path=/`;
      setCount++;
    }}
  }});

  return `Set ${{setCount}} cookies for domain .${{domain}}`;
}})();
'''

    return js_code


def main():
    if len(sys.argv) < 2:
        print("Usage: python setup_agent_browser_cookies.py <URL>", file=sys.stderr)
        print("", file=sys.stderr)
        print("环境变量格式：", file=sys.stderr)
        print("  COOKIE_x_com=cookie_string", file=sys.stderr)
        print("  COOKIE_twitter_com=cookie_string", file=sys.stderr)
        print("", file=sys.stderr)
        print("输出：JavaScript 代码片段，用于 agent-browser eval 命令", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]

    js_code = generate_javascript_code(url)

    if js_code:
        # 输出到 stdout，便于 AI 使用
        print(js_code)
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
