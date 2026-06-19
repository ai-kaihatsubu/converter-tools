/* ============================================
   019-recipe-converter : app.js
   バニラJS / 外部依存なし
   - ダーク/ライト切替（localStorage保存）
   - Proフラグ判定
   - 大さじ/小さじ/カップ ⇔ ml/g 換算（調味料の比重テーブル使用）
   - 人数換算（倍率計算）
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

  /* ---------- Pro判定 ---------- */
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

  /* ============================================
     分量換算データ
     ============================================ */

  // 単位 → ml への換算係数（日本の標準的な計量スプーン・カップ）
  const UNIT_TO_ML = {
    tbsp: 15,  // 大さじ1
    tsp: 5,    // 小さじ1
    cup: 200,  // カップ1
    ml: 1,
  };

  const UNIT_LABEL = {
    tbsp: "大さじ",
    tsp: "小さじ",
    cup: "カップ",
    ml: "ml",
  };

  // 代表的な調味料・材料の密度（1mlあたりのg）。あくまで目安。
  const INGREDIENTS = [
    { id: "water", label: "水", density: 1.0 },
    { id: "sugar", label: "砂糖（上白糖）", density: 1.0 },
    { id: "salt", label: "塩（食塩）", density: 1.2 },
    { id: "soy_sauce", label: "醤油", density: 1.2 },
    { id: "vegetable_oil", label: "油（サラダ油）", density: 0.92 },
    { id: "flour", label: "小麦粉", density: 0.55 },
    { id: "miso", label: "味噌", density: 1.2 },
    { id: "mirin", label: "みりん", density: 1.18 },
    { id: "vinegar", label: "酢", density: 1.02 },
    { id: "butter", label: "バター", density: 0.95 },
    { id: "milk", label: "牛乳", density: 1.03 },
    { id: "honey", label: "はちみつ", density: 1.4 },
  ];

  // 数値を読みやすい小数に整形（不要な末尾0を削る）
  function formatNumber(num) {
    if (!isFinite(num)) return "-";
    const rounded = Math.round(num * 100) / 100;
    return rounded.toString();
  }

  /* ---------- 単位換算ツール ---------- */
  function initUnitConverter() {
    const amountInput = document.getElementById("amount-input");
    const unitSelect = document.getElementById("unit-select");
    const ingredientSelect = document.getElementById("ingredient-select");
    const resultBox = document.getElementById("unit-result");
    const densityTableBody = document.querySelector("#density-table tbody");
    if (!amountInput || !unitSelect || !ingredientSelect || !resultBox) return;

    // 調味料セレクトを生成
    INGREDIENTS.forEach((ing) => {
      const opt = document.createElement("option");
      opt.value = ing.id;
      opt.textContent = ing.label;
      ingredientSelect.appendChild(opt);
    });

    // 密度換算表を生成
    if (densityTableBody) {
      INGREDIENTS.forEach((ing) => {
        const tr = document.createElement("tr");

        const tdName = document.createElement("td");
        tdName.textContent = ing.label;

        const tdDensity = document.createElement("td");
        tdDensity.textContent = formatNumber(ing.density);

        const tdTbsp = document.createElement("td");
        tdTbsp.textContent = formatNumber(ing.density * 15);

        const tdTsp = document.createElement("td");
        tdTsp.textContent = formatNumber(ing.density * 5);

        tr.appendChild(tdName);
        tr.appendChild(tdDensity);
        tr.appendChild(tdTbsp);
        tr.appendChild(tdTsp);
        densityTableBody.appendChild(tr);
      });
    }

    function render() {
      const amount = parseFloat(amountInput.value);
      const unit = unitSelect.value;
      const ingredientId = ingredientSelect.value;
      const ingredient = INGREDIENTS.find((i) => i.id === ingredientId) || INGREDIENTS[0];

      resultBox.innerHTML = "";

      if (isNaN(amount) || amount < 0) {
        const p = document.createElement("p");
        p.className = "result-main";
        p.textContent = "数値を入力してください。";
        resultBox.appendChild(p);
        return;
      }

      const ml = amount * (UNIT_TO_ML[unit] || 1);
      const g = ml * ingredient.density;

      const main = document.createElement("p");
      main.className = "result-main";
      main.textContent =
        amount + " " + UNIT_LABEL[unit] + " ＝ " + formatNumber(ml) + " ml ＝ 約 " + formatNumber(g) + " g（" + ingredient.label + "）";

      const sub = document.createElement("p");
      sub.className = "result-sub";
      sub.textContent = "※ " + ingredient.label + " の比重を 1ml = " + formatNumber(ingredient.density) + "g として計算した目安値です。";

      resultBox.appendChild(main);
      resultBox.appendChild(sub);
    }

    amountInput.addEventListener("input", render);
    unitSelect.addEventListener("change", render);
    ingredientSelect.addEventListener("change", render);

    render();
  }

  /* ---------- 人数換算ツール ---------- */
  function initServingConverter() {
    const baseInput = document.getElementById("base-servings");
    const targetInput = document.getElementById("target-servings");
    const amountInput = document.getElementById("ingredient-amount");
    const resultBox = document.getElementById("serving-result");
    if (!baseInput || !targetInput || !amountInput || !resultBox) return;

    function render() {
      const base = parseFloat(baseInput.value);
      const target = parseFloat(targetInput.value);
      const amount = parseFloat(amountInput.value);

      resultBox.innerHTML = "";

      if (isNaN(base) || isNaN(target) || isNaN(amount) || base <= 0 || target < 0 || amount < 0) {
        const p = document.createElement("p");
        p.className = "result-main";
        p.textContent = "基準人数・目的人数・材料の量を正しく入力してください。";
        resultBox.appendChild(p);
        return;
      }

      const ratio = target / base;
      const converted = amount * ratio;

      const main = document.createElement("p");
      main.className = "result-main";
      main.textContent =
        base + "人分 → " + target + "人分（倍率 " + formatNumber(ratio) + "倍）：" +
        amount + " → 約 " + formatNumber(converted);

      const sub = document.createElement("p");
      sub.className = "result-sub";
      sub.textContent = "※ 材料の量に倍率を掛けた目安値です。塩分・調味料は味を見ながら調整してください。";

      resultBox.appendChild(main);
      resultBox.appendChild(sub);
    }

    baseInput.addEventListener("input", render);
    targetInput.addEventListener("input", render);
    amountInput.addEventListener("input", render);

    render();
  }

  function initTool() {
    initUnitConverter();
    initServingConverter();
  }

  /* ---------- 起動 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    applyProState();
    initTool();
  });

  window.ToolFactory = {
    isPro,
    STORAGE_KEY_PRO,
    STORAGE_KEY_THEME,
  };
})();
