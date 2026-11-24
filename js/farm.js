/* CHAM-Fi mockup · 선택한 농장에 따른 데이터 · 산정 (모든 화면 공용)
 *
 * - 농장 선택(M-02-T)은 sessionStorage에 저장되어 다른 화면에서 이름 · 두수 · 금액이 따라 바뀜 (새로고침해도 유지, 탭을 닫으면 초기화)
 * - 보험 가입 여부(M-04 · 가축재해보험)도 함께 저장되어 담보가치인정액과 한도에 반영됨
 * - 자산평가 진행 상태(개체 조회 완료 · 금융사 조회 완료)도 함께 저장됨
 * - 마크업 규칙: data-f="키" → 텍스트 교체 / data-f-width="share" → 막대 너비 교체
 *
 * 산정식 (부경축공 · Figma 값 기준으로 역산)
 *   소 자산          = 거세우 두수 × 898.75만 원         → 거세우 8두 = 7,190만 원
 *   담보가치(가입)   = 소 자산 × 57.2%                   → 4,110만 원
 *   담보가치(미가입) = 소 자산 × 40%                     → 2,880만 원
 *   금융사 한도      = 기준 한도 × (담보가치 ÷ 4,110만 원)  → 부경축공(가입)이면 Figma 값 그대로
 *
 * 농협부천 · 김해축공은 두수와 자산 · 담보인정가액(가입)을 원 단위로 직접 둔다.
 * 미가입 담보는 그 자산의 40%로 둔다.
 */
(function () {
  "use strict";

  /** 농장별 두수. assetWon · collateralWon 이 있으면 산정식 대신 그 금액을 쓴다 */
  var FARMS = {
    "부경축공": { name: "부경축공", total: 26, steer: 8, male: 10, female: 8 },
    "농협부천": { name: "농협부천", total: 100, steer: 40, male: 32, female: 28, assetWon: 339438963, collateralWon: 149892987 },
    "김해축공": { name: "김해축공", total: 150, steer: 95, male: 36, female: 19, assetWon: 761253915, collateralWon: 272573588 }
  };
  var DEFAULT_FARM = "부경축공";

  var PRICE_PER_STEER = 898.75;   // 만 원
  var RATIO_INSURED = 0.572;
  var RATIO_UNINSURED = 0.4;
  var BASE_COLLATERAL = 4110;     // 기준(부경축공 · 가입) 담보가치인정액, 만 원

  var KEY_FARM = "chamfi.farm";
  var KEY_INSURED = "chamfi.insured";
  var KEY_APPLIED = "chamfi.applied";
  var KEY_ASSESSED = "chamfi.assessed";   // 개체 정보 조회(자산 산정) 완료한 농장 이름
  var KEY_FINANCE = "chamfi.financeChecked"; // 금융사 조회 완료한 농장 이름
  var memory = {};

  // 저장은 sessionStorage(탭 단위) — 화면 이동 · 새로고침에도 값이 유지되고, 탭을 닫으면 사라진다.

  function read(key) {
    try { var v = window.sessionStorage.getItem(key); if (v !== null) return v; } catch (e) { /* 저장소 사용 불가 */ }
    return memory[key] === undefined ? null : memory[key];
  }
  function write(key, value) {
    memory[key] = value;
    try { window.sessionStorage.setItem(key, value); } catch (e) { /* 저장소 사용 불가 */ }
  }

  function round10(n) { return Math.round(n / 10) * 10; }

  /** 만 원 → "1억 2,000만" / "4,110만" */
  function fmtMan(n) {
    var eok = Math.floor(n / 10000);
    var rest = n % 10000;
    var man = rest ? rest.toLocaleString("ko-KR") + "만" : "";
    if (eok && man) return eok + "억 " + man;
    if (eok) return eok + "억";
    return (man || "0만");
  }
  function won(n) { return fmtMan(n) + " 원"; }
  function wonExact(n) { return Math.round(n).toLocaleString("ko-KR") + "원"; }

  var api = {
    FARMS: FARMS,

    get: function () {
      var saved = read(KEY_FARM);
      return FARMS[saved] || FARMS[DEFAULT_FARM];
    },
    set: function (name) {
      if (FARMS[name]) write(KEY_FARM, name);
    },

    /** 신청이 접수된 농장 이름 (신청 전이면 null). 쇼핑몰 홈 상단 진행 배너 노출 기준 */
    applied: function () {
      if (window.CF_PREVIEW_APPLIED) return api.get().name;   // 시안 미리보기(?applied=1)
      var saved = read(KEY_APPLIED);
      return FARMS[saved] ? saved : null;
    },
    setApplied: function (name) {
      name = name || api.get().name;
      if (FARMS[name]) write(KEY_APPLIED, name);
    },
    clearApplied: function () { write(KEY_APPLIED, ""); },

    /** CHAM-Fi 진입 경로: 자산평가를 마친 농장이면 홈, 아니면 농장 선택 */
    entry: function () { return api.assessed() ? "home.html" : "farm-select.html"; },

    /** 농장 선택 후 다음 경로: 자산평가를 마친 농장이면 홈(재심사 없이), 아니면 동의 화면 */
    nextAfterFarm: function (name) { return api.assessed(name) ? "home.html" : "consent.html"; },

    /** 개체 정보 조회(자산 산정)를 마친 농장인지 */
    assessed: function (name) {
      name = name || api.get().name;
      return read(KEY_ASSESSED) === name;
    },
    setAssessed: function (name) {
      name = name || api.get().name;
      if (FARMS[name]) write(KEY_ASSESSED, name);
    },
    clearAssessed: function () { write(KEY_ASSESSED, ""); write(KEY_FINANCE, ""); },

    /** 금융사 조회를 마친 농장인지 */
    financeChecked: function (name) {
      name = name || api.get().name;
      return read(KEY_FINANCE) === name;
    },
    setFinanceChecked: function (name) {
      name = name || api.get().name;
      if (FARMS[name]) write(KEY_FINANCE, name);
    },

    insured: function () { return read(KEY_INSURED) !== "0"; },
    setInsured: function (on) { write(KEY_INSURED, on ? "1" : "0"); },

    fmtMan: fmtMan,

    /** 농장 금액. 반환 단위는 만 원. 직접 입력한 농장은 *Won 필드를 함께 둔다 */
    calc: function (farm) {
      farm = farm || api.get();
      if (farm.assetWon) {
        return {
          asset: farm.assetWon / 10000,
          collateralOn: farm.collateralWon / 10000,
          collateralOff: farm.assetWon * RATIO_UNINSURED / 10000,
          assetWon: farm.assetWon,
          collateralOnWon: farm.collateralWon,
          collateralOffWon: Math.round(farm.assetWon * RATIO_UNINSURED)
        };
      }
      var asset = round10(farm.steer * PRICE_PER_STEER);
      return {
        asset: asset,
        collateralOn: round10(asset * RATIO_INSURED),
        collateralOff: round10(asset * RATIO_UNINSURED)
      };
    },

    /** 현재 보험 가입 여부에 따른 담보가치인정액 (만 원) */
    collateral: function (insured) {
      var c = api.calc();
      if (insured === undefined) insured = api.insured();
      return insured ? c.collateralOn : c.collateralOff;
    },

    /** 기준 한도(만 원)를 선택 농장 · 보험 여부에 맞게 환산 (100만 원 단위) */
    limit: function (base) {
      var scaled = base * (api.collateral() / BASE_COLLATERAL);
      return Math.round(scaled / 100) * 100;
    },

    /** 화면 문구용 값 모음 */
    values: function () {
      var f = api.get();
      var c = api.calc(f);
      var insured = api.insured();
      var money = function (man, exact) { return exact ? wonExact(exact) : "약 " + won(man); };
      return {
        name: f.name,
        total: String(f.total),
        steer: String(f.steer),
        male: String(f.male),
        female: String(f.female),
        nonTarget: String(f.total - f.steer),
        asset: money(c.asset, c.assetWon),
        collateral: money(api.collateral(), insured ? c.collateralOnWon : c.collateralOffWon),
        collateralOn: money(c.collateralOn, c.collateralOnWon),
        collateralOff: money(c.collateralOff, c.collateralOffWon),
        applyLimit: "최대 " + won(api.limit(3000))
      };
    },

    /** data-f / data-f-width 요소에 값 채우기 */
    bind: function (root) {
      var v = api.values();
      var f = api.get();
      (root || document).querySelectorAll("[data-f]").forEach(function (el) {
        var k = el.getAttribute("data-f");
        if (v[k] !== undefined) el.textContent = v[k];
      });
      (root || document).querySelectorAll("[data-f-width]").forEach(function (el) {
        el.style.width = (f.steer / f.total * 100).toFixed(2) + "%";
      });
    }
  };

  /** 하단 탭 CHAM-Fi 의 주황 점 — 신청 진행 중일 때만 표시 */
  api.syncTabDot = function () {
    var show = !!api.applied();
    document.querySelectorAll(".cf-tab__new").forEach(function (el) {
      el.style.display = show ? "" : "none";
    });
  };

  window.cfFarm = api;
  api.bind(document);
  document.addEventListener("DOMContentLoaded", function () { api.syncTabDot(); });
  api.syncTabDot();
})();
