#!/usr/bin/env node

/**
 * kimi-web-chat CLI
 * 通过 kimi-webbridge 守护进程与 Kimi 网页版对话。
 *
 * 子命令：
 *   ask <text> [--timeout ms] [--thinking] [--new] [--json]   发送消息并等待回复
 *   reply [--thinking] [--json]                               取最新回复（不发送）
 *   new                                                       新建对话（清空上下文）
 *   status [--json]                                           daemon/标签/注入 状态自检
 *   close                                                     关闭本会话标签组
 *
 * 退出码：0 成功 / 2 daemon 不可用 / 3 需登录 / 4 回复超时 / 5 页面结构变更
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const DAEMON_URL = 'http://127.0.0.1:10086/command';
const SESSION = 'kimi-web-chat';
const GROUP_TITLE = 'Kimi 网页对话';
const KIMI_URL = 'https://www.kimi.com/';
const DEFAULT_TIMEOUT = 120000;
const BRIDGE_FILE = path.resolve(__dirname, '..', 'references', 'bridge-inject.js');

class CliError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- daemon 通信 ----------

async function rpc(action, args = {}, timeoutMs = 30000) {
  let res;
  try {
    res = await fetch(DAEMON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, args, session: SESSION }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      throw new CliError(2, `request-timeout: ${action} 超过 ${timeoutMs}ms 未响应`);
    }
    throw new CliError(2, `daemon-unreachable: ${e.message}`);
  }
  const body = await res.json().catch(() => null);
  if (!body) throw new CliError(2, 'daemon-invalid-response');
  if (!body.ok) {
    const msg = (body.error && body.error.message) || 'unknown';
    if (/no extension connected/i.test(msg)) {
      throw new CliError(2, 'extension-not-connected: 浏览器扩展未连接，请确认浏览器已打开且 Kimi WebBridge 扩展已启用');
    }
    throw new CliError(5, `webbridge-error: ${msg}`);
  }
  return body.data;
}

async function evaluate(code, timeoutMs = 30000) {
  const data = await rpc('evaluate', { code }, timeoutMs);
  return data && data.value;
}

// ---------- 环境自举 ----------

async function ensureDaemon() {
  try {
    await rpc('list_tabs', {}, 5000);
    return;
  } catch (e) {
    if (e.code !== 2 || !/daemon-unreachable/.test(e.message)) throw e;
  }
  // daemon 未启动：自举（进程已存活时该命令为 no-op）
  const binName = process.platform === 'win32' ? 'kimi-webbridge.exe' : 'kimi-webbridge';
  const binPath = path.join(os.homedir(), '.kimi-webbridge', 'bin', binName);
  if (!fs.existsSync(binPath)) {
    throw new CliError(2, `kimi-webbridge 未安装: ${binPath} 不存在，参见 https://www.kimi.com/zh-cn/features/webbridge`);
  }
  const child = spawn(binPath, ['start'], { detached: true, stdio: 'ignore' });
  child.unref();
  // 等待 daemon 就绪（扩展连接可能需要更久，仅保证端口可用）
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    try {
      await rpc('list_tabs', {}, 3000);
      return;
    } catch (e) {
      if (e.code === 2 && /extension-not-connected/.test(e.message)) throw e;
    }
  }
  throw new CliError(2, 'daemon-start-timeout');
}

async function findSessionTab() {
  const data = await rpc('list_tabs');
  const tabs = (data && data.tabs) || [];
  return tabs.find((t) => /^https:\/\/(www\.)?kimi\.com/.test(t.url)) || null;
}

async function ensureTab() {
  const tab = await findSessionTab();
  if (tab) {
    await rpc('find_tab', { url: tab.url });
  } else {
    await rpc('navigate', { url: KIMI_URL, newTab: true, group_title: GROUP_TITLE });
  }
  // 等待页面就绪且输入框出现（加载期间 evaluate 可能超时，视为可重试）
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const ready = await evaluate(
        'document.readyState==="complete" && !!document.querySelector(\'.chat-input-editor[contenteditable="true"]\')',
        5000
      );
      if (ready === true) return;
    } catch (e) {
      if (e.code !== 5 && !/request-timeout/.test(e.message)) throw e;
    }
  }
  throw new CliError(3, 'editor-not-found: 输入框未出现，可能未登录 Kimi，请在浏览器中完成登录后重试');
}

async function ensureBridge() {
  const ok = await evaluate('!!(window.__kimiBridge && window.__kimiBridge.version === 1)');
  if (ok === true) return;
  const code = fs.readFileSync(BRIDGE_FILE, 'utf-8');
  const result = await evaluate(code);
  if (result !== 'injected' && result !== 'already-injected') {
    throw new CliError(5, `bridge-inject-unexpected: ${JSON.stringify(result)}`);
  }
}

async function ensure() {
  await ensureDaemon();
  await ensureTab();
  await ensureBridge();
}

// ---------- 子命令 ----------

async function cmdAsk(text, opts) {
  await ensure();
  if (opts.newChat) {
    await startNewChat();
  }
  const code = `(async()=>{const r=await window.__kimiBridge.ask(${JSON.stringify(text)},${opts.timeout});return JSON.stringify(r);})()`;
  let raw;
  try {
    raw = await evaluate(code, opts.timeout + 30000);
  } catch (e) {
    if (/reply-timeout/.test(e.message)) throw new CliError(4, '回复超时：Kimi 未在限定时间内产生回复');
    if (/editor-not-found/.test(e.message)) throw new CliError(3, '输入框未找到，可能未登录');
    throw e;
  }
  const r = JSON.parse(raw);
  if (opts.json) {
    console.log(JSON.stringify({ text: r.text, ms: r.ms, partial: r.partial }));
  } else {
    console.log(r.text);
    if (r.partial) console.error('WARN: 回复可能不完整（达到超时仍有内容在变化）');
  }
}

async function cmdReply(opts) {
  await ensure();
  const text = await evaluate(`window.__kimiBridge.lastReply(${opts.thinking})`);
  if (!text) throw new CliError(5, '当前页面没有可读取的回复');
  if (opts.json) {
    console.log(JSON.stringify({ text }));
  } else {
    console.log(text);
  }
}

async function startNewChat() {
  await rpc('navigate', { url: KIMI_URL });
  // 页面重载后桥接脚本失效，重新等待并注入
  await ensureTab();
  await ensureBridge();
}

async function cmdNew() {
  await ensure();
  await startNewChat();
  console.log('已开启新对话');
}

async function cmdStatus(opts) {
  const status = { daemon: false, tab: false, bridge: false, editor: false, replies: 0 };
  try {
    const tab = await findSessionTab();
    status.daemon = true;
    if (tab) {
      status.tab = true;
      await rpc('find_tab', { url: tab.url });
      status.bridge = (await evaluate('!!(window.__kimiBridge && window.__kimiBridge.version === 1)')) === true;
      status.editor = (await evaluate('!!document.querySelector(\'.chat-input-editor[contenteditable="true"]\')')) === true;
      if (status.bridge) {
        status.replies = await evaluate('window.__kimiBridge.assistantCount()');
      }
    }
  } catch (e) {
    if (e.code !== 2) throw e;
  }
  if (opts.json) {
    console.log(JSON.stringify(status));
  } else {
    console.log(`daemon:  ${status.daemon ? '✓ 运行中' : '✗ 不可用'}`);
    console.log(`tab:     ${status.tab ? '✓ 已打开' : '✗ 未打开'}`);
    console.log(`bridge:  ${status.bridge ? '✓ 已注入' : '✗ 未注入'}`);
    console.log(`editor:  ${status.editor ? '✓ 就绪' : '✗ 未就绪'}`);
    console.log(`replies: ${status.replies}`);
  }
  if (!status.daemon) throw new CliError(2, 'daemon-unreachable');
}

async function cmdClose() {
  const data = await rpc('close_session');
  console.log(`已关闭 ${data.closed} 个标签页`);
}

// ---------- 参数解析与入口 ----------

function parseArgs(argv) {
  const opts = { timeout: DEFAULT_TIMEOUT, json: false, thinking: false, newChat: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--thinking') opts.thinking = true;
    else if (a === '--new') opts.newChat = true;
    else if (a === '--timeout') opts.timeout = parseInt(argv[++i], 10) || DEFAULT_TIMEOUT;
    else rest.push(a);
  }
  return { opts, rest };
}

function printUsage() {
  console.log(`用法: kimi-web-chat <命令> [参数]

命令:
  ask <text> [--timeout ms] [--thinking] [--new] [--json]   发送消息并等待回复
  reply [--thinking] [--json]                               取最新回复（不发送）
  new                                                       新建对话（清空上下文）
  status [--json]                                           状态自检
  close                                                     关闭本会话标签组

退出码: 0 成功 / 2 daemon 不可用 / 3 需登录 / 4 超时 / 5 页面结构变更`);
}

async function main() {
  const [cmd, ...argv] = process.argv.slice(2);
  const { opts, rest } = parseArgs(argv);
  switch (cmd) {
    case 'ask': {
      const text = rest.join(' ').trim();
      if (!text) throw new CliError(1, 'ask 需要提供消息文本');
      return cmdAsk(text, opts);
    }
    case 'reply':
      return cmdReply(opts);
    case 'new':
      return cmdNew();
    case 'status':
      return cmdStatus(opts);
    case 'close':
      return cmdClose();
    default:
      printUsage();
      if (cmd) throw new CliError(1, `未知命令: ${cmd}`);
  }
}

main().catch((e) => {
  if (e instanceof CliError) {
    console.error(`ERROR[${e.code}]: ${e.message}`);
    process.exit(e.code);
  }
  console.error(`ERROR[5]: ${e.message}`);
  process.exit(5);
});
