/* CHAM-Fi mockup · shared helpers */
(function () {
  "use strict";

  /** 430px보다 좁은 화면에서는 프레임을 화면 너비에 맞춰 축소 */
  function cfFit() {
    var s = Math.min(1, window.innerWidth / 430);
    document.documentElement.style.setProperty("--fit", s.toFixed(4));
  }
  cfFit();
  window.addEventListener("resize", cfFit);

  /** [data-href] 요소를 클릭하면 해당 화면으로 이동 */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-href]");
    if (!el || el.classList.contains("is-disabled")) return;
    var href = el.getAttribute("data-href");
    if (el.hasAttribute("data-cf-entry") && window.cfFarm) href = cfFarm.entry();
    if (href) {
      e.preventDefault();
      window.location.href = href;
    }
  });

  /** 프로토타입에 연결되지 않은 요소 안내용 토스트 */
  var toastEl;
  var toastTimer;
  window.cfToast = function (message) {
    var phone = document.querySelector(".phone");
    if (!phone) return;
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "cf-toast";
      phone.appendChild(toastEl);
    }
    toastEl.textContent = message || "프로토타입에 연결되지 않은 화면이에요";
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-show");
    }, 1800);
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-toast]");
    if (!el) return;
    e.preventDefault();
    window.cfToast(el.getAttribute("data-toast") || undefined);
  });

  /** 체크박스 on/off 이미지 쌍 마크업 */
  window.cfCheckHTML = function (on) {
    return (
      '<span class="cf-check' + (on ? " is-on" : "") + '">' +
      '<img class="off" src="assets/checkbox-off.svg" alt="" />' +
      '<img class="on" src="assets/checkbox-on.svg" alt="" />' +
      "</span>"
    );
  };

  /** 확인 팝업 열기 / 닫기 */
  window.cfOverlay = function (id, open) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle("is-open", open);
  };

  /* -----------------------------------------------------------------------
   * 시연 설정 (헤더 알림 종 .cf-bell · [data-cf-demo] 를 누르면 열리는 바텀시트)
   *
   * - 농장과 보고 싶은 상태를 고른 뒤 [시연 시작]을 누르면 그 상태를 저장하고 해당 화면으로 이동
   * - 상태는 기존 auth.js · farm.js 의 sessionStorage 키로 세팅 (별도 저장소 없음)
   * - 시트에서 고른 값 자체는 저장하지 않음 (열 때마다 현재 농장 · 선택 없음으로 시작)
   *
   * 시나리오 필드: href = 이동할 화면 / assessed = 자산평가(소 조회) 완료
   *               finance = 금융사 조회 완료 / applied = 신청 접수 / stage = 신청 현황 단계(2~4)
   *               result = 심사 결과 ("no" 진행이 어려움, 기본 "ok")
   * ----------------------------------------------------------------------- */
  var DEMO_GROUPS = [
    { title: "처음 · 진행 화면", items: [
      { key: "start", label: "처음부터", desc: "비로그인 쇼핑몰 홈", href: "index.html" },
      { key: "farm", label: "농장 선택부터", desc: "로그인된 첫 진입", href: "farm-select.html" },
      { key: "cattle", label: "소 조회 로딩", desc: "조회가 끝나면 확인 화면으로 넘어감", href: "cattle-loading.html" },
      { key: "confirm", label: "확인 · 정보 제공 동의", desc: "소 조회를 마친 상태", href: "provide-consent.html", assessed: true },
      { key: "banks", label: "금융사 조회 로딩", desc: "조회가 끝나면 결과 화면으로 넘어감", href: "finance-loading.html", assessed: true },
      { key: "offers", label: "조회 결과 · 상품 선택", desc: "상품 3개", href: "result.html", assessed: true, finance: true },
      { key: "done", label: "신청 완료", desc: "참참축협에 신청을 보낸 직후", href: "apply-complete.html", assessed: true, finance: true, applied: true, stage: 2 }
    ] },
    { title: "CHAM-Fi 홈 상태", items: [
      { key: "home-pre", label: "홈 · 신청 전", desc: "소 조회만 하고 나간 상태", href: "edge-home-before.html", assessed: true },
      { key: "home-resume", label: "홈 · 이어서 신청", desc: "상품 조회 결과가 남아 있는 상태", href: "edge-home-resume.html", assessed: true, finance: true },
      { key: "home-applied", label: "홈 · 신청 접수", desc: "신청 현황 2단계", href: "home.html", assessed: true, finance: true, applied: true, stage: 2 },
      { key: "home-review", label: "홈 · 심사 중", desc: "신청 현황 3단계", href: "edge-home-reviewing.html", assessed: true, finance: true, applied: true, stage: 3 },
      { key: "home-result", label: "홈 · 결과 안내", desc: "신청 현황 4단계", href: "edge-home-result.html", assessed: true, finance: true, applied: true, stage: 4 }
    ] },
    { title: "심사 결과", items: [
      { key: "result-ok", label: "심사 결과 · 진행 가능", desc: "금융사 통지 내용", href: "apply-detail.html", assessed: true, finance: true, applied: true, stage: 4 },
      { key: "result-no", label: "심사 결과 · 진행이 어려움", desc: "금융사 통지 내용", href: "edge-apply-stalled.html", assessed: true, finance: true, applied: true, stage: 4, result: "no" }
    ] },
    { title: "오류 · 빈 상태", items: [
      { key: "cattle-fail", label: "이력제 조회 실패", desc: "소 조회 중 실패", href: "edge-loading-failed.html" },
      { key: "cattle-zero", label: "등록 개체 없음 (0두)", desc: "소 조회 결과 0두", href: "edge-loading-zero.html" },
      { key: "cattle-none", label: "산정 대상 없음", desc: "거세우 0두", href: "edge-no-target.html" },
      { key: "bank-fail", label: "금융사 조회 실패", desc: "금융사 조회 중 실패", href: "edge-finance-failed.html", assessed: true },
      { key: "bank-none", label: "조회 결과 없음", desc: "상품 0건", href: "edge-result-empty.html", assessed: true }
    ] }
  ];

  function demoFind(key) {
    for (var g = 0; g < DEMO_GROUPS.length; g++) {
      for (var i = 0; i < DEMO_GROUPS[g].items.length; i++) {
        if (DEMO_GROUPS[g].items[i].key === key) return DEMO_GROUPS[g].items[i];
      }
    }
    return null;
  }

  /** 시나리오 상태를 저장하고 이동할 화면을 돌려줌 */
  function demoApply(sc, farmName) {
    var A = window.cfAuth;
    var F = window.cfFarm;
    if (F) {
      F.set(farmName);
      F.setInsured(true);
      F.clearAssessed();   // 자산평가 · 금융사 조회 완료 함께 초기화
      F.clearApplied();
      if (sc.assessed) F.setAssessed(farmName);
      if (sc.finance) F.setFinanceChecked(farmName);
      if (sc.applied) { F.setApplied(farmName); F.setApplyStage(sc.stage || 2); F.setApplyResult(sc.result || "ok"); }
    }
    if (A) {
      if (sc.key === "start") A.logout();
      else A.login();
    }
    return sc.href;
  }

  var demo = null; // { overlay, sheet, farm, pick, lastFocus }

  function demoEsc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function demoBuild() {
    var phone = document.querySelector(".phone");
    if (!phone) return null;
    var F = window.cfFarm;
    var farms = F ? Object.keys(F.FARMS).map(function (k) { return F.FARMS[k]; }) : [];

    var html =
      '<div class="cf-demo__sheet" role="dialog" aria-modal="true" aria-labelledby="cfDemoTitle" aria-describedby="cfDemoNote">' +
      '<div class="cf-demo__grab" aria-hidden="true"></div>' +
      '<div class="cf-demo__head">' +
      '<h2 class="t-title-lg ink" id="cfDemoTitle">시연 설정</h2>' +
      '<button type="button" class="cf-demo__close" data-demo-close aria-label="닫기"><img src="assets/status-close.svg" alt="" /></button>' +
      "</div>" +
      '<p class="t-body-sm ink-muted cf-demo__note" id="cfDemoNote">보고 싶은 상태를 고르고 시연 시작을 누르면 그 화면으로 넘어가요. 금액 · 금융사 · 금리 · 한도는 모두 예시예요.</p>' +
      '<div class="cf-demo__scroll">' +
      '<h3 class="cf-demo__group">농장</h3>' +
      '<div class="cf-demo__seg" role="group" aria-label="농장">' +
      farms.map(function (f) {
        return '<button type="button" data-demo-farm="' + demoEsc(f.name) + '" aria-pressed="false">' + demoEsc(f.name) + " " + f.total + "두</button>";
      }).join("") +
      "</div>" +
      DEMO_GROUPS.map(function (grp) {
        return (
          '<h3 class="cf-demo__group">' + demoEsc(grp.title) + "</h3>" +
          '<div class="cf-demo__opts" role="radiogroup" aria-label="' + demoEsc(grp.title) + '">' +
          grp.items.map(function (it) {
            return (
              '<button type="button" class="cf-demo__opt" role="radio" aria-checked="false" data-demo-pick="' + it.key + '">' +
              '<span class="cf-demo__radio" aria-hidden="true"></span>' +
              '<span class="cf-demo__text"><b>' + demoEsc(it.label) + "</b><span>" + demoEsc(it.desc) + "</span></span>" +
              "</button>"
            );
          }).join("") +
          "</div>"
        );
      }).join("") +
      "</div>" +
      '<button type="button" class="cf-btn cf-btn--primary is-disabled" data-demo-start disabled>시연 시작</button>' +
      "</div>";

    var overlay = document.createElement("div");
    overlay.className = "cf-demo is-closed";
    overlay.innerHTML = html;
    phone.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest("[data-demo-close]")) return demoClose();
      var farmBtn = e.target.closest("[data-demo-farm]");
      if (farmBtn) return demoSetFarm(farmBtn.getAttribute("data-demo-farm"));
      var pickBtn = e.target.closest("[data-demo-pick]");
      if (pickBtn) return demoSetPick(pickBtn.getAttribute("data-demo-pick"));
      if (e.target.closest("[data-demo-start]")) return demoStart();
    });

    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); demoClose(); return; }
      if (e.key !== "Tab") return;
      // 시트 안에서만 포커스가 돌도록
      var items = overlay.querySelectorAll("button:not([disabled])");
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    return { overlay: overlay, farm: null, pick: null, lastFocus: null };
  }

  function demoSetFarm(name) {
    demo.farm = name;
    demo.overlay.querySelectorAll("[data-demo-farm]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-demo-farm") === name));
    });
  }

  function demoSetPick(key) {
    demo.pick = key;
    demo.overlay.querySelectorAll("[data-demo-pick]").forEach(function (b) {
      b.setAttribute("aria-checked", String(b.getAttribute("data-demo-pick") === key));
    });
    var start = demo.overlay.querySelector("[data-demo-start]");
    start.disabled = !key;
    start.classList.toggle("is-disabled", !key);
  }

  function demoOpen(trigger) {
    if (!demo) demo = demoBuild();
    if (!demo) return;
    demo.lastFocus = trigger || document.activeElement;
    demoSetFarm(window.cfFarm ? window.cfFarm.get().name : "부경축공");
    demoSetPick(null);
    demo.overlay.querySelector(".cf-demo__scroll").scrollTop = 0;
    demo.overlay.classList.remove("is-closed");
    demo.overlay.querySelector("[data-demo-close]").focus({ preventScroll: true });
  }

  function demoClose() {
    if (!demo || demo.overlay.classList.contains("is-closed")) return;
    demo.overlay.classList.add("is-closed");
    if (demo.lastFocus && document.contains(demo.lastFocus)) demo.lastFocus.focus({ preventScroll: true });
  }

  function demoStart() {
    var sc = demoFind(demo.pick);
    if (!sc) return;
    var href = demoApply(sc, demo.farm);
    demo.overlay.classList.add("is-closed");
    window.location.href = href;
  }

  document.addEventListener("click", function (e) {
    var bell = e.target.closest(".cf-bell, [data-cf-demo]");
    if (!bell) return;
    e.preventDefault();
    demoOpen(bell);
  });

  window.cfDemo = { open: demoOpen, close: demoClose };
})();
