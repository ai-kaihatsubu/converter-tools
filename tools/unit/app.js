/* ============================================
   単位変換ツール : app.js
   バニラJS / 外部依存なし
   - ダーク/ライト切替（localStorage保存）
   - お布施フラグ判定（分岐の起点）
   - カテゴリ（長さ・重さ・温度・面積・体積・速度・データ容量・時間）の単位変換
   - 入力値・選択単位はlocalStorageに保存（個人情報を含まない設定値のみ）
   ============================================ */

(function () {
  "use strict";

  const STORAGE_KEY_THEME = "tf_theme"; // "light" | "dark"
  const STORAGE_KEY_PRO = "tf_pro";     // "1" でお布施済みフラグ（擬似）
  const STORAGE_KEY_STATE = "unitconv_state"; // カテゴリ・値・単位の選択状態のみ保存

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
     単位変換ツール本体
     ============================================ */

  // 各カテゴリ: 単位は係数(SI基準など)を持つ。よく使う単位を先頭に。
  // 温度は係数ではなく toBase/fromBase 関数で変換する。
  const CATEGORIES = {
    length: {
      label: "長さ",
      base: "m",
      note: "基準単位: メートル(m)",
      units: [
        { id: "mm", label: "ミリメートル (mm)", factor: 0.001 },
        { id: "cm", label: "センチメートル (cm)", factor: 0.01 },
        { id: "m", label: "メートル (m)", factor: 1 },
        { id: "km", label: "キロメートル (km)", factor: 1000 },
        { id: "in", label: "インチ (in)", factor: 0.0254 },
        { id: "ft", label: "フィート (ft)", factor: 0.3048 },
        { id: "yd", label: "ヤード (yd)", factor: 0.9144 },
        { id: "mile", label: "マイル (mile)", factor: 1609.344 },
        { id: "nmile", label: "海里 (nautical mile)", factor: 1852 },
        { id: "shaku", label: "尺", factor: 0.30303 },
      ],
    },
    weight: {
      label: "重さ",
      base: "kg",
      note: "基準単位: キログラム(kg)",
      units: [
        { id: "mg", label: "ミリグラム (mg)", factor: 0.000001 },
        { id: "g", label: "グラム (g)", factor: 0.001 },
        { id: "kg", label: "キログラム (kg)", factor: 1 },
        { id: "t", label: "トン (t)", factor: 1000 },
        { id: "oz", label: "オンス (oz)", factor: 0.028349523125 },
        { id: "lb", label: "ポンド (lb)", factor: 0.45359237 },
        { id: "kan", label: "貫", factor: 3.75 },
      ],
    },
    temperature: {
      label: "温度",
      base: "c",
      note: "℃・℉・K は式で変換します（係数変換ではありません）",
      units: [
        { id: "c", label: "摂氏 (℃)" },
        { id: "f", label: "華氏 (℉)" },
        { id: "k", label: "ケルビン (K)" },
      ],
    },
    area: {
      label: "面積",
      base: "m2",
      note: "基準単位: 平方メートル(m²)",
      units: [
        { id: "cm2", label: "平方センチメートル (cm²)", factor: 0.0001 },
        { id: "m2", label: "平方メートル (m²)", factor: 1 },
        { id: "km2", label: "平方キロメートル (km²)", factor: 1000000 },
        { id: "ha", label: "ヘクタール (ha)", factor: 10000 },
        { id: "tsubo", label: "坪", factor: 3.305785 },
        { id: "jo", label: "畳", factor: 1.6529 },
        { id: "acre", label: "エーカー (acre)", factor: 4046.8564224 },
        { id: "ft2", label: "平方フィート (ft²)", factor: 0.09290304 },
      ],
    },
    volume: {
      label: "体積",
      base: "l",
      note: "基準単位: リットル(L)",
      units: [
        { id: "ml", label: "ミリリットル (mL)", factor: 0.001 },
        { id: "l", label: "リットル (L)", factor: 1 },
        { id: "m3", label: "立方メートル (m³)", factor: 1000 },
        { id: "cc", label: "立方センチメートル (cm³ / cc)", factor: 0.001 },
        { id: "go", label: "合", factor: 0.18039 },
        { id: "us_gal", label: "米ガロン (US gal)", factor: 3.785411784 },
        { id: "us_cup", label: "米カップ (US cup)", factor: 0.2365882365 },
        { id: "tbsp", label: "大さじ (15mL)", factor: 0.015 },
        { id: "tsp", label: "小さじ (5mL)", factor: 0.005 },
      ],
    },
    speed: {
      label: "速度",
      base: "ms",
      note: "基準単位: メートル毎秒(m/s)",
      units: [
        { id: "ms", label: "メートル毎秒 (m/s)", factor: 1 },
        { id: "kmh", label: "キロメートル毎時 (km/h)", factor: 1 / 3.6 },
        { id: "mph", label: "マイル毎時 (mph)", factor: 0.44704 },
        { id: "knot", label: "ノット (knot)", factor: 0.5144444444444444 },
        { id: "fts", label: "フィート毎秒 (ft/s)", factor: 0.3048 },
      ],
    },
    data: {
      label: "データ容量",
      base: "byte",
      note: "1KB=1024B などの2進接頭辞（IEC）で計算します",
      units: [
        { id: "bit", label: "ビット (bit)", factor: 0.125 },
        { id: "byte", label: "バイト (B)", factor: 1 },
        { id: "kb", label: "キロバイト (KB)", factor: 1024 },
        { id: "mb", label: "メガバイト (MB)", factor: 1024 * 1024 },
        { id: "gb", label: "ギガバイト (GB)", factor: 1024 * 1024 * 1024 },
        { id: "tb", label: "テラバイト (TB)", factor: 1024 * 1024 * 1024 * 1024 },
      ],
    },
    time: {
      label: "時間",
      base: "sec",
      note: "基準単位: 秒(s)",
      units: [
        { id: "ms_t", label: "ミリ秒 (ms)", factor: 0.001 },
        { id: "sec", label: "秒 (s)", factor: 1 },
        { id: "min", label: "分 (min)", factor: 60 },
        { id: "hour", label: "時間 (h)", factor: 3600 },
        { id: "day", label: "日 (day)", factor: 86400 },
        { id: "week", label: "週 (week)", factor: 604800 },
        { id: "month", label: "月 (30日換算)", factor: 2592000 },
        { id: "year", label: "年 (365日換算)", factor: 31536000 },
      ],
    },
  };

  let currentCategory = "length";

  function getElements() {
    return {
      tabs: document.getElementById("category-tabs"),
      inputValue: document.getElementById("input-value"),
      inputUnit: document.getElementById("input-unit"),
      categoryNote: document.getElementById("category-note"),
      statusText: document.getElementById("status-text"),
      resultList: document.getElementById("result-list"),
      resultTemplate: document.getElementById("result-item-template"),
    };
  }

  /* ---------- 温度変換: ℃を基準にtoBase/fromBaseで相互変換 ---------- */
  function temperatureToCelsius(value, unitId) {
    switch (unitId) {
      case "c":
        return value;
      case "f":
        return (value - 32) * (5 / 9);
      case "k":
        return value - 273.15;
      default:
        return value;
    }
  }

  function celsiusTo(value, unitId) {
    switch (unitId) {
      case "c":
        return value;
      case "f":
        return value * (9 / 5) + 32;
      case "k":
        return value + 273.15;
      default:
        return value;
    }
  }

  /* ---------- 数値の整形: 有効桁数を考慮 ---------- */
  function formatNumber(value) {
    if (!isFinite(value)) return "計算不可";
    if (value === 0) return "0";

    const abs = Math.abs(value);

    // 非常に大きい・小さい値は指数表記
    if (abs >= 1e15 || (abs < 1e-9 && abs > 0)) {
      return value.toExponential(6).replace(/\.?0+e/, "e");
    }

    // 有効桁数 10 桁を目安に、末尾の不要な0を削る
    let precision = 10;
    let str = value.toPrecision(precision);

    // 指数表記になってしまった場合（toPrecisionの仕様）に対応
    if (str.includes("e")) {
      return parseFloat(str).toString();
    }

    // 小数点以下の末尾0を削除
    if (str.includes(".")) {
      str = str.replace(/0+$/, "").replace(/\.$/, "");
    }

    return str;
  }

  /* ---------- カテゴリ切替 ---------- */
  function switchCategory(categoryId, els) {
    currentCategory = categoryId;

    // タブのaria-selected更新
    els.tabs.querySelectorAll(".category-tab").forEach((tab) => {
      const isActive = tab.dataset.category === categoryId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const category = CATEGORIES[categoryId];
    els.categoryNote.textContent = category.note;

    // 単位セレクトボックスの再構築
    els.inputUnit.innerHTML = "";
    category.units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.id;
      option.textContent = unit.label;
      els.inputUnit.appendChild(option);
    });

    // 保存状態の復元（同カテゴリの単位が存在する場合のみ）
    const saved = loadState();
    if (saved && saved.category === categoryId && saved.unit) {
      const exists = category.units.some((u) => u.id === saved.unit);
      if (exists) {
        els.inputUnit.value = saved.unit;
      }
    }

    renderResults(els);
  }

  /* ---------- 換算結果のレンダリング ---------- */
  function renderResults(els) {
    const category = CATEGORIES[currentCategory];
    const rawValue = els.inputValue.value;
    const value = parseFloat(rawValue);
    const fromUnitId = els.inputUnit.value;

    els.resultList.innerHTML = "";

    if (rawValue === "" || isNaN(value)) {
      els.statusText.textContent = "数値を入力してください。";
      return;
    }
    els.statusText.textContent = "";

    category.units.forEach((unit) => {
      let resultValue;

      if (currentCategory === "temperature") {
        const celsius = temperatureToCelsius(value, fromUnitId);
        resultValue = celsiusTo(celsius, unit.id);
      } else {
        const fromUnit = category.units.find((u) => u.id === fromUnitId);
        const baseValue = value * fromUnit.factor;
        resultValue = baseValue / unit.factor;
      }

      const li = els.resultTemplate.content.firstElementChild.cloneNode(true);
      const formatted = formatNumber(resultValue);
      li.querySelector(".unit-result-item__name").textContent = unit.label;
      li.querySelector(".unit-result-item__value").textContent = formatted;

      if (unit.id === fromUnitId) {
        li.classList.add("unit-result-item--source");
      }

      const copyBtn = li.querySelector(".unit-result-item__copy");
      copyBtn.addEventListener("click", () => {
        copyToClipboard(formatted, copyBtn);
      });

      els.resultList.appendChild(li);
    });

    saveState(fromUnitId, rawValue);
  }

  /* ---------- クリップボードへコピー ---------- */
  function copyToClipboard(text, btn) {
    const fallback = () => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (e) {
        // 失敗時は何もしない
      }
      document.body.removeChild(textarea);
    };

    const showCopied = () => {
      const original = btn.textContent;
      btn.textContent = "コピーしました";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(() => {
        fallback();
        showCopied();
      });
    } else {
      fallback();
      showCopied();
    }
  }

  /* ---------- 状態の保存・復元（カテゴリ・値・単位のみ） ---------- */
  function saveState(unitId, value) {
    try {
      localStorage.setItem(
        STORAGE_KEY_STATE,
        JSON.stringify({ category: currentCategory, unit: unitId, value: value })
      );
    } catch (e) {
      // localStorageが使用できない環境では保存をスキップ
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /* ---------- 初期化 ---------- */
  function initConverter() {
    const els = getElements();

    els.tabs.querySelectorAll(".category-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        switchCategory(tab.dataset.category, els);
      });
    });

    els.inputValue.addEventListener("input", () => renderResults(els));
    els.inputUnit.addEventListener("change", () => renderResults(els));

    // 保存状態からカテゴリ・値を復元
    const saved = loadState();
    let initialCategory = "length";
    if (saved && CATEGORIES[saved.category]) {
      initialCategory = saved.category;
      if (saved.value !== undefined && saved.value !== "") {
        els.inputValue.value = saved.value;
      }
    }

    switchCategory(initialCategory, els);
  }

  /* ---------- 起動 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    applyProState();
    initDevProToggle();
    initConverter();
  });
})();
