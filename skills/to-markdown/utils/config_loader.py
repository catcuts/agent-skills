#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网站配置加载器
"""

import json
import os
from pathlib import Path
from urllib.parse import urlparse

DEFAULT_CONFIG_PATH = Path(__file__).parent.parent / 'site-configs.json'


def load_site_config(url, config_path=None):
    """加载网站特定配置"""
    if config_path is None:
        config_path = DEFAULT_CONFIG_PATH

    if not config_path.exists():
        return None

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"[config] Failed to load config: {e}", file=sys.stderr)
        return None

    domain = urlparse(url).netloc
    if ':' in domain:
        domain = domain.split(':')[0]

    return config.get('sites', {}).get(domain)


def get_all_configs(config_path=None):
    """获取所有网站配置"""
    if config_path is None:
        config_path = DEFAULT_CONFIG_PATH

    if not config_path.exists():
        return {}

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


if __name__ == '__main__':
    # 测试配置加载
    import sys
    if len(sys.argv) > 1:
        url = sys.argv[1]
        config = load_site_config(url)
        print(f"Config for {url}:")
        print(json.dumps(config, indent=2, ensure_ascii=False))
    else:
        configs = get_all_configs()
        print("All configs:")
        print(json.dumps(configs, indent=2, ensure_ascii=False))
