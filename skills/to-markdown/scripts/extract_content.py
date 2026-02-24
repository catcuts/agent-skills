#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用 CSS 选择器从 HTML 中提取内容
"""

import sys
import os
from datetime import datetime
from bs4 import BeautifulSoup


def extract_content(html_path, selector):
    """提取指定选择器的内容"""
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    elements = soup.select(selector)

    if not elements:
        print(f"ERROR: No elements found for selector: {selector}", file=sys.stderr)
        sys.exit(1)

    # 如果有多个匹配，合并所有内容
    if len(elements) > 1:
        print(f"WARNING: Found {len(elements)} elements, merging all", file=sys.stderr)

    # 创建新的 HTML 文档包含提取的内容
    result_soup = BeautifulSoup('<html><body></body></html>', 'html.parser')
    body = result_soup.body

    for elem in elements:
        # 深拷贝元素，避免修改原始 soup
        body.append(elem.__copy__())

    return str(result_soup)


def save_extracted_content(html_path, selector, output_path=None):
    """提取并保存内容"""
    content = extract_content(html_path, selector)

    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return output_path
    else:
        # 使用输入路径生成输出路径
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        random_suffix = os.urandom(2).hex()
        filename = f'extracted_content_{timestamp}_{random_suffix}.html'
        output_path = os.path.join(os.path.dirname(html_path), filename)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return output_path


def main():
    if len(sys.argv) < 3:
        print("ERROR: HTML file path and selector are required", file=sys.stderr)
        print("Usage: python extract_content.py <HTML_FILE> <SELECTOR> [OUTPUT_FILE]", file=sys.stderr)
        sys.exit(1)

    html_path = sys.argv[1]
    selector = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None

    # 检查输入文件是否存在
    if not os.path.exists(html_path):
        print(f"ERROR: Input file does not exist: {html_path}", file=sys.stderr)
        sys.exit(1)

    result_path = save_extracted_content(html_path, selector, output_path)
    print(result_path)


if __name__ == '__main__':
    main()
