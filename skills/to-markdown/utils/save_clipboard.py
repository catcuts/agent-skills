#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将剪贴板内容保存到临时文件
输出临时文件路径以便后续处理
"""

import tempfile
import subprocess
import platform
import sys
import os
from datetime import datetime


def get_clipboard_windows():
    """Windows: 获取剪贴板内容"""
    # 方法1: 使用 pyperclip (如果安装了)
    try:
        import pyperclip
        content = pyperclip.paste()
        if content:
            return content
    except ImportError:
        pass

    # 方法2: 使用 win32clipboard
    try:
        import win32clipboard
        win32clipboard.OpenClipboard()
        try:
            # 尝试获取 HTML 格式
            try:
                data = win32clipboard.GetClipboardData(win32clipboard.RegisterClipboardFormat("HTML Format"))
                if data:
                    return data
            except:
                pass
            # 获取纯文本
            data = win32clipboard.GetClipboardData(win32clipboard.CF_UNICODETEXT)
            if data:
                return data
        finally:
            win32clipboard.CloseClipboard()
    except ImportError:
        pass

    # 方法3: 使用 PowerShell
    ps_script = '''
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$content = [System.Windows.Forms.Clipboard]::GetText()
if (-not $content) {
    $content = Get-Clipboard -Raw
}
$content
'''
    result = subprocess.run(
        ['powershell', '-NoProfile', '-Command', ps_script],
        capture_output=True
    )
    if result.returncode == 0 and result.stdout:
        return result.stdout.decode('utf-8', errors='replace')

    # 方法4: 使用 clip 命令（不太可靠）
    return None


def get_clipboard_macos():
    """macOS: 获取剪贴板内容"""
    result = subprocess.run(
        ['pbpaste'],
        capture_output=True
    )
    if result.returncode == 0:
        return result.stdout.decode('utf-8', errors='replace')
    return None


def get_clipboard_linux():
    """Linux: 获取剪贴板内容"""
    # 尝试 xclip
    result = subprocess.run(
        ['xclip', '-selection', 'clipboard', '-o'],
        capture_output=True
    )
    if result.returncode == 0:
        return result.stdout.decode('utf-8', errors='replace')

    # 尝试 xsel
    result = subprocess.run(
        ['xsel', '--clipboard', '--output'],
        capture_output=True
    )
    if result.returncode == 0:
        return result.stdout.decode('utf-8', errors='replace')

    # 尝试 wl-paste (Wayland)
    result = subprocess.run(
        ['wl-paste'],
        capture_output=True
    )
    if result.returncode == 0:
        return result.stdout.decode('utf-8', errors='replace')

    return None


def get_clipboard_content():
    """根据操作系统获取剪贴板内容"""
    system = platform.system()

    if system == 'Windows':
        return get_clipboard_windows()
    elif system == 'Darwin':
        return get_clipboard_macos()
    else:
        return get_clipboard_linux()


def save_to_temp_file(content):
    """将内容保存到临时文件并返回文件路径"""
    # 生成唯一的临时文件名
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'clipboard_content_{timestamp}.html'

    # 使用系统临时目录
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, filename)

    # 写入文件
    with open(temp_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return temp_path


def main():
    # 获取剪贴板内容
    content = get_clipboard_content()

    # 检查内容是否为空
    if not content or not content.strip():
        print("ERROR: Clipboard is empty or cannot be read", file=sys.stderr)
        sys.exit(1)

    # 保存到临时文件
    temp_path = save_to_temp_file(content)

    # 输出文件路径（用于后续步骤）
    print(temp_path)


if __name__ == '__main__':
    main()
