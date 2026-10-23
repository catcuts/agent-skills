/**
 * bridge-inject.js
 * 注入到 kimi.com 页面的桥接脚本，定义 window.__kimiBridge。
 * 由 bin/kimi-web-chat.js 读取文件内容后通过 webbridge evaluate 注入。
 * 幂等：重复注入直接返回 'already-injected'。
 *
 * 页面结构依赖（2026-08 实测，若失效需更新选择器）：
 *   输入框:   .chat-input-editor[contenteditable="true"]
 *   发送按钮: .send-button-container（无 .disabled 时可点击）
 *   回复段:   .segment.segment-assistant .segment-content-box
 *   思考块:   .thinking-container（默认从回复中剥离）
 */
(() => {
  if (window.__kimiBridge && window.__kimiBridge.version === 1) return 'already-injected';

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  window.__kimiBridge = {
    version: 1,

    sel: {
      editor: '.chat-input-editor[contenteditable="true"]',
      sendBtn: '.send-button-container',
      assistantSeg: '.segment.segment-assistant',
      contentBox: '.segment.segment-assistant .segment-content-box',
      thinking: '.thinking-container',
    },

    hasEditor() {
      return !!document.querySelector(this.sel.editor);
    },

    async setText(text) {
      const ed = document.querySelector(this.sel.editor);
      if (!ed) throw new Error('editor-not-found');
      ed.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      await sleep(60);
      return ed.innerText;
    },

    async clickSend() {
      for (let i = 0; i < 50; i++) {
        const btn = document.querySelector(this.sel.sendBtn);
        if (btn && !btn.classList.contains('disabled')) {
          btn.click();
          return true;
        }
        await sleep(100);
      }
      throw new Error('send-button-disabled-timeout');
    },

    async send(text) {
      await this.setText(text);
      await this.clickSend();
      return true;
    },

    assistantCount() {
      return document.querySelectorAll(this.sel.assistantSeg).length;
    },

    lastReply(withThinking = false) {
      const segs = document.querySelectorAll(this.sel.contentBox);
      if (!segs.length) return '';
      const last = segs[segs.length - 1];
      if (withThinking) return last.innerText.trim();
      const mds = [...last.querySelectorAll('.markdown-container')].filter(
        (m) => !m.closest(this.sel.thinking)
      );
      return mds.map((m) => m.innerText).join('\n').trim();
    },

    async waitReply(timeoutMs = 120000) {
      const t0 = Date.now();
      const base = this._baseCount || 0;
      while (Date.now() - t0 < timeoutMs) {
        if (this.assistantCount() > base) break;
        await sleep(300);
      }
      if (this.assistantCount() <= base) throw new Error('reply-timeout');

      // 完成判定：文本连续 3 次（间隔 500ms）无变化视为生成完毕。
      // 页面上无可靠的完成标记（stop 按钮非常驻、actions 行 hover 才出现），此为实测最稳启发式。
      let last = '';
      let stable = 0;
      while (Date.now() - t0 < timeoutMs) {
        await sleep(500);
        const cur = this.lastReply();
        if (cur && cur === last) {
          if (++stable >= 3) return { text: cur, ms: Date.now() - t0, partial: false };
        } else {
          stable = 0;
          last = cur;
        }
      }
      return { text: this.lastReply(), ms: Date.now() - t0, partial: true };
    },

    async ask(text, timeoutMs = 120000) {
      this._baseCount = this.assistantCount();
      await this.send(text);
      return this.waitReply(timeoutMs);
    },
  };

  return 'injected';
})();
