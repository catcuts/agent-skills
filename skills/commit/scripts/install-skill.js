#!/usr/bin/env node

/**
 * Commit Skill Installation Script
 * Install skill to Claude Code using add-skill
 *
 * Command Line Arguments (Recommended):
 * --dry-run: Test mode, show command without executing
 * --global: Force global installation
 * --local: Force project-level installation
 *
 * Environment Variables (Fallback):
 * - SKILL_SCOPE: Installation scope, GLOBAL or LOCAL, default: GLOBAL
 */

const { execSync } = require('child_process');
const path = require('path');
const { printUsageGuide } = require('./usage-guide');

// Get package root directory
const packageRoot = path.resolve(__dirname, '..');

// Read package.json to get skill name
const packageJson = require(path.join(packageRoot, 'package.json'));
const skillName = packageJson.name.split('/')[1] || packageJson.name;

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forceGlobal = args.includes('--global');
const forceLocal = args.includes('--local');

// Determine installation scope
let scope;
if (forceGlobal) {
    scope = 'GLOBAL';
} else if (forceLocal) {
    scope = 'LOCAL';
} else {
    scope = (process.env.SKILL_SCOPE || 'GLOBAL').toUpperCase();
}

const isGlobal = scope === 'GLOBAL';

// Logging function
function log(message, type = 'info') {
    const prefix = {
        info: '✓',
        success: '✓',
        warning: '⚠',
        error: '✗'
    }[type] || '✓';

    console.log(`${prefix} ${message}`);
}

// Error handler
function handleError(error) {
    log(`Installation failed: ${error.message}`, 'error');
    log('\nYou can try manual installation:', 'warning');
    log(`  npx add-skill "${packageRoot}" -a claude-code ${isGlobal ? '-g' : ''} -y`);
    process.exit(1);
}

try {
    log(`Starting installation of ${skillName}...`, 'info');
    log(`Installation scope: ${isGlobal ? 'Global (GLOBAL)' : 'Project-level (LOCAL)'}`, 'info');

    // Build add-skill command
    const commandParts = [
        'npx',
        'add-skill',
        `"${packageRoot}"`,
    ];

    if (isGlobal) {
        commandParts.push('-g');
    }

    commandParts.push('-y'); // Non-interactive mode

    const command = commandParts.join(' ');

    if (dryRun) {
        log('\n[DRY-RUN] Command to be executed:', 'warning');
        console.log(`  ${command}`);
        log('\nTest passed - For actual installation run: npm run install:global or npm run install:local', 'success');
        process.exit(0);
    }

    // Execute installation
    log('\nExecuting add-skill...', 'info');
    execSync(command, {
        stdio: 'inherit',
        cwd: packageRoot
    });

    log('\nInstallation successful!', 'success');
    log(`Skill installed to: ${isGlobal ? `~/.claude/skills/${skillName}` : `.claude/skills/${skillName}`}`, 'info');

    // 显示使用指南
    printUsageGuide();

} catch (error) {
    handleError(error);
}
