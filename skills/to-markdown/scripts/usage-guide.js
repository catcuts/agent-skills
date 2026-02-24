#!/usr/bin/env node

/**
 * 技能使用指南生成器
 * 在安装成功后显示友好的使用指南
 */

const path = require('path');
const fs = require('fs');

/**
 * 读取 package.json 中的信息
 */
function getPackageInfo() {
    const packageRoot = path.resolve(__dirname, '..');
    const packageJsonPath = path.join(packageRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    return {
        name: packageJson.name.split('/')[1] || packageJson.name,
        description: packageJson.description,
        homepage: packageJson.homepage || '',
        repository: packageJson.repository?.url || '',
    };
}

/**
 * 读取 SKILL.md 中的触发指令
 */
function getSkillInstructions() {
    const packageRoot = path.resolve(__dirname, '..');
    const skillMdPath = path.join(packageRoot, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
        return null;
    }

    const content = fs.readFileSync(skillMdPath, 'utf-8');
    // 匹配 description 行中的指令说明
    const match = content.match(/^description:\s*(.+)$/m);
    return match ? match[1].trim() : null;
}

/**
 * 打印使用指南
 */
function printUsageGuide() {
    const pkg = getPackageInfo();
    const instructions = getSkillInstructions();

    // 如果 SKILL.md 中有指令说明，使用它；否则使用 package.json 的 description
    const usageInfo = instructions || pkg.description;

    const guide = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎉 技能安装成功！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 技能名称:    ${pkg.name}
📝 功能描述:    ${pkg.description}

🚀 如何使用:
   ${usageInfo}

📖 更多信息:
   ${pkg.homepage ? `   文档: ${pkg.homepage}` : ''}
   ${pkg.repository ? `   仓库: ${pkg.repository}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    console.log(guide);
}

module.exports = { printUsageGuide };
