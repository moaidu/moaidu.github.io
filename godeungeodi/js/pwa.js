'use strict';
/* 홈 화면에 추가(웹앱 설치) 도우미 + 서비스워커 등록 */
let pwaEvt = null;
if (typeof window.addEventListener === 'function') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pwaEvt = e; window.__pwaEvt = e; });
  window.addEventListener('appinstalled', () => { pwaEvt = null; window.__pwaEvt = null; });
}
function pwaStandalone() {
  try { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; } catch (e) { return false; }
}
function pwaInstallHtml() {
  if (pwaStandalone()) return '';
  return '<button class="install" data-act="install"><img src="브랜드/로고/svg/godeungeodi-app-icon.svg" alt="" width="20" height="20">앱 설치하기</button>';
}
// 설치 안내 창: 어디서 열었는지(카톡 같은 앱 안, 아이폰, 안드로이드, 컴퓨터)에 맞춰 알려 줘요
function pwaHelp() {
  const ua = navigator.userAgent || '';
  let title, steps;
  if (/KAKAOTALK|NAVER\(|Instagram|FBAN|FBAV|Line\/|DaumApps|; wv\)/i.test(ua)) {
    title = '지금은 앱 안에서 열려 있어서 설치할 수 없어요';
    steps = ['화면 오른쪽 위(또는 아래)의 메뉴(⋮ 또는 ⋯)를 눌러요', '"다른 브라우저로 열기" 또는 "기본 브라우저로 열기"를 눌러요', '크롬(안드로이드)이나 사파리(아이폰)에서 열린 뒤, 다시 "앱 설치하기"를 눌러요'];
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    title = '아이폰에서 설치하는 방법';
    steps = ['사파리로 열었는지 확인해요(크롬이면 사파리로 다시 열어요)', '화면 아래쪽의 공유 버튼(네모에 화살표)을 눌러요', '"홈 화면에 추가"를 누르고 "추가"를 눌러요'];
  } else if (/android/i.test(ua)) {
    title = '안드로이드에서 설치하는 방법';
    steps = ['크롬 오른쪽 위의 ⋮ 메뉴를 눌러요', '"앱 설치" 또는 "홈 화면에 추가"를 눌러요', '메뉴에 안 보이면 페이지를 잠깐 둔 뒤 다시 눌러 보세요. 이미 설치했다면 홈 화면의 "고등어디" 아이콘으로 열어 주세요'];
  } else {
    title = '컴퓨터에서 설치하는 방법';
    steps = ['주소창 오른쪽의 설치 아이콘을 눌러요', '아이콘이 안 보이면 브라우저 메뉴에서 "앱 설치"(또는 "고등어디 설치")를 눌러요'];
  }
  const old = document.getElementById('pwahelp'); if (old) old.remove();
  const el = document.createElement('div'); el.id = 'pwahelp';
  el.innerHTML = '<div class="phbox" role="dialog" aria-label="앱 설치 방법"><h3>' + title + '</h3><ol>' + steps.map(s => '<li>' + s + '</li>').join('') + '</ol><button type="button" data-act="closehelp">알겠어요</button></div>';
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  document.body.appendChild(el);
}
function pwaInstall() {
  const ev = pwaEvt || window.__pwaEvt;
  if (ev) { ev.prompt(); ev.userChoice.finally(() => { pwaEvt = null; window.__pwaEvt = null; }); return; }
  pwaHelp();
}
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof location !== 'undefined' && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
