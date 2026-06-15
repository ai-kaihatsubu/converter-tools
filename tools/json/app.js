/* ============================================
   JSON整形・検証ツール : app.js
   バニラJS / 外部依存なし
   - ダーク/ライト切替（localStorage保存）
   - Proフラグ判定（広告非表示などの分岐の起点）
   - JSON整形（インデント2/4・キーソート）、圧縮、検証
   - 入力値はサーバーに送信・保存しない（表示設定のみ保存）
   ============================================ */

(function () {
  "use strict";

  const STORAGE_KEY_THEME = "tf_theme"; // "light" | "dark"
  const STORAGE_KEY_PRO = "tf_pro";     // "1" で Pro 有効（擬似フラグ）

  /* ---------- テーマ切替 ---------- */
  function initTheme() {
    const toggle = document.getElementById("theme-toggle");
    const root = document.documentElement;

    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");
    applyTheme(initial);

    if (toggle) {
      toggle.addEventListener("click", () => {
        const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
        const next = current === "dark" ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY_THEME, next);
      });
    }

    function applyTheme(theme) {
      if (theme === "dark") {
        root.setAttribute("data-theme", "dark");
        if (toggle) {
          toggle.setAttribute("aria-pressed", "true");
          toggle.innerHTML = '<span aria-hidden="true">☀️</span>';
        }
      } else {
        root.removeAttribute("data-theme");
        if (toggle) {
          toggle.setAttribute("aria-pressed", "false");
          toggle.innerHTML = '<span aria-hidden="true">🌙</span>';
        }
      }
    }
  }

  /* ---------- Pro判定（広告非表示など） ---------- */
  function isPro() {
    return localStorage.getItem(STORAGE_KEY_PRO) === "1";
  }

  function applyProState() {
    if (isPro()) {
      document.body.classList.add("is-pro");
      document.querySelectorAll(".ad-slot").forEach((el) => {
        el.style.display = "none";
      });
    }
  }

  /* ---------- 開発用Pro切替ボタン ---------- */
  function initDevProToggle() {
    const btn = document.getElementById("dev-pro-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = isPro() ? "0" : "1";
      localStorage.setItem(STORAGE_KEY_PRO, next);
      location.reload();
    });
  }

  window.ToolFactory = { isPro: isPro };

  /* ============================================
     JSON整形・検証ツール本体
     ============================================ */

  let dom = {};

  function initTool() {
    dom = {
      input: document.getElementById("json-input"),
      resultBox: document.getElementById("result-box"),
      resultHeading: document.getElementById("result-heading"),
      output: document.getElementById("json-output"),
      resultMeta: document.getElementById("result-meta"),
      statusMessage: document.getElementById("status-message"),
      btnFormat: document.getElementById("btn-format"),
      btnMinify: document.getElementById("btn-minify"),
      btnValidate: document.getElementById("btn-validate"),
      btnClear: document.getElementById("btn-clear"),
      btnCopy: document.getElementById("btn-copy"),
      sortKeys: document.getElementById("sort-keys"),
    };

    if (!dom.input) return; // tool-root未実装ページでは何もしない

    bindEvents();
    initDevProToggle();
  }

  function bindEvents() {
    dom.btnFormat.addEventListener("click", handleFormat);
    dom.btnMinify.addEventListener("click", handleMinify);
    dom.btnValidate.addEventListener("click", handleValidate);
    dom.btnClear.addEventListener("click", handleClear);
    dom.btnCopy.addEventListener("click", handleCopy);
  }

  /* ---------- キーのアルファベット順ソート（再帰） ---------- */
  function sortObjectKeysDeep(value) {
    if (Array.isArray(value)) {
      return value.map(sortObjectKeysDeep);
    }
    if (value !== null && typeof value === "object") {
      const sorted = {};
      Object.keys(value)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .forEach((key) => {
          sorted[key] = sortObjectKeysDeep(value[key]);
        });
      return sorted;
    }
    return value;
  }

  /* ---------- JSONエラーの位置を推定 ---------- */
  function describeJsonError(text, error) {
    const message = error && error.message ? error.message : String(error);

    // Chrome/Edge系: "...at position 123 (line 4 column 7)" のような形式
    const posMatch = message.match(/position\s+(\d+)/i);
    let position = posMatch ? Number(posMatch[1]) : null;

    let line = null;
    let column = null;
    const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lineColMatch) {
      line = Number(lineColMatch[1]);
      column = Number(lineColMatch[2]);
    } else if (position !== null) {
      // positionから行・列を計算（Firefox等で line/column が無い場合）
      const upToPos = text.slice(0, position);
      const lines = upToPos.split("\n");
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    let snippet = "";
    if (position !== null) {
      const start = Math.max(0, position - 20);
      const end = Math.min(text.length, position + 20);
      const before = text.slice(start, position);
      const after = text.slice(position, end);
      snippet = `…${before}␤▶${after}…`.replace(/\n/g, "\\n");
    }

    const parts = [`エラー内容: ${message}`];
    if (line !== null && column !== null) {
      parts.push(`位置: ${line}行目 ${column}文字目付近${position !== null ? `（全体の${position}文字目）` : ""}`);
    } else if (position !== null) {
      parts.push(`位置: 全体の${position}文字目付近`);
    }
    if (snippet) {
      parts.push(`周辺テキスト: ${snippet}`);
    }
    parts.push("ヒント: 末尾の余分な「,」、引用符の閉じ忘れ、キーが文字列として引用されていない、などが典型的な原因です。");

    return parts.join("\n");
  }

  function getInputText() {
    return dom.input.value;
  }

  function showResult(heading, text, meta, isError) {
    dom.resultBox.hidden = false;
    dom.resultHeading.textContent = heading;
    dom.output.textContent = text;
    dom.resultMeta.textContent = meta || "";
    dom.output.classList.toggle("is-error", !!isError);
    dom.btnCopy.disabled = !!isError;
  }

  function setStatus(message, isError) {
    dom.statusMessage.textContent = message;
    dom.statusMessage.classList.toggle("status-error", !!isError);
    dom.statusMessage.classList.toggle("status-success", !isError && !!message);
  }

  /* ---------- 整形 ---------- */
  function handleFormat() {
    const text = getInputText();
    const indent = document.querySelector('input[name="indent"]:checked').value;
    const indentSize = Number(indent) || 2;

    try {
      let parsed = JSON.parse(text);
      if (dom.sortKeys.checked) {
        parsed = sortObjectKeysDeep(parsed);
      }
      const formatted = JSON.stringify(parsed, null, indentSize);
      showResult("整形結果", formatted, `インデント${indentSize}${dom.sortKeys.checked ? " / キーをアルファベット順にソート" : ""} / ${formatted.length.toLocaleString("ja-JP")}文字`, false);
      setStatus("整形しました。", false);
    } catch (error) {
      showResult("エラー", describeJsonError(text, error), "", true);
      setStatus("JSONとして解析できませんでした。下記のエラー内容をご確認ください。", true);
    }
  }

  /* ---------- 圧縮 ---------- */
  function handleMinify() {
    const text = getInputText();

    try {
      let parsed = JSON.parse(text);
      if (dom.sortKeys.checked) {
        parsed = sortObjectKeysDeep(parsed);
      }
      const minified = JSON.stringify(parsed);
      const before = text.length;
      const after = minified.length;
      const reduced = before > 0 ? Math.round((1 - after / before) * 100) : 0;
      showResult(
        "圧縮結果",
        minified,
        `${before.toLocaleString("ja-JP")}文字 → ${after.toLocaleString("ja-JP")}文字（約${reduced}%削減）${dom.sortKeys.checked ? " / キーをアルファベット順にソート" : ""}`,
        false
      );
      setStatus("圧縮しました。", false);
    } catch (error) {
      showResult("エラー", describeJsonError(text, error), "", true);
      setStatus("JSONとして解析できませんでした。下記のエラー内容をご確認ください。", true);
    }
  }

  /* ---------- 検証 ---------- */
  function handleValidate() {
    const text = getInputText();

    if (text.trim() === "") {
      showResult("検証結果", "入力が空です。JSONを入力してください。", "", true);
      setStatus("入力が空です。", true);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const typeLabel = Array.isArray(parsed) ? "配列（Array）" : parsed === null ? "null" : typeof parsed;
      showResult(
        "検証結果",
        `✅ 有効なJSONです。\nトップレベルの型: ${typeLabel}\n文字数: ${text.length.toLocaleString("ja-JP")}文字`,
        "",
        false
      );
      setStatus("有効なJSONです。", false);
    } catch (error) {
      showResult("検証結果", `❌ 不正なJSONです。\n\n${describeJsonError(text, error)}`, "", true);
      setStatus("不正なJSONです。エラー内容をご確認ください。", true);
    }
  }

  /* ---------- クリア ---------- */
  function handleClear() {
    dom.input.value = "";
    dom.resultBox.hidden = true;
    dom.output.textContent = "";
    dom.resultMeta.textContent = "";
    setStatus("クリアしました。", false);
    dom.input.focus();
  }

  /* ---------- コピー ---------- */
  function handleCopy() {
    const text = dom.output.textContent;
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setStatus("結果をコピーしました。", false);
        })
        .catch(() => {
          setStatus("コピーに失敗しました。", true);
        });
    } else {
      setStatus("コピー機能はこのブラウザでは利用できません。", true);
    }
  }

  /* ---------- 起動 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    applyProState();
    initTool();
  });
})();
