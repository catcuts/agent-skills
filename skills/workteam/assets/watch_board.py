# -*- coding: utf-8 -*-
"""留言板守望脚本（参数化版，多会话协作规程配套）

用法：
  python watch_board.py <留言板路径1> [留言板路径2 ...] [--baseline 基线.json] [--heartbeat 心跳.txt]
                        [--interval 20] [--hb-every 300] [--max-quiet 43200] [--settle 60]

行为：
  1. 启动即扫描各留言板（mtime+size）与基线比对：基线不存在 → 建立后继续守望；
     不一致 → 打印变化并 exit 2（供唤醒者对照旧值）。
  2. 每 interval 秒轮询；任一变化 → 再观察 settle 秒收敛（无新变化才报告，防并发写入漏报）
     → 打印全部差异并 exit 0（触发后台任务完成通知，唤醒所属会话）。
  3. 每 hb-every 秒 touch 心跳文件（兜底任务据此判活：mtime 距今超过约 10 分钟视为守望已死）。
  4. 连续 max-quiet 秒无变化 → 打印"平安超时"并 exit 0（防僵尸进程，需重新部署）。

部署纪律（守望由总控统一部署，盯全部留言板；两个场景，删/不删基线规则相反）：
  场景A｜写板方轮末重部署（总控自己刚写完板）：先清板上待办 → 删基线 → 重部署——把本轮
        写入烘进基线，防自唤醒死循环。
  场景B｜兜底重启（守望死亡/疑似漏报）：不删基线直接重启——本脚本启动自检与基线比对（见
        行为 1），死亡窗口期漏掉的变化会立即报告并退出、唤醒总控；删基线反而把漏报烘进
        新基线。
"""
import argparse, json, os, sys, time

ap = argparse.ArgumentParser()
ap.add_argument('boards', nargs='+', help='要守望的留言板文件路径（一个或多个）')
ap.add_argument('--baseline', default=None, help='基线 json 路径，默认 <脚本目录>/watch_baseline.json')
ap.add_argument('--heartbeat', default=None, help='心跳文件路径，默认 <脚本目录>/watch_heartbeat.txt')
ap.add_argument('--interval', type=int, default=20, help='轮询间隔秒，默认 20')
ap.add_argument('--hb-every', type=int, default=300, help='心跳 touch 间隔秒，默认 300')
ap.add_argument('--max-quiet', type=int, default=12 * 3600, help='无变化超时秒，默认 43200（12h）')
ap.add_argument('--settle', type=int, default=60, help='检测到变化后的收敛观察秒，默认 60')
args = ap.parse_args()

BASE = os.path.dirname(os.path.abspath(__file__))
BL = args.baseline or os.path.join(BASE, 'watch_baseline.json')
HB = args.heartbeat or os.path.join(BASE, 'watch_heartbeat.txt')
BOARDS = {os.path.abspath(p): p for p in args.boards}

def snap():
    d = {}
    for abs_p, orig_p in BOARDS.items():
        try:
            st = os.stat(abs_p)
            d[orig_p] = [st.st_mtime_ns // 1_000_000, st.st_size]  # [ms, size]
        except OSError:
            d[orig_p] = None
    return d

def report(cur, old, code):
    lines = []
    for p in BOARDS.values():
        if cur.get(p) != old.get(p):
            lines.append(f"{p}\n  {old.get(p)} -> {cur.get(p)}")
    print("留言板变化：\n" + "\n".join(lines) if lines else "（无差异）", flush=True)
    sys.exit(code)

cur = snap()
if os.path.exists(BL):
    with open(BL, encoding='utf-8') as f:
        old = json.load(f)
    if old != cur:
        report(cur, old, 2)
else:
    with open(BL, 'w', encoding='utf-8') as f:
        json.dump(cur, f, ensure_ascii=False)
    print(f"基线已建立：{json.dumps(cur, ensure_ascii=False)}", flush=True)

t0 = time.time(); last_hb = 0.0
while True:
    time.sleep(args.interval)
    now = time.time()
    if now - last_hb >= args.hb_every:
        open(HB, 'a').close(); os.utime(HB); last_hb = now
    c = snap()
    if c != cur:
        quiet_end = time.time() + args.settle
        while time.time() < quiet_end:
            time.sleep(5)
            c2 = snap()
            if c2 != c:
                c = c2
                quiet_end = time.time() + args.settle
        with open(BL, 'w', encoding='utf-8') as f:
            json.dump(cur, f, ensure_ascii=False)  # 归档退出前旧值供唤醒者对照
        report(c, cur, 0)
    if now - t0 >= args.max_quiet:
        print(f"平安超时（{args.max_quiet // 3600}h 无变化），守望退出——请重新部署。", flush=True)
        sys.exit(0)
