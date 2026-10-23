#!/usr/bin/env node

/**
 * Usage Guide Generator
 * Display friendly usage instructions after successful installation
 */

const path = require('path');
const fs = require('fs');

/**
 * Read package.json information
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
 * Read skill instructions from SKILL.md
 */
function getSkillInstructions() {
    const packageRoot = path.resolve(__dirname, '..');
    const skillMdPath = path.join(packageRoot, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
        return null;
    }

    const content = fs.readFileSync(skillMdPath, 'utf-8');
    // Match description line for trigger instructions
    const match = content.match(/^description:\s*(.+)$/m);
    return match ? match[1].trim() : null;
}

/**
 * Print usage guide
 */
function printUsageGuide() {
    const pkg = getPackageInfo();
    const instructions = getSkillInstructions();

    // Use instructions from SKILL.md if available, otherwise use package.json description
    const usageInfo = instructions || pkg.description;

    const guide = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎉 Skill Installed Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Skill Name:    ${pkg.name}
📝 Description:    ${pkg.description}

🚀 How to Use:
   ${usageInfo}

📖 More Information:
   ${pkg.homepage ? `   Docs: ${pkg.homepage}` : ''}
   ${pkg.repository ? `   Repo: ${pkg.repository}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    console.log(guide);
}

module.exports = { printUsageGuide };
