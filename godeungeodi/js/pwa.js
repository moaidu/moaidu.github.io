'use strict';
/* 홈 화면에 추가(웹앱 설치) 도우미 + 서비스워커 등록 */
let pwaEvt = null;
if (typeof window.addEventListener === 'function') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pwaEvt = e; });
  window.addEventListener('appinstalled', () => { pwaEvt = null; });
}
function pwaStandalone() {
  try { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; } catch (e) { return false; }
}
function pwaInstallHtml() {
  if (pwaStandalone()) return '';
  return '<button class="install" data-act="install"><img src="브랜드/로고/svg/godeungeodi-app-icon.svg" alt="" width="20" height="20">앱 설치하기</button>';
}
function pwaInstall() {
  if (pwaEvt) { pwaEvt.prompt(); pwaEvt.userChoice.finally(() => { pwaEvt = null; }); return; }
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) alert('아이폰·아이패드(사파리): 아래쪽 공유 버튼(네모에 화살표)을 누르고 "홈 화면에 추가"를 선택하세요.');
  else if (/android/i.test(ua)) alert('안드로이드(크롬): 오른쪽 위 ⋮ 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택하세요.');
  else alert('주소창 오른쪽의 설치 아이콘이나 브라우저 메뉴의 "앱 설치"를 눌러 주세요.');
}
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof location !== 'undefined' && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
