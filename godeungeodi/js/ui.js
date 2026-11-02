// 작은 화면 조각들(여러 화면에서 같이 써요)
const ui = {
  // 한국 지도. selKey = 주황으로 칠할 지역, labels = 지역 이름 표시, tap = 누를 수 있게
  map(selKey, labels, tap) {
    const small = { seoul: 1, incheon: 1, daejeon: 1, sejong: 1, gwangju: 1, daegu: 1, ulsan: 1, busan: 1 };
    const R = KOREA_MAP.regions;
    const paths = Object.keys(R).map(id =>
      `<path class="rg${id === selKey ? ' sel' : ''}" ${tap ? `data-act="region" data-key="${id}"` : ''} d="${R[id].d}"/>`).join('');
    const txt = labels ? Object.keys(R).map(id =>
      `<text x="${R[id].cx}" y="${R[id].cy}" font-size="${small[id] ? 8 : 12}">${REGIONS[id].name}</text>`).join('') : '';
    return `<svg class="map" viewBox="0 0 ${KOREA_MAP.w} ${KOREA_MAP.h}" role="img" aria-label="한국 지도">${paths}${txt}</svg>`;
  },
  // 숫자 3칸: 일반고 / 직업계 / 지원할 수 있는 특별한 학교. c = regionCounts(r)
  countBoxes(c) {
    if (!c) return '';
    return `<div class="cnt">${[[c.general, '일반고'], [c.vocational, '특성화·<br>마이스터'], [c.open, '지원 가능한<br>특목·자사·영재']]
      .map(x => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>`;
  },
  // 평준화 상태: 'flat' | 'non' | 'partial' | 'special' | 'unknown'. 시·도 전체가 평준화인 곳(mode all)은 모두 flat
  levelOf(key, name) {
    const L = LEVELING[key];
    if (!L || L.mode === 'unknown') return 'unknown';
    if (L.mode === 'all') return 'flat';
    return L.areas[name] || 'unknown';
  },
  LEVEL_LABEL: { flat: '평준화', non: '비평준화', partial: '일부만 평준화', special: '특수지', unknown: '확인 필요' },
  // 시·군·구 지도: 평준화 상태에 따라 색이 달라요. 누르면 그 지역을 골라요
  subMap(key, sel) {
    const M = SUBMAP[key], n = Object.keys(M.areas).length, fs = key === 'incheon' ? 9 : n > 20 ? 10 : n > 12 ? 12 : 13; // 인천은 구가 작게 모여 있어서 글자를 작게
    const paths = Object.keys(M.areas).map(name => {
      const lv = ui.levelOf(key, name);
      return `<path class="lv lv-${lv}${name === sel ? ' picked' : ''}" data-act="peek" data-key="${key}" data-sigun="${name}" d="${M.areas[name].d}"><title>${name} · ${ui.LEVEL_LABEL[lv]}</title></path>`;
    }).join('');
    const txt = Object.keys(M.areas).map(name => `<text x="${M.areas[name].cx}" y="${M.areas[name].cy}" font-size="${fs}">${name}</text>`).join('');
    const defs = '<defs><pattern id="stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#3F3BD6"/><rect width="4" height="8" fill="#FF6B4A"/></pattern></defs>';
    return `<svg class="submap" viewBox="0 0 ${M.w} ${M.h}" role="img" aria-label="시·군·구 지도">${defs}${paths}${txt}</svg>`;
  },
  // 지도를 누르면 나오는 안내 카드: 그 지역이 평준화인지 알려 주고, 선택 버튼을 보여 줘요
  LEVEL_TEXT: { flat: '교육청이 추첨으로 학교를 배정해요.', non: '학생이 학교에 지원해서 선발돼요.', partial: '읍·면 등 일부 지역만 평준화예요.', special: '평준화와 다른 방식으로 배정해요.', unknown: '이 지역은 아직 확인하지 못했어요.' },
  peekCard(key, name) {
    if (!name) return '<div class="peek empty">👆 지도에서 사는 곳을 눌러 보세요</div>';
    const lv = ui.levelOf(key, name);
    return `<div class="peek"><i class="sw lv-${lv}"></i><div class="pt"><b>${name}</b><span class="lvname lvt-${lv}">${lv === 'unknown' ? '확인 필요' : ui.LEVEL_LABEL[lv] + (lv === 'flat' || lv === 'non' ? ' 지역' : '')}</span><small>${ui.LEVEL_TEXT[lv]}</small></div>
      <button data-act="sigun" data-key="${key}" data-sigun="${name}">여기로 선택</button></div>`;
  },
  // 범례: 이 시·도 지도에 실제로 쓰인 상태만 보여 줘요
  levelLegend(key) {
    const used = new Set(Object.keys(SUBMAP[key].areas).map(name => ui.levelOf(key, name)));
    return `<div class="legend">${['flat', 'non', 'partial', 'special', 'unknown'].filter(k => used.has(k)).map(k =>
      `<span><i class="sw lv-${k}"></i>${ui.LEVEL_LABEL[k]}</span>`).join('')}</div>`;
  },
  // 모든 화면 위쪽에 고정되는 줄: 로고나 "홈"을 누르면 처음(홈)으로 가요
  header() {
    const house = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>';
    return `<header class="gh"><div class="ghl"><a class="ghlogo" href="#/map" aria-label="${CONFIG.name} 처음으로"><img src="브랜드/로고/svg/godeungeodi-horizontal.svg" alt="${CONFIG.name}" height="22"></a>
      <a class="ghhome" href="#/map" aria-label="홈">${house}</a></div>
      <a class="ghback" data-act="back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square" aria-hidden="true"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>돌아가기</a></header>`;
  },
  // 학교 이름을 누르면 학교 정보 화면으로 가요. name 은 나이스 이름이든 줄인 이름이든 돼요
  schoolHref(name, r) { return `#/school/${r}/${encodeURIComponent(name)}`; },
  // 비공식 고지, 출처 목록, 면책 문구: "용어 풀이" 탭이 보여 주는 화면 맨 아래에 작게 넣어요
  legal() {
    return `<section class="legal"><h2>서비스 안내</h2>
      <h3>비공식 고지</h3>
      <p>${CONFIG.name}는 교육부, 시·도교육청, 학교 등 공공기관과 관계없는 <b>민간 서비스</b>예요. 공공기관의 공식 서비스가 아니고, 공공기관이 내용을 확인하거나 보증하지 않아요.</p>
      <h3>자료 출처</h3>
      <ul><li>학교 기본 정보·학과: 교육부 나이스(NEIS) 오픈API (2026-10-19 조회)</li>
        <li>학교 규모·생활 정보: 학교알리미 정보공시 (2026학년도)</li>
        <li>입학 전형·평준화·일정: 고입정보포털(hischool.go.kr)과 시·도교육청이 공고한 2027학년도 고등학교 입학전형 기본계획</li>
        <li>특목·자사·영재 모집 지역: 각 학교의 2027학년도 입학전형요강</li>
        <li>대안교육 특성화고: 경기도교육청 「대안학교 및 대안교육 특성화학교 현황」(2025년 기준)과 학교 소개</li>
        <li>지도: 통계청 행정구역 경계를 단순화해 사용</li></ul>
      <h3>면책 안내</h3>
      <p>① 이 앱은 공개 자료를 바탕으로 정리한 <b>참고용</b>이에요.</p>
      <p>② 지원하기 전에 반드시 해당 시·도교육청의 공고와 학교의 입학전형요강을 <b>직접 확인해 주세요.</b></p>
      <p>③ 입학 전형, 일정, 모집 지역, 학교 정보는 해마다 또는 학교 사정에 따라 바뀔 수 있고, 정리하는 과정에서 틀리거나 오래된 내용이 있을 수 있어요.</p>
      <p>이 앱의 정보만 믿고 내린 결정이나 그 결과에 대해서는 책임지지 않아요.</p>
    </section>`;
  },
  logo() { return `<img class="logo" src="브랜드/로고/svg/godeungeodi-horizontal-white.svg" alt="${CONFIG.name}" width="83" height="32">`; },
  questionRow(q) { return `<a class="q" href="#/q/${q.id}">${q.title}</a>`; },
  adSlot() { return `<div class="ad"><i>광고</i>광고 자리 (질문 화면 맨 아래)</div>`; },
  // 아래 메뉴 아이콘: 로고의 각진 획과 어울리게 모서리를 살린 선 그림
  icon(name, filled) {
    const P = {
      q: '<path d="M4 4h16v12h-9l-5 4v-4H4z"/><path d="M9.5 8.5h5v2.5l-2.5 1.5"/><path d="M12 14.5v.01"/>',
      school: '<path d="M3 10l9-6 9 6"/><path d="M3 10h18"/><path d="M5 10v9M10 10v9M14 10v9M19 10v9"/><path d="M3 20h18"/>',
      mine: '<path d="M6 3h12v18l-6-4-6 4z"/>',
      select: '<path d="M7 4h10v3H7z"/><path d="M5 6h14v15H5z"/><path d="M9 14l2.5 2.5L15.5 12"/>',
      when: '<path d="M4 6h16v14H4z"/><path d="M4 10h16"/><path d="M8 3v4M16 3v4"/>',
    };
    return `<svg class="ni" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square" aria-hidden="true">${P[name]}</svg>`;
  },
  nav(route) {
    return `<nav class="nav">${CONFIG.nav.map(n => {
      const on = n.route === '/' ? route === '/' || route.startsWith('/q/') : route === n.route;
      return `<a href="#${n.route}" class="${on ? 'on' : ''}">${ui.icon(n.icon)}<span>${n.label}</span></a>`;
    }).join('')}</nav>`;
  },
  // 시·군을 고르는 창 (시·군 자료가 있는 지역만)
  sigunSheet(key) {
    const r = REGIONS[key];
    return `<div class="sheet-bg" data-act="closesheet"><div class="sheet" onclick="event.stopPropagation()">
      <h3>${r.name}, 어느 시·군·구인가요?</h3>
      <div class="chips">${r.sigun.map(s => `<button data-act="sigun" data-key="${key}" data-sigun="${s}">${s}</button>`).join('')}
      <button class="ghost" data-act="sigun" data-key="${key}" data-sigun="">${r.name} 전체</button></div></div></div>`;
  },
};
