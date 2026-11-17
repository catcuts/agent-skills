# -*- coding: utf-8 -*-
"""长命令结束标志轮询器（多会话协作规程配套，见《多会话协作规范》§6 执行纪律）

替代"跑完命令固定 sleep N 分钟再去看输出"的傻等：命令后台执行，本脚本以短间隔轮询
结束标志（命令输出 / 过程日志 / HTTP 响应三种标志源），命中即返回，只有超时才需要
AI 介入处理。

用法：
  # 模式一：只等待（命令已由他处启动，输出/日志已落盘）
  python wait_for.py --file build.log --ok "BUILD SUCCESSFUL" --fail "ERROR|FAILED"

  # 模式二：先启动命令再等待（命令输出自动写入日志文件并轮询之）
  python wait_for.py --cmd "npm run build" --ok "compiled successfully" --timeout 900

  # 模式三：等待接口就绪（轮询 HTTP GET 响应体）
  python wait_for.py --url http://127.0.0.1:9000/api/status --ok "ready" --interval 5

参数：
  --cmd <命令>      可选；先后台启动该命令（shell），stdout/stderr 追加写入 --cmd-log
  --file <路径>     可重复；轮询这些文件的内容
  --url <URL>       可重复；轮询这些 HTTP(S) 地址的 GET 响应体
  --ok <正则>       必填；成功标志，命中 → exit 0
  --fail <正则>     可选；失败标志，命中 → exit 1（每轮先于 --ok 判定）
  --interval <秒>   轮询间隔，默认 15
  --timeout <秒>    最大等待，默认 600；超时 → exit 2 并打印各源末尾内容
  --cmd-log <路径>  --cmd 的输出日志，默认当前目录 wait_for_cmd.log

退出码：0=成功标志命中；1=失败标志命中；2=超时；3=参数错误
"""
import argparse, os, re, subprocess, sys, time, urllib.request

ap = argparse.ArgumentParser()
ap.add_argument('--cmd', default=None, help='先启动的命令（shell），可省略')
ap.add_argument('--file', action='append', default=[], help='轮询的文件路径，可重复')
ap.add_argument('--url', action='append', default=[], help='轮询的 HTTP(S) 地址，可重复')
ap.add_argument('--ok', required=True, help='成功标志正则')
ap.add_argument('--fail', default=None, help='失败标志正则（可选）')
ap.add_argument('--interval', type=float, default=15, help='轮询间隔秒，默认 15')
ap.add_argument('--timeout', type=float, default=600, help='最大等待秒，默认 600')
ap.add_argument('--cmd-log', default=None, help='--cmd 输出日志路径')
args = ap.parse_args()

if not args.cmd and not args.file and not args.url:
    print('参数错误：--cmd/--file/--url 至少给一个', file=sys.stderr)
    sys.exit(3)

ok_re = re.compile(args.ok)
fail_re = re.compile(args.fail) if args.fail else None

proc = None
cmd_log = None
if args.cmd:
    cmd_log = args.cmd_log or os.path.abspath('wait_for_cmd.log')
    with open(cmd_log, 'ab') as f:
        proc = subprocess.Popen(args.cmd, shell=True, stdout=f, stderr=subprocess.STDOUT)
    args.file.append(cmd_log)  # 命令输出总是纳入轮询源

def read_file(p):
    try:
        with open(p, 'r', encoding='utf-8', errors='replace') as fh:
            return fh.read()
    except OSError:
        return None

def fetch(u):
    try:
        with urllib.request.urlopen(u, timeout=10) as r:
            return r.read().decode('utf-8', 'replace')
    except Exception:
        return None

start = time.time()
while True:
    for src in list(args.file) + list(args.url):
        content = read_file(src) if src not in args.url else fetch(src)
        if content is None:
            continue
        if fail_re:
            m = fail_re.search(content)
            if m:
                print(f'[wait_for] 失败标志命中（{src}）：{m.group(0)!r}；耗时 {time.time()-start:.0f}s')
                sys.exit(1)
        m = ok_re.search(content)
        if m:
            print(f'[wait_for] 成功标志命中（{src}）：{m.group(0)!r}；耗时 {time.time()-start:.0f}s')
            sys.exit(0)
    if time.time() - start >= args.timeout:
        state = '仍在运行' if (proc is not None and proc.poll() is None) else '已退出'
        print(f'[wait_for] 超时（{args.timeout:.0f}s）未命中标志；命令{state}。各源末尾内容：')
        for p in args.file:
            c = read_file(p)
            if c:
                print(f'--- {p} 末尾 ---')
                print(c[-800:])
        sys.exit(2)
    time.sleep(args.interval)
