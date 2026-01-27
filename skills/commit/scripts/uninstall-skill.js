#!/usr/bin/env node

/**
 * Commit Skill Uninstallation Script
 * Remove installed skill files from Claude Code
 *
 * Command Line Arguments:
 * --global: Force global uninstallation
 * --local: Force project-level uninstallation
 *
 * Environment Variables:
 * - SKILL_SCOPE: Installation scope, GLOBAL or LOCAL, default: GLOBAL
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get package root directory
const packageRoot = path.resolve(__dirname, '..');

// Read package.json to get skill name
const packageName = require(path.join(packageRoot, 'package.json')).name;
const skillName = packageName.split('/')[1] || packageName;

// Parse command line arguments
const args = process.argv.slice(2);
const forceGlobal = args.includes('--global');
const forceLocal = args.includes('--local');

// Determine uninstallation scope
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
        // Ignore "file not found" errors, may have been deleted concurrently
        if (error.code === 'ENOENT') {
            return { success: true, removed: false, message: 'Already removed' };
        }
        return {
            success: false,
            removed: false,
            message: `Failed: ${error.message}`
        };
    }
}

try {
    log(`Starting uninstallation of ${skillName}...`, 'info');
    log(`Uninstallation scope: ${isGlobal ? 'Global (GLOBAL)' : 'Project-level (LOCAL)'}`, 'info');

    log('\nCleaning up skill files...', 'info');

    const results = [];

    if (isGlobal) {
        // Global uninstallation
        const homeDir = os.homedir();

        // 1. Clean canonical copy directory (.agents/skills/<skill>)
        const canonicalResult = safeRemovePath(
            path.join(homeDir, '.agents', 'skills', skillName),
            'canonical copy'
        );
        results.push(canonicalResult);

        // 2. Clean Claude Code global symlink
        const globalResult = safeRemovePath(
            path.join(homeDir, '.claude', 'skills', skillName),
            'global skill link'
        );
        results.push(globalResult);
    } else {
        // Project-level uninstallation
        const cwd = process.cwd();

        // 1. Clean project-level canonical copy (if exists)
        const canonicalResult = safeRemovePath(
            path.join(cwd, '.agents', 'skills', skillName),
            'project-level canonical copy'
        );
        results.push(canonicalResult);

        // 2. Clean Claude Code project-level skill
        const localResult = safeRemovePath(
            path.join(cwd, '.claude', 'skills', skillName),
            'project-level skill'
        );
        results.push(localResult);
    }

    // Output cleanup results
    let removedCount = 0;
    let errorCount = 0;

    results.forEach((result) => {
        if (result.removed) {
            log(`  ✓ ${result.message}`, 'success');
            removedCount++;
        } else if (result.success) {
            log(`  ⊗ ${result.message} (skipped)`, 'info');
        } else {
            log(`  ✗ ${result.message}`, 'error');
            errorCount++;
        }
    });

    // Summary
    if (removedCount > 0) {
        log(`\n✓ Uninstallation successful! Removed ${removedCount} file(s)/director(y)(ies)`, 'success');
    } else if (errorCount === 0) {
        log('\n⊗ No files found to uninstall', 'warning');
    }

    if (errorCount > 0) {
        log(`\n⚠ ${errorCount} item(s) failed to remove, please clean up manually`, 'warning');
        process.exit(1);
    }

} catch (error) {
    log(`Uninstallation failed: ${error.message}`, 'error');
    process.exit(1);
}
