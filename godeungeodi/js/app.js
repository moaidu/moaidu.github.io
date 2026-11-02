// 앱 시작점: 주소(#/...)에 따라 화면을 그리고, 누르기를 처리해요. 폰의 뒤로 가기도 주소 덕분에 저절로 돼요.
const app = document.getElementById('app');
let peekArea = null; // 시·군·구 지도에서 눌러 본 지역(아직 선택 전)
let sheetKey = null; // 시·군 고르는 창이 열린 지역

function currentRoute() { return (location.hash || '#/').slice(1) || '/'; }

function render(keepScroll) {
  const prev = document.getElementById('scroll');
  const top = keepScroll && prev ? prev.scrollTop : 0;
  const route = currentRoute();
  let html;
  if (route === '/map') html = screens.homePick();
  else if (route.startsWith('/school/')) html = screens.school(route.slice(8));
  else if (route.startsWith('/pick/')) html = screens.pick(route.slice(6), peekArea);
  else if (route.startsWith('/q/')) html = screens.question(route.slice(3));
  else if (route === '/schools') html = screens.schools();
  else if (route === '/mine') html = screens.mine();
  else if (route === '/home') html = screens.home();
  else html = screens.faq();
  const onMap = route === '/map' || (route === '/home' && !store.region); // 첫 화면(지도)은 자체 윗줄이 있어서 따로 안 붙여요
  app.innerHTML = `${onMap ? '' : ui.header()}<main class="scroll" id="scroll">${html}</main>${ui.nav(route)}${sheetKey ? ui.sigunSheet(sheetKey) : ''}`;
  document.getElementById('scroll').scrollTop = top;
}

// 돌아가기: 앱 안에서 직전에 보던 화면으로 가요. 직전 화면이 없으면(카톡 링크로 바로 들어온 경우 등) 위쪽 화면으로 가요.
// 폰의 뒤로 가기와 달리 앱이 닫히지 않아요.
let navStack = [];      // 앱 안에서 거쳐 온 화면들
let curRoute = '';      // 지금 화면
let goingBack = false;  // 돌아가기로 움직이는 중
function parentRoute(route) {
  if (route.startsWith('/q/')) return '#/';
  if (route.startsWith('/school/')) return '#/q/kinds';
  return '#/map';
}

// 잠깐 떴다 사라지는 안내
let toastTimer = null;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; app.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

const actions = {
  back() {
    const prev = navStack.pop();
    const target = prev ? '#' + prev : parentRoute(currentRoute());
    if (target === '#' + currentRoute()) { render(); return; }
    goingBack = true;
    location.hash = target;
  },
  region(el) {
    const key = el.dataset.key;
    if (SUBMAP[key]) peekArea = null, location.hash = '#/pick/' + key; // 시·군·구 지도에서 고르기
    else if (REGIONS[key].sigun) { sheetKey = key; render(); } else { store.setRegion(key); finishPick(); }
  },
  sigun(el) { store.setRegion(el.dataset.key, el.dataset.sigun); sheetKey = null; finishPick(); },
  install() { pwaInstall(); },
  peek(el) { peekArea = el.dataset.sigun; render(true); },
  // 후보 학교 담기/빼기 (학교 정보 화면의 책갈피 버튼)
  cand(el) {
    const added = store.toggleCand({ r: el.dataset.r, n: el.dataset.n, t: el.dataset.t, s: el.dataset.s });
    render(true);
    toast(added ? '내 후보에 담았어요' : '내 후보에서 뺐어요');
  },
  candrm(el) { store.toggleCand({ r: el.dataset.r, n: el.dataset.n }); render(true); },
  // 지역 화면: 학교 종류 타일을 누르면 그 종류의 학교 목록이 펼쳐져요(다시 누르면 접혀요)
  rtile(el) { regionTile = regionTile === el.dataset.id ? null : el.dataset.id; render(true); },
  semtab(el) { scoreSem = el.dataset.m; render(true); },
  closesheet() { sheetKey = null; render(); },
  // 다시 고르기: 지금 지역의 시·군·구 지도로 가요(새로 고를 때까지 지금 지역은 그대로 둬요)
  repick() {
    const r = store.region, area = r && r.area;
    if (area && SUBMAP[area]) { peekArea = null; location.hash = '#/pick/' + area; } // 그 시·도의 시·군·구 지도로
    else if (area && REGIONS[area].sigun) { sheetKey = area; render(); } // 지도 그림이 없는 시·도는 고르는 창으로
    else location.hash = '#/map';
  },
};
// 지역을 고르면 홈으로. 지나온 화면(지도 → 시·군 지도 → 홈)을 그대로 기록에 남겨서, 돌아가기를 누르면 바로 전 화면으로 가요
function finishPick() { if (currentRoute() === '/home') render(); else location.hash = '#/home'; }

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && actions[el.dataset.act]) { e.preventDefault(); actions[el.dataset.act](el); }
});
window.addEventListener('hashchange', () => {
  const r = currentRoute();
  if (goingBack) goingBack = false;
  else if (curRoute && r !== curRoute) navStack.push(curRoute);
  curRoute = r;
  peekArea = null; regionTile = null; render();
});
// 앱을 열면 항상 메인(지도) 화면에서 시작해요. 주소를 '#/map' 으로 둬서 홈 '#/' 과 구분해야 뒤로 가기가 헷갈리지 않아요
if (currentRoute() === '/') history.replaceState(null, '', '#/map');
curRoute = currentRoute();
render();

// 내 성적 입력은 입력하는 대로 저장(화면을 다시 그리지 않아요)
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.score) store.setScore(t.dataset.score, t.value);
  if (t.dataset.etc) { store.setEtc(t.dataset.etc, t.value); const res = document.getElementById('gg-res'); if (res) res.innerHTML = ggResult(); }
  if (t.dataset.sc) { // 원점수: 성취도는 자동으로 따라가요
    const [m, subj] = t.dataset.sc.split('|');
    store.setSub(m, subj, t.value === '' ? undefined : { s: Math.min(100, Math.max(0, Number(t.value))) });
    const sel = document.querySelector('[data-scach="' + t.dataset.sc + '"]'); if (sel) sel.value = scAch(t.value === '' ? '' : Number(t.value));
    const res = document.getElementById('gg-res'); if (res) res.innerHTML = ggResult();
  }
  if (t.dataset.find) { findState[t.dataset.find] = t.value; document.getElementById('fres').innerHTML = findResults(); }
});
document.addEventListener('change', e => {
  if (e.target.dataset && e.target.dataset.find) { findState[e.target.dataset.find] = e.target.value; document.getElementById('fres').innerHTML = findResults(); }
  if (e.target.hasAttribute('data-score-grade')) { store.setGrade(e.target.value); render(true); }
  if (e.target.dataset && e.target.dataset.scach) { // 성취도를 직접 고르면 그 값을 써요
    const [m, subj] = e.target.dataset.scach.split('|'), cur = ((store.score.sem[m] || {})[subj]) || {};
    if (cur.s !== undefined) store.setSub(m, subj, { s: cur.s, a: e.target.value || undefined });
    const res = document.getElementById('gg-res'); if (res) res.innerHTML = ggResult();
  }
  if (e.target.dataset && e.target.dataset.scart) { const [m, subj] = e.target.dataset.scart.split('|'); store.setSub(m, subj, e.target.value); const res = document.getElementById('gg-res'); if (res) res.innerHTML = ggResult(); }
});

// 지도를 한 번이라도 만지면(터치·클릭) 안내 손가락과 말풍선은 더 이상 안 보여요
document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.mapwrap')) document.body.classList.add('nohint'); });
