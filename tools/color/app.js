/* ============================================
   カラーコード変換ツール : app.js
   バニラJS / 外部依存なし
   - HEX / RGB / HSL / RGBA / HSLA 相互変換（透明度スライダー連動）
   - カラーピッカー連動
   - 各表記のコピー
   - ランダム色生成・よく使う色サンプル
   - WCAGコントラスト比チェック（AA/AAA判定）
   - ダーク/ライト切替（localStorage保存）・Proフラグ
   ============================================ */

(function () {
  "use strict";

  const STORAGE_KEY_THEME = "tf_theme"; // "light" | "dark"
  const STORAGE_KEY_PRO = "tf_pro";     // "1" でお布施済みフラグ（擬似）

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

  /* ---------- お布施フラグ判定 ---------- */
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

  function initDevProToggle() {
    const btn = document.getElementById("dev-pro-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = isPro() ? "0" : "1";
      localStorage.setItem(STORAGE_KEY_PRO, next);
      location.reload();
    });
  }

  /* ============================================
     色変換ユーティリティ
     ============================================ */

  // #rgb / #rrggbb / #rrggbbaa -> {r,g,b,a}
  function parseHex(str) {
    const s = str.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{4}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(s)) {
      return null;
    }
    let r, g, b, a = 1;
    if (s.length === 3) {
      r = parseInt(s[0] + s[0], 16);
      g = parseInt(s[1] + s[1], 16);
      b = parseInt(s[2] + s[2], 16);
    } else if (s.length === 4) {
      r = parseInt(s[0] + s[0], 16);
      g = parseInt(s[1] + s[1], 16);
      b = parseInt(s[2] + s[2], 16);
      a = parseInt(s[3] + s[3], 16) / 255;
    } else if (s.length === 6) {
      r = parseInt(s.slice(0, 2), 16);
      g = parseInt(s.slice(2, 4), 16);
      b = parseInt(s.slice(4, 6), 16);
    } else if (s.length === 8) {
      r = parseInt(s.slice(0, 2), 16);
      g = parseInt(s.slice(2, 4), 16);
      b = parseInt(s.slice(4, 6), 16);
      a = parseInt(s.slice(6, 8), 16) / 255;
    }
    return { r, g, b, a: Math.round(a * 100) / 100 };
  }

  // rgb(r,g,b) / rgba(r,g,b,a) -> {r,g,b,a}
  function parseRgbString(str) {
    const m = str.trim().match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i
    );
    if (!m) return null;
    const r = parseInt(m[1], 10);
    const g = parseInt(m[2], 10);
    const b = parseInt(m[3], 10);
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (r > 255 || g > 255 || b > 255 || a < 0 || a > 1) return null;
    return { r, g, b, a: Math.round(a * 100) / 100 };
  }

  // hsl(h,s%,l%) / hsla(h,s%,l%,a) -> {h,s,l,a}
  function parseHslString(str) {
    const m = str.trim().match(
      /^hsla?\(\s*(-?\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(?:,\s*([\d.]+)\s*)?\)$/i
    );
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const s = parseInt(m[2], 10);
    const l = parseInt(m[3], 10);
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (s > 100 || l > 100 || a < 0 || a > 1) return null;
    h = ((h % 360) + 360) % 360;
    return { h, s, l, a: Math.round(a * 100) / 100 };
  }

  // RGB -> HSL
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  // HSL -> RGB
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  function toHex2(n) {
    return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  }

  function rgbToHex(r, g, b) {
    return "#" + toHex2(r) + toHex2(g) + toHex2(b);
  }

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  /* ============================================
     ツール本体
     ============================================ */
  function initColorConverter() {
    const hexInput = document.getElementById("hex-input");
    const rgbInput = document.getElementById("rgb-input");
    const hslInput = document.getElementById("hsl-input");
    const rgbaInput = document.getElementById("rgba-input");
    const hslaInput = document.getElementById("hsla-input");
    const alphaRange = document.getElementById("alpha-range");
    const alphaValue = document.getElementById("alpha-value");
    const colorPicker = document.getElementById("color-picker");
    const colorPreview = document.getElementById("color-preview");
    const randomBtn = document.getElementById("random-color-btn");
    const swatches = document.getElementById("swatches");

    if (!hexInput) return; // このページにツールが無い場合

    // 現在の色の正規モデル: {r,g,b,a}（0-255 / 0-1）
    let current = { r: 37, g: 99, b: 235, a: 1 };

    function clearErrors() {
      ["hex-error", "rgb-error", "hsl-error", "rgba-error", "hsla-error"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
      });
    }

    function setError(fieldId, message) {
      const el = document.getElementById(fieldId + "-error");
      if (el) el.textContent = message;
    }

    // current から全フィールドを再描画（skipId: 編集中で上書きしたくないフィールドのID）
    function render(skipId) {
      const { r, g, b, a } = current;
      const hsl = rgbToHsl(r, g, b);

      if (skipId !== "hex-input") hexInput.value = rgbToHex(r, g, b);
      if (skipId !== "rgb-input") rgbInput.value = `rgb(${r}, ${g}, ${b})`;
      if (skipId !== "hsl-input") hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      if (skipId !== "rgba-input") rgbaInput.value = `rgba(${r}, ${g}, ${b}, ${a})`;
      if (skipId !== "hsla-input") hslaInput.value = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`;
      if (skipId !== "alpha-range") {
        alphaRange.value = String(a);
        alphaValue.textContent = a.toFixed(2);
      }

      colorPicker.value = rgbToHex(r, g, b);
      colorPreview.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
      colorPreview.style.backgroundImage =
        "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), " +
        "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)";
      colorPreview.style.backgroundSize = "20px 20px";
      colorPreview.style.backgroundPosition = "0 0, 10px 10px";
    }

    hexInput.addEventListener("input", () => {
      clearErrors();
      const parsed = parseHex(hexInput.value);
      if (!parsed) {
        setError("hex", "HEXの形式が正しくありません（例: #2563eb）");
        return;
      }
      current = { r: parsed.r, g: parsed.g, b: parsed.b, a: parsed.a !== undefined ? parsed.a : current.a };
      render("hex-input");
    });

    rgbInput.addEventListener("input", () => {
      clearErrors();
      const parsed = parseRgbString(rgbInput.value);
      if (!parsed) {
        setError("rgb", "RGBの形式が正しくありません（例: rgb(37, 99, 235)）");
        return;
      }
      current = { r: parsed.r, g: parsed.g, b: parsed.b, a: current.a };
      render("rgb-input");
    });

    hslInput.addEventListener("input", () => {
      clearErrors();
      const parsed = parseHslString(hslInput.value);
      if (!parsed) {
        setError("hsl", "HSLの形式が正しくありません（例: hsl(221, 83%, 53%)）");
        return;
      }
      const rgb = hslToRgb(parsed.h, parsed.s, parsed.l);
      current = { r: rgb.r, g: rgb.g, b: rgb.b, a: current.a };
      render("hsl-input");
    });

    rgbaInput.addEventListener("input", () => {
      clearErrors();
      const parsed = parseRgbString(rgbaInput.value);
      if (!parsed) {
        setError("rgba", "RGBAの形式が正しくありません（例: rgba(37, 99, 235, 1)）");
        return;
      }
      current = { r: parsed.r, g: parsed.g, b: parsed.b, a: parsed.a };
      render("rgba-input");
    });

    hslaInput.addEventListener("input", () => {
      clearErrors();
      const parsed = parseHslString(hslaInput.value);
      if (!parsed) {
        setError("hsla", "HSLAの形式が正しくありません（例: hsla(221, 83%, 53%, 1)）");
        return;
      }
      const rgb = hslToRgb(parsed.h, parsed.s, parsed.l);
      current = { r: rgb.r, g: rgb.g, b: rgb.b, a: parsed.a };
      render("hsla-input");
    });

    alphaRange.addEventListener("input", () => {
      clearErrors();
      current.a = clamp01(parseFloat(alphaRange.value));
      render("alpha-range");
    });

    colorPicker.addEventListener("input", () => {
      clearErrors();
      const parsed = parseHex(colorPicker.value);
      if (!parsed) return;
      current = { r: parsed.r, g: parsed.g, b: parsed.b, a: current.a };
      render("color-picker");
    });

    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        clearErrors();
        current = {
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256),
          a: current.a,
        };
        render(null);
      });
    }

    // よく使う色サンプル
    const PRESET_COLORS = [
      "#ef4444", "#f59e0b", "#facc15", "#22c55e", "#10b981",
      "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
      "#1a1d23", "#5f6672", "#e2e5ea", "#ffffff",
    ];
    if (swatches) {
      PRESET_COLORS.forEach((hex) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "swatch";
        btn.style.backgroundColor = hex;
        btn.setAttribute("role", "listitem");
        btn.setAttribute("aria-label", `色を選択: ${hex}`);
        btn.title = hex;
        btn.addEventListener("click", () => {
          clearErrors();
          const parsed = parseHex(hex);
          current = { r: parsed.r, g: parsed.g, b: parsed.b, a: current.a };
          render(null);
        });
        swatches.appendChild(btn);
      });
    }

    // コピー機能
    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-copy-target");
        const target = document.getElementById(targetId);
        if (!target) return;
        copyToClipboard(target.value, btn);
      });
    });

    function copyToClipboard(text, btn) {
      const done = () => {
        const original = btn.textContent;
        btn.textContent = "コピー済み";
        setTimeout(() => {
          btn.textContent = original;
        }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      } else {
        fallbackCopy(text, done);
      }
    }

    function fallbackCopy(text, done) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        // 無視
      }
      document.body.removeChild(ta);
    }

    // 初期描画
    render(null);
  }

  /* ============================================
     コントラスト比チェック（WCAG）
     ============================================ */
  function initContrastChecker() {
    const fgColor = document.getElementById("fg-color");
    const fgHex = document.getElementById("fg-hex");
    const bgColor = document.getElementById("bg-color");
    const bgHex = document.getElementById("bg-hex");
    const preview = document.getElementById("contrast-preview");
    const sampleText = document.getElementById("contrast-sample-text");
    const ratioValue = document.getElementById("contrast-ratio-value");

    if (!fgColor || !bgColor) return;

    // sRGB -> 相対輝度
    function relLuminance(hex) {
      const parsed = parseHex(hex);
      if (!parsed) return null;
      const channels = [parsed.r, parsed.g, parsed.b].map((c) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    function contrastRatio(hex1, hex2) {
      const l1 = relLuminance(hex1);
      const l2 = relLuminance(hex2);
      if (l1 === null || l2 === null) return null;
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function setBadge(id, pass) {
      const li = document.getElementById(id);
      if (!li) return;
      const badge = li.querySelector(".badge");
      if (!badge) return;
      badge.textContent = pass ? "合格" : "不合格";
      badge.classList.toggle("badge-pass", pass);
      badge.classList.toggle("badge-fail", !pass);
    }

    function update() {
      const fg = fgHex.value;
      const bg = bgHex.value;
      const parsedFg = parseHex(fg);
      const parsedBg = parseHex(bg);
      if (!parsedFg || !parsedBg) return;

      preview.style.color = fg;
      preview.style.backgroundColor = bg;

      const ratio = contrastRatio(fg, bg);
      if (ratio === null) return;
      ratioValue.textContent = ratio.toFixed(2);

      setBadge("wcag-aa-normal", ratio >= 4.5);
      setBadge("wcag-aa-large", ratio >= 3);
      setBadge("wcag-aaa-normal", ratio >= 7);
      setBadge("wcag-aaa-large", ratio >= 4.5);
    }

    fgColor.addEventListener("input", () => {
      fgHex.value = fgColor.value;
      update();
    });
    bgColor.addEventListener("input", () => {
      bgHex.value = bgColor.value;
      update();
    });
    fgHex.addEventListener("input", () => {
      const parsed = parseHex(fgHex.value);
      if (parsed) {
        fgColor.value = rgbToHex(parsed.r, parsed.g, parsed.b);
        update();
      }
    });
    bgHex.addEventListener("input", () => {
      const parsed = parseHex(bgHex.value);
      if (parsed) {
        bgColor.value = rgbToHex(parsed.r, parsed.g, parsed.b);
        update();
      }
    });

    update();
  }

  /* ---------- 起動 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    applyProState();
    initDevProToggle();
    initColorConverter();
    initContrastChecker();
  });

  // 他ファイルから利用できるよう公開
  window.ToolFactory = {
    isPro,
    STORAGE_KEY_PRO,
    STORAGE_KEY_THEME,
  };
})();
