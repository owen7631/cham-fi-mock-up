/* CHAM-Fi mockup · 로그인 상태 + 접근 제어
 *
 * - 로그인 여부는 이 파일의 상태값으로 관리해요 (sessionStorage 에 보관 · localStorage 는 쓰지 않음)
 * - 화면 이동 · 새로고침(reload)에도 로그인 상태가 유지돼요 (탭을 닫으면 사라짐)
 * - 비로그인 상태로 CHAM-Fi 화면에 들어오면 로그인 화면(shop-login.html)으로 보내고,
 *   로그인하면 처음 접속하려던 경로로 되돌려 보내요
 *
 * 사용법
 *   <head> 에서 chamfi.css 바로 아래에 <script src="js/auth.js"></script> 를 넣으면 접근 제어가 적용돼요
 *   로그인 버튼에는 data-login 속성을 붙이면 돼요  (예: <a data-login>로그인</a>)
 *
 * 목업 편의 기능
 *   - DEFAULT_LOGGED_IN 을 true 로 바꾸면 처음부터 로그인된 상태로 시작해요
 *   - shop-login.html?logout=1 로 들어오면 로그아웃 상태로 되돌려요
 *
 * 로그아웃하면 자산평가 · 금융사 조회 완료 상태도 함께 지워요 (다음 로그인 때 처음부터 조회)
 */
(function () {
  "use strict";

  /** 목업 시작 시점의 로그인 여부 */
  var DEFAULT_LOGGED_IN = false;

  var STORAGE_KEY = "cf-logged-in";
  var LOGIN_PAGE = "shop-login.html";
  var HOME_PAGE = "index.html";
  /** 로그아웃 시 함께 지울 자산평가 · 금융사 조회 상태 (farm.js 와 같은 키) */
  var ASSESSMENT_KEYS = ["chamfi.assessed", "chamfi.financeChecked"];

  /** 로그인 없이 볼 수 있는 화면 (쇼핑몰 홈 · 로그인 · 결제 완료 · 화면 목록) */
  var PUBLIC_PAGES = ["", "index.html", "shop-login.html", "shop-order-complete.html", "screens.html"];

  /* ---- 상태값 ---- */
  var memory = null; // sessionStorage 를 쓸 수 없을 때를 위한 대체 저장소

  function read() {
    try {
      var v = window.sessionStorage.getItem(STORAGE_KEY);
      if (v === "1") return true;
      if (v === "0") return false;
    } catch (e) {
      if (memory !== null) return memory;
    }
    return DEFAULT_LOGGED_IN;
  }

  function write(value) {
    memory = value;
    try { window.sessionStorage.setItem(STORAGE_KEY, value ? "1" : "0"); } catch (e) { /* 메모리 값만 사용 */ }
  }

  function clearAssessment() {
    ASSESSMENT_KEYS.forEach(function (k) {
      try { window.sessionStorage.removeItem(k); } catch (e) { /* 저장소 사용 불가 */ }
    });
  }

  function logout() {
    write(false);
    clearAssessment();
  }

  /* ---- 경로 ---- */
  function currentPage() {
    return decodeURIComponent(window.location.pathname.split("/").pop() || "");
  }

  /** 현재 화면의 상대 경로 (파일명 + 쿼리 + 해시) */
  function currentPath() {
    return currentPage() + window.location.search + window.location.hash;
  }

  /** 같은 폴더의 .html 화면만 허용 (외부 주소 · 상위 경로로 보내지 않기) */
  function safeReturnTo(path) {
    if (!path || !/^[A-Za-z0-9_\-]+\.html(\?[^#]*)?(#.*)?$/.test(path)) return HOME_PAGE;
    if (path.indexOf(LOGIN_PAGE) === 0) return HOME_PAGE;
    return path;
  }

  function queryParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  var auth = {
    isLoggedIn: read,

    login: function () { write(true); },
    logout: logout,

    /** 로그인 화면 주소 (로그인 후 돌아올 경로를 함께 전달) */
    loginUrl: function (returnTo) {
      return LOGIN_PAGE + "?returnTo=" + encodeURIComponent(returnTo || currentPath());
    },

    /** 로그인 후 돌아갈 경로 (없으면 쇼핑몰 홈) */
    returnTo: function () { return safeReturnTo(queryParam("returnTo")); },

    /** 로그인 처리 후 접속했던 경로로 이동 */
    loginAndReturn: function () {
      write(true);
      window.location.href = auth.returnTo();
    }
  };
  window.cfAuth = auth;

  var inFrame = window.self !== window.top; // 화면 목록(screens.html)의 미리보기 안에서는 이동하지 않음
  var page = currentPage();

  /* ---- 로그인 화면: ?logout=1 이면 로그아웃 상태로 되돌리기 ---- */
  if (page === LOGIN_PAGE && queryParam("logout") === "1") logout();

  /* ---- 접근 제어: 비로그인으로 CHAM-Fi 화면에 들어오면 로그인 화면으로 ---- */
  if (!inFrame && PUBLIC_PAGES.indexOf(page) === -1 && !read()) {
    window.location.replace(auth.loginUrl(currentPath()));
  }

  /* ---- [data-login] 요소를 누르면 로그인 → 접속했던 경로로 이동 ---- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-login]");
    if (!el) return;
    e.preventDefault();
    auth.loginAndReturn();
  });
})();
