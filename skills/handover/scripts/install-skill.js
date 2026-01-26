#!/usr/bin/env node

/**
 * Handover Skill 安装脚本
 * 使用 add-skill 将 skill 安装到 Claude Code
 *
 * 命令行参数 (推荐):
 * --dry-run: 测试模式,只显示将要执行的命令,不实际安装
 * --global: 强制全局安装
 * --local: 强制项目级安装
 *
 * 环境变量 (备用):
 * - SKILL_SCOPE: 安装范围,可选值: GLOBAL(全局) 或 LOCAL(项目级),默认: GLOBAL
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 获取包根目录
const packageRoot = path.resolve(__dirname, '..');

// 解析命令行参数
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forceGlobal = args.includes('--global');
const forceLocal = args.includes('--local');

// 确定安装范围
let scope;
if (forceGlobal) {
  scope = 'GLOBAL';
} else if (forceLocal) {
  scope = 'LOCAL';
} else {
  scope = (process.env.SKILL_SCOPE || 'GLOBAL').toUpperCase();
}

const isGlobal = scope === 'GLOBAL';

// 日志函数
function log(message, type = 'info') {
  const prefix = {
    info: '✓',
    success: '✓',
    warning: '⚠',
    error: '✗'
  }[type] || '✓';

  console.log(`${prefix} ${message}`);
}

// 错误处理
function handleError(error) {
  log(`安装失败: ${error.message}`, 'error');
  log('\n您可以尝试手动安装:', 'warning');
  log(`  npx add-skill "${packageRoot}" -a claude-code ${isGlobal ? '-g' : ''} -y`);
  process.exit(1);
}

try {
  log(`开始安装 Handover Skill...`, 'info');
  log(`安装范围: ${isGlobal ? '全局(GLOBAL)' : '项目级(LOCAL)'}`, 'info');

  // 构建 add-skill 命令
  const commandParts = [
    'npx',
    'add-skill',
    `"${packageRoot}"`,
    // '-a', 'claude-code'  // 由 add-skill 自动检测，如果检测失败那么会自动弹出菜单让用户手动选择
  ];

  if (isGlobal) {
    commandParts.push('-g');
  }

  commandParts.push('-y'); // 非交互模式

  const command = commandParts.join(' ');

  if (dryRun) {
    log('\n[DRY-RUN] 将要执行的命令:', 'warning');
    console.log(`  ${command}`);
    log('\n测试通过 - 实际安装请运行: npm run install:global 或 npm run install:local', 'success');
    process.exit(0);
  }

  // 执行安装
  log('\n正在执行 add-skill...', 'info');
  execSync(command, {
    stdio: 'inherit',
    cwd: packageRoot
  });

  log('\n安装成功!', 'success');
  log(`Skill 已安装到: ${isGlobal ? '~/.claude/skills/handover' : '.claude/skills/handover'}`, 'info');

} catch (error) {
  handleError(error);
}
