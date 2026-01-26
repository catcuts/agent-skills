#!/usr/bin/env node

/**
 * Commit Skill Uninstallation Script
 * Remove installed skill files
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get package root directory
const packageRoot = path.resolve(__dirname, '..');

// Read package.json to get skill name
const packageName = require(path.join(packageRoot, 'package.json')).name;
const skillName = packageName.split('/')[1] || packageName;

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

// Remove function
function removeSkill(dir, description) {
    try {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            log(`Removed ${description}: ${dir}`, 'success');
        } else {
            log(`${description} does not exist: ${dir}`, 'info');
        }
    } catch (error) {
        log(`Failed to remove ${description}: ${error.message}`, 'error');
    }
}

try {
    log(`Starting uninstallation of ${skillName}...`, 'info');

    // Remove global installation
    const globalDir = path.join(os.homedir(), '.claude', 'skills', skillName);
    removeSkill(globalDir, 'global installation');

    // Remove project-level installation
    const localDir = path.join(process.cwd(), '.claude', 'skills', skillName);
    removeSkill(localDir, 'project-level installation');

    // Remove actual storage directories (.agents/)
    const globalAgentsDir = path.join(os.homedir(), '.agents', 'skills', skillName);
    removeSkill(globalAgentsDir, 'global storage directory');

    const localAgentsDir = path.join(process.cwd(), '.agents', 'skills', skillName);
    removeSkill(localAgentsDir, 'project-level storage directory');

    log('\nUninstallation completed!', 'success');

} catch (error) {
    log(`Uninstallation failed: ${error.message}`, 'error');
    process.exit(1);
}
