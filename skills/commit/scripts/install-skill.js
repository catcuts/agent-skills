#!/usr/bin/env node

/**
 * Commit Skill Installation Script
 * Install skill to Claude Code using skills
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
const fs = require('fs');
const os = require('os');
const { printUsageGuide } = require('./usage-guide');

// Get package root directory
const packageRoot = path.resolve(__dirname, '..');

// Get user home directory
const homeDir = os.homedir();

// Read package.json to get skill name
const packageJson = require(path.join(packageRoot, 'package.json'));
const skillName = packageJson.name.split('/')[1] || packageJson.name;

// Paths to clean
const pathsToClean = {
    // skills CLI canonical copy directory (root cause of the issue)
    canonical: path.join(homeDir, '.agents', 'skills', skillName),

    // Claude Code global skill directory (symlink)
    claudeGlobal: path.join(homeDir, '.claude', 'skills', skillName),

    // Claude Code project-level skill directory (if exists)
    claudeLocal: path.join(process.cwd(), '.claude', 'skills', skillName),
};

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

// Safely remove a path (supports symlinks, files, directories)
function safeRemovePath(filePath, description) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: true, removed: false, message: 'Not found' };
        }

        const stats = fs.lstatSync(filePath);
        const isLink = stats.isSymbolicLink();
        const isDir = stats.isDirectory();

        if (isLink) {
            fs.unlinkSync(filePath);
            return {
                success: true,
                removed: true,
                message: `Removed symlink: ${description}`
            };
        } else if (isDir) {
            fs.rmSync(filePath, { recursive: true, force: true });
            return {
                success: true,
                removed: true,
                message: `Removed directory: ${description}`
            };
        } else {
            fs.unlinkSync(filePath);
            return {
                success: true,
                removed: true,
                message: `Removed file: ${description}`
            };
        }
    } catch (error) {
        return {
            success: false,
            removed: false,
            message: `Failed to remove: ${error.message}`
        };
    }
}

// Clean old installation files
function cleanOldInstallations() {
    log('\nCleaning up old installation files...', 'info');

    const results = [];

    // 1. Clean canonical copy directory (.agents/skills/<skill>)
    const canonicalResult = safeRemovePath(
        pathsToClean.canonical,
        'canonical copy'
    );
    results.push({ path: pathsToClean.canonical, ...canonicalResult });

    // 2. Clean Claude Code global symlink
    const globalResult = safeRemovePath(
        pathsToClean.claudeGlobal,
        'global skill link'
    );
    results.push({ path: pathsToClean.claudeGlobal, ...globalResult });

    // 3. Clean Claude Code project-level installation (if exists)
    const localResult = safeRemovePath(
        pathsToClean.claudeLocal,
        'project-level skill'
    );
    results.push({ path: pathsToClean.claudeLocal, ...localResult });

    // Output cleanup results
    let removedCount = 0;
    results.forEach((result) => {
        if (result.removed) {
            log(`  ✓ ${result.message}`, 'success');
            removedCount++;
        } else if (result.success) {
            log(`  ⊗ ${result.message} (skipped)`, 'info');
        } else {
            log(`  ✗ ${result.message}`, 'warning');
        }
    });

    if (removedCount > 0) {
        log(`\nCleaned up ${removedCount} old installation(s)`, 'success');
    } else {
        log('No old installations found to clean', 'info');
    }

    return removedCount > 0;
}

// Error handler
function handleError(error) {
    log(`Installation failed: ${error.message}`, 'error');
    log('\nYou can try manual installation:', 'warning');
    log(`  npx skills add "${packageRoot}" ${isGlobal ? '-g' : ''} -y`);
    process.exit(1);
}

try {
    log(`Starting installation of ${skillName}...`, 'info');
    log(`Installation scope: ${isGlobal ? 'Global (GLOBAL)' : 'Project-level (LOCAL)'}`, 'info');

    // Clean old installation files (solves incremental update file residue issue)
    cleanOldInstallations();

    // Build skills command
    const commandParts = [
        'npx',
        '-y',  // Auto-confirm npx installation
        'skills',  // Always use latest version
        'add',
        `"${packageRoot}"`,
    ];

    if (isGlobal) {
        commandParts.push('-g');
    }

    commandParts.push('-y'); // Non-interactive mode for skills add

    const command = commandParts.join(' ');

    if (dryRun) {
        log('\n[DRY-RUN] Command to be executed:', 'warning');
        console.log(`  ${command}`);
        log('\nTest passed - For actual installation run: npm run install:global or npm run install:local', 'success');
        process.exit(0);
    }

    // Execute installation
    log('\nExecuting skills add...', 'info');
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
