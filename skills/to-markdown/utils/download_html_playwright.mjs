#!/usr/bin/env node
/**
 * 使用 Playwright 下载 HTML（备用方案）
 *
 * 支持环境变量配置：
 * - PLAYWRIGHT_HEADLESS=false - 显示浏览器窗口（调试用）
 * - PLAYWRIGHT_PROXY=http://host:port - 使用代理
 * - PLAYWRIGHT_TIMEOUT=60000 - 超时时间（毫秒）
 * - COOKIE_<域名> - Cookie（域名中的 . 替换为 _）
 *   例如：COOKIE_x_com、COOKIE_twitter_com
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从 URL 中提取域名
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname; // 例如：x.com, twitter.com
    } catch (e) {
        return null;
    }
}

/**
 * 获取 Cookie 环境变量名
 */
function getCookieEnvName(domain) {
    if (!domain) return null;
    // 将域名中的 . 替换为 _，作为环境变量名
    return `COOKIE_${domain.replace(/\./g, '_')}`;
}

/**
 * 加载网站配置
 */
function loadSiteConfig(url) {
    try {
        const configPath = path.join(__dirname, '..', 'site-configs.json');
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        const domain = extractDomain(url);
        if (domain && config.sites && config.sites[domain]) {
            return config.sites[domain];
        }
    } catch (e) {
        // 配置文件不存在或解析失败，返回 null
    }
    return null;
}

/**
 * 滚动页面加载更多内容
 */
async function scrollPage(page, config) {
    const scrollCount = config.scroll_count || 0;
    const scrollWait = config.scroll_wait || 1000;

    if (scrollCount === 0) {
        return;
    }

    process.stderr.write(`[Playwright] Scrolling to load more content (${scrollCount} times)...\n`);

    for (let i = 0; i < scrollCount; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await page.waitForTimeout(scrollWait);
    }

    // 滚动回顶部
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });

    process.stderr.write(`[Playwright] ✓ Scroll complete\n`);
}

/**
 * 使用 Playwright 下载 HTML
 */
async function downloadWithPlaywright(url) {
    const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
    const timeout = parseInt(process.env.PLAYWRIGHT_TIMEOUT || '60000', 10);
    const proxy = process.env.PLAYWRIGHT_PROXY || null;

    // 检查是否有 Cookie
    const domain = extractDomain(url);
    const cookieEnvName = getCookieEnvName(domain);
    const cookie = process.env[cookieEnvName];

    if (domain) {
        if (cookie) {
            process.stderr.write(`[Cookie] 找到环境变量 ${cookieEnvName}\n`);
            process.stderr.write(`[Cookie] 使用 Cookie: ${cookie.substring(0, 50)}...\n`);
        } else {
            process.stderr.write(`[Cookie] 未找到环境变量 ${cookieEnvName}，不使用 Cookie\n`);
        }
    }

    // 启动浏览器配置
    const launchOptions = {
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    // 如果配置了代理
    if (proxy) {
        process.stderr.write(`[Playwright] 使用代理: ${proxy}\n`);
        launchOptions.proxy = { server: proxy };
    }

    const browser = await chromium.launch(launchOptions);

    // 创建上下文
    const contextOptions = {
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    };

    // 如果有 Cookie，添加到上下文
    if (cookie && domain) {
        // 解析 Cookie 字符串，格式：name1=value1; name2=value2; ...
        // 注意：value 中可能包含 = 号（如 base64 编码），所以只分割第一个 =
        const cookies = cookie.split(';').map(c => {
            const trimmed = c.trim();
            if (!trimmed) return null;

            // 只分割第一个 =
            const firstEqualIndex = trimmed.indexOf('=');
            if (firstEqualIndex === -1) return null;

            const name = trimmed.substring(0, firstEqualIndex).trim();
            const value = trimmed.substring(firstEqualIndex + 1).trim();

            if (!name) return null;

            return {
                name: name,
                value: value,
                domain: domain,
                path: '/'
            };
        }).filter(c => c !== null); // 过滤掉无效的 cookie

        if (cookies.length > 0) {
            contextOptions.cookies = cookies;
            process.stderr.write(`[Cookie] ✓ 已添加 ${cookies.length} 个 cookies\n`);
        }
    }

    const context = await browser.newContext(contextOptions);

    const page = await context.newPage();

    try {
        process.stderr.write(`[Playwright] 正在访问: ${url}\n`);
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout
        });
        process.stderr.write('[Playwright] 页面加载成功，等待内容渲染...\n');

        // 读取网站配置
        const siteConfig = loadSiteConfig(url);
        const waitTime = siteConfig && siteConfig.wait_after_load ? siteConfig.wait_after_load : 3000;

        // 等待页面稳定（等待 JavaScript 渲染完成）
        await page.waitForTimeout(waitTime);

        // 尝试等待常见的内容元素（最多等待 5 秒）
        try {
            const selector = siteConfig && siteConfig.content_selector ? siteConfig.content_selector : 'article, main, .content, #content, body';
            await page.waitForSelector(selector, {
                timeout: 5000
            });
        } catch {
            // 忽略，继续执行
        }

        // 如果配置需要滚动，执行滚动加载
        if (siteConfig && siteConfig.requires_scroll) {
            await scrollPage(page, siteConfig);
        }

        // 获取完整 HTML
        const html = await page.content();
        process.stderr.write(`[Playwright] 下载完成，HTML 大小: ${(html.length / 1024).toFixed(2)} KB\n`);

        return html;

    } finally {
        await browser.close();
    }
}

/**
 * 保存到临时文件
 */
async function saveToTempFile(html, prefix = 'downloaded_html') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const filename = `${prefix}_${timestamp}_${randomSuffix}.html`;

    // 使用系统临时目录
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, filename);

    await fs.writeFile(tempPath, html, 'utf-8');

    return tempPath;
}

/**
 * 主函数
 */
async function main() {
    const url = process.argv[2];

    if (!url) {
        process.stderr.write('ERROR: URL is required\n');
        process.stderr.write('Usage: node download_html_playwright.js <URL>\n');
        process.exit(1);
    }

    // 验证 URL 格式
    try {
        new URL(url);
    } catch {
        process.stderr.write(`ERROR: Invalid URL: ${url}\n`);
        process.exit(1);
    }

    try {
        // 下载 HTML
        const html = await downloadWithPlaywright(url);

        // 保存到临时文件
        const tempPath = await saveToTempFile(html);

        // 输出临时文件路径到 stdout
        console.log(tempPath);
        // 输出 URL 到 stderr
        process.stderr.write(`URL:${url}\n`);

    } catch (error) {
        process.stderr.write(`ERROR: ${error.message}\n`);
        process.exit(1);
    }
}

// 运行主函数
main().catch(error => {
    process.stderr.write(`ERROR: ${error.message}\n`);
    process.exit(1);
});
