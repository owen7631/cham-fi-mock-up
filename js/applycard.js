/* CHAM-Fi mockup · 신청 현황 카드 (M-09) — 클릭할 때마다 다음 단계로 */
(function () {
  "use strict";

  var STAGES = {
    2: { title: "부경축공 님, 신청이 접수됐어요", sub: "참참축협에서 심사를 준비하고 있어요" },
    3: { title: "부경축공 님, 심사가 진행 중이에요", sub: "참참축협에서 신청 내용을 심사하고 있어요" },
    4: { title: "부경축공 님, 심사 결과가 나왔어요", sub: "참참축협에서 보낸 결과를 확인해 주세요" }
  };
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
    var stage = parseInt(card.getAttribute("data-stage"), 10) || 2;
    var finalHref = card.getAttribute("data-final-href");
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

  Array.prototype.forEach.call(document.querySelectorAll("[data-applycard]"), init);
})();
