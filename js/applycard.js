/* CHAM-Fi mockup · 신청 현황 카드 (M-09) — 클릭할 때마다 다음 단계로
 *
 * - 단계는 cfFarm 의 sessionStorage(chamfi.applyStage)에 저장되어 화면 이동 · 새로고침에도 유지됨
 * - data-stage        : 저장값이 없을 때의 단계
 * - data-stage-fixed  : 저장값과 상관없이 data-stage 로 보여 주는 시안 화면.
 *                       진입하면 보여 주는 상태(신청 · 단계)를 저장해 다른 화면과 맞춤
 * - 카드는 신청 상태를 새로 만들지 않음 (신청은 조회 결과의 [이 상품으로 신청하기]에서 기록)
 * - 제목은 신청한 농장, 문구는 신청한 금융사 · 4단계 [결과 확인하기]는 심사 결과에 맞는 화면으로 이동
 * - 깜빡임 방지를 위해 <head> 에서 불러오고, 카드 마크업 뒤에서 cfApplyCard.init() 으로 바로 그린다
 *   (부르지 않아도 DOMContentLoaded 때 그려짐)
 */
(function () {
  "use strict";

  var STAGES = {};
  function texts() {
    var v = window.cfFarm ? window.cfFarm.values() : { applyFarm: "부경축공", bankName: "참참축협" };
    STAGES = {
      2: { title: v.applyFarm + " 님, 신청이 접수됐어요", sub: v.bankName + "에서 심사를 준비하고 있어요" },
      3: { title: v.applyFarm + " 님, 심사가 진행 중이에요", sub: v.bankName + "에서 신청 내용을 심사하고 있어요" },
      4: { title: v.applyFarm + " 님, 심사 결과가 나왔어요", sub: v.bankName + "에서 보낸 결과를 확인해 주세요" }
    };
  }
  var LABELS = ["신청 진행", "금융사 접수", "심사", "결과 안내"];

  function build(card) {
    var steps = LABELS.map(function (label, i) {
      return (
        '<div class="ac__step" data-i="' + (i + 1) + '">' +
        '<div class="ac__track">' +
        '<i class="ac__line ac__line--l' + (i === 0 ? " is-hidden" : "") + '"></i>' +
        '<span class="ac__dot"></span>' +
        '<i class="ac__line ac__line--r' + (i === LABELS.length - 1 ? " is-hidden" : "") + '"></i>' +
        "</div>" +
        '<p class="ac__label">' + label + "</p>" +
        "</div>"
      );
    }).join("");

    card.innerHTML =
      '<div class="ac__top">' +
      '<div class="ac__head">' +
      '<p class="t-title-lg ink ac__title"></p>' +
      '<p class="t-body-sm ink-muted ac__sub"></p>' +
      "</div>" +
      '<img class="ac__chev" src="assets/icon-chevron-right-sm.svg" alt="" />' +
      "</div>" +
      '<div class="ac__steps">' + steps + "</div>" +
      '<div class="ac__cta"><div><span class="cf-btn cf-btn--primary">결과 확인하기' +
      '<img src="assets/icon-arrow.svg" alt="" /></span></div></div>';
  }

  /** 단계에 맞춰 점 · 선 · 라벨 상태를 갱신 (animate=true면 새로 현재가 되는 점에 팝 효과) */
  function paint(card, stage, animate) {
    var steps = card.querySelectorAll(".ac__step");
    Array.prototype.forEach.call(steps, function (el, idx) {
      var n = idx + 1;
      var wasCurrent = el.classList.contains("is-current");
      el.classList.toggle("is-done", n < stage);
      el.classList.toggle("is-current", n === stage);
      el.classList.remove("is-pop");
      if (animate && n === stage && !wasCurrent) {
        void el.offsetWidth; // 애니메이션 재시작
        el.classList.add("is-pop");
      }
      var l = el.querySelector(".ac__line--l");
      var r = el.querySelector(".ac__line--r");
      // 지나간 구간은 모두 진한 선, 현재 단계 오른쪽 선만 ink 색(디자인 기준)
      l.classList.toggle("is-on", n <= stage && n > 1);
      r.classList.toggle("is-on", n < stage);
      r.classList.toggle("is-next", n === stage && n < LABELS.length);
    });
    card.setAttribute("data-stage", stage);
    card.setAttribute(
      "aria-label",
      stage < 4 ? STAGES[stage].title + " · 누르면 다음 단계로" : STAGES[stage].title + " · 결과 확인하기"
    );
  }

  function setText(card, stage) {
    card.querySelector(".ac__title").textContent = STAGES[stage].title;
    card.querySelector(".ac__sub").textContent = STAGES[stage].sub;
  }

  function init(card) {
    var F = window.cfFarm;
    var stage = parseInt(card.getAttribute("data-stage"), 10) || 2;
    var fixed = card.hasAttribute("data-stage-fixed");
    if (F && fixed) {
      // 고정 단계 시안: 보여 주는 상태를 저장 (현재 농장의 신청이 아니면 현재 농장으로 신청한 것으로 맞춤 · 다른 농장 신청 단계를 덮어쓰지 않음)
      if (F.applied() !== F.get().name) F.setApplied();
      F.setApplyStage(stage);
      F.syncTabDot();
    } else if (F && F.applyStage()) {
      stage = F.applyStage();
    }
    texts();
    var finalHref = card.getAttribute("data-final-href");
    if (F && F.applyResult() === "no") finalHref = "edge-apply-stalled.html";
    var busy = false;
    card.classList.add("ac");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    build(card);
    setText(card, stage);
    paint(card, stage, false);

    function advance() {
      if (busy) return;
      if (stage >= 4) {
        if (finalHref) window.location.href = finalHref;
        return;
      }
      busy = true;
      stage += 1;
      if (window.cfFarm) window.cfFarm.setApplyStage(stage);
      // 1) 문구를 위로 흐려지게 → 2) 바꿔 넣고 아래에서 올라오게
      card.classList.add("is-swap");
      paint(card, stage, true);
      setTimeout(function () {
        setText(card, stage);
        card.classList.remove("is-swap");
        card.classList.add("is-enter");
        void card.offsetWidth;
        card.classList.remove("is-enter");
      }, 170);
      setTimeout(function () { busy = false; }, 800);
    }

    card.addEventListener("click", advance);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    });
  }

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-applycard]"), function (card) {
      if (!card.classList.contains("ac")) init(card);
    });
  }

  window.cfApplyCard = { init: initAll };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();
})();
