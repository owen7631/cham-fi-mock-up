/* CHAM-Fi mockup · shared helpers */
(function () {
  "use strict";

  /** [data-href] 요소를 클릭하면 해당 화면으로 이동 */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-href]");
    if (!el || el.classList.contains("is-disabled")) return;
    var href = el.getAttribute("data-href");
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
})();
