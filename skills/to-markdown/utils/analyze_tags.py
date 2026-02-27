#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能分析 HTML 找出可能的正文标签
"""

import sys
import json
from bs4 import BeautifulSoup


def calculate_text_density(element):
    """计算文本密度"""
    text = element.get_text(strip=True)
    if not text:
        return 0, 0, 0

    text_length = len(text)

    # 计算链接数量和链接文本占比
    links = element.find_all('a')
    link_count = len(links)
    link_text_length = sum(len(a.get_text(strip=True)) for a in links)
    link_ratio = link_text_length / text_length if text_length > 0 else 0

    return text_length, link_count, link_ratio


def count_paragraphs(element):
    """计算段落数量"""
    paragraphs = element.find_all(['p', 'div', 'section'], recursive=False)
    return len([p for p in paragraphs if len(p.get_text(strip=True)) > 20])


def score_element(element):
    """为元素评分，判断是否为正文"""
    text_length, link_count, link_ratio = calculate_text_density(element)
    paragraph_count = count_paragraphs(element)

    score = 0

    # 1. 文本长度得分 (最多 40 分)
    if text_length > 1000:
        score += 40
    elif text_length > 500:
        score += 35
    elif text_length > 200:
        score += 25
    elif text_length > 100:
        score += 15

    # 2. 链接密度惩罚 (链接太多可能是导航)
    if link_ratio > 0.5:
        score -= 30
    elif link_ratio > 0.3:
        score -= 15
    elif link_ratio > 0.2:
        score -= 5

    # 3. 段落数量得分 (最多 25 分)
    if paragraph_count >= 5:
        score += 25
    elif paragraph_count >= 3:
        score += 20
    elif paragraph_count >= 2:
        score += 15
    elif paragraph_count >= 1:
        score += 10

    # 4. 标签名得分 (最多 30 分)
    tag_name = element.name
    if tag_name == 'article':
        score += 30
    elif tag_name == 'main':
        score += 25
    elif tag_name == 'section':
        score += 15
    elif tag_name == 'div':
        score += 5

    # 5. class/id 属性得分 (最多 20 分)
    classes = element.get('class', [])
    elem_id = element.get('id', '')

    content_keywords = ['content', 'article', 'post', 'main', 'text', 'body', 'detail']

    for cls in classes:
        if any(kw in cls.lower() for kw in content_keywords):
            score += 15
            break

    if elem_id and any(kw in elem_id.lower() for kw in content_keywords):
        score += 10

    return max(0, score), {
        'text_length': text_length,
        'link_count': link_count,
        'link_ratio': round(link_ratio, 2),
        'paragraph_count': paragraph_count,
        'tag_name': tag_name
    }


def generate_selector(element):
    """生成元素的 CSS 选择器"""
    tag = element.name

    # 优先使用 id
    if element.get('id'):
        return f"#{element['id']}"

    # 其次使用 class
    if element.get('class'):
        classes = '.'.join(element['class'])
        return f"{tag}.{classes}"

    # 最后使用标签名
    return tag


def analyze_html(html_path, top_n=10):
    """分析 HTML 文件，找出可能的正文标签"""
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # 候选元素
    candidates = []

    # 常见的正文容器标签
    for elem in soup.find_all(['article', 'main', 'section', 'div']):
        text_length, _, _ = calculate_text_density(elem)

        # 跳过太短的元素
        if text_length < 50:
            continue

        # 跳过明显的导航、页脚等
        classes = elem.get('class', [])
        elem_id = elem.get('id', '')

        skip_keywords = ['nav', 'header', 'footer', 'sidebar', 'comment', 'advertisement',
                        'breadcrumb', 'menu', 'toolbar', 'sidebar', 'widget']

        if any(kw in ' '.join(classes).lower() for kw in skip_keywords):
            continue
        if any(kw in elem_id.lower() for kw in skip_keywords):
            continue

        score, stats = score_element(elem)

        # 只保留得分较高的
        if score >= 20:
            candidates.append({
                'element': elem,
                'selector': generate_selector(elem),
                'score': score,
                'stats': stats,
                'preview': elem.get_text(strip=True)[:100]
            })

    # 排序
    candidates.sort(key=lambda x: x['score'], reverse=True)

    return candidates[:top_n]


def main():
    if len(sys.argv) < 2:
        print("ERROR: HTML file path is required", file=sys.stderr)
        print("Usage: python analyze_tags.py <HTML_FILE> [TOP_N]", file=sys.stderr)
        sys.exit(1)

    html_path = sys.argv[1]
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    try:
        candidates = analyze_html(html_path, top_n)
    except FileNotFoundError:
        print(f"ERROR: File not found: {html_path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Analysis failed: {e}", file=sys.stderr)
        sys.exit(1)

    # 输出 JSON 格式结果
    result = {
        'candidates': [
            {
                'selector': c['selector'],
                'score': c['score'],
                'stats': c['stats'],
                'preview': c['preview']
            }
            for c in candidates
        ]
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
