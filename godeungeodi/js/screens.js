// 화면들. 각 함수는 { html, nav } 모양으로 돌려줘요. (route 인자 = 현재 주소)
// 지역 화면: 종류 7가지별 학교 수와 목록. 일반고·특성화고 이름은 학교 자료(처음 열 때 불러와요), 나머지는 모집 지역 자료와 이름 목록에서 와요.
let regionTile = null;
// 학교 소재지: "시·도 + 시·군·구" (예: 경기 부천시 소사구). 학교 자료가 아직 없으면 시·도만.
const locName = (reg, s) => REGIONS[reg].name + (s && !s.startsWith(REGIONS[reg].name) ? ' ' + s : '');
const locOf = (reg, name) => { const x = typeof SCHOOLS !== 'undefined' ? findSchool(reg, name) : null; return locName(reg, x && x[5]); };
function regionTiles(r) {
  const area = r.area, sg = r.sigun, c = COUNTS[area], e = (sg && c.sigun[sg]) || c;
  const where = sg ? sg : REGIONS[area].name;
  const can = p => p.k === 'nation' || p.k === 'special' || p.r === area || (p.k === 'plus' && (p.also || []).includes(area));
  const sp = types => SP_DATA.filter(p => types.includes(p.c) && can(p));
  const chip = (href, name, tag, small) => `<li><a href="${href}">${name}${tag ? `<small class="tg">${tag}</small>` : ''}${small ? `<small>${small}</small>` : ''}</a></li>`;
  const short = n => n.replace('등학교', '').replace('대학교', '대');
  const rows = (type, filter) => {
    if (!ensureSchools()) return '<p class="note">학교 자료를 불러오는 중이에요…</p>';
    const L = SCHOOLS.filter(x => x[0] === area && (!sg || (x[5] || '').startsWith(sg)) && filter(x));
    return L.length ? `<ul class="chips2">${L.map(x => chip(ui.schoolHref(x[1], x[0]), short(x[1]), x[2] === '자공고' ? '자공고' : (ALT_SPECIAL.schools.includes(x[1]) && x[0] === 'gg' ? '대안' : ''), locName(x[0], x[5]))).join('')}</ul>` : '<p class="note">이 지역에는 이 종류 학교가 없어요.</p>';
  };
  // 지원할 수 있는 특목·자사·영재: 갈 수 있는 이유별로 묶어서 이유를 같이 적어요
  const GYE = { 외고: '외국어고', 국제고: '국제고', 과학고: '과학고' };
  const spList = types => () => {
    const L = sp(types);
    if (!L.length) return '<p class="note">지원할 수 있는 학교가 없어요.</p>';
    const my = REGIONS[area].name, groups = [];
    const put = (key, head, reason, p) => { let g = groups.find(x => x.key === key); if (!g) groups.push(g = { key, head, reason, items: [] }); g.items.push(p); };
    L.forEach(p => {
      if (p.r === area) put('own', `${my}에 있는 학교`, `${my}에 있는 학교라서 지원할 수 있어요.`, p);
      else if (p.k === 'nation' || p.k === 'special') put('nation' + p.c, p.c === '영재학교' ? '영재학교 (전국 모집)' : `${p.c} (전국 모집)`, '전국 어디에 살아도 지원할 수 있는 학교예요.', p);
      else if (GYE[p.c]) put('c' + p.c, `다른 시·도의 ${GYE[p.c]}`, `${my}에는 ${GYE[p.c]}가 없어서, 다른 시·도의 ${GYE[p.c]}에 지원할 수 있어요.`, p);
      else put('r' + p.r + p.c, `${REGIONS[p.r].name} ${p.c}`, p.note || '', p);
    });
    const many = types.length > 1;
    return groups.map(g => `<div class="rg"><h4>${g.head} <em>${g.items.length}곳</em></h4>${g.reason ? `<p class="rreason">${g.reason}</p>` : ''}<ul class="chips2">${g.items.map(p => chip(ui.schoolHref(p.n, p.r), short(p.n), many ? (p.c === '영재학교' ? '영재' : p.c) : '', locOf(p.r, p.n))).join('')}</ul></div>`).join('');
  };
  const lst = (arr, tagKey) => () => arr.length ? `<ul class="chips2">${arr.map(x => chip(ui.schoolHref(x.n, x.r), short(x.n), tagKey ? x[tagKey].replace('고', '') : '', x.s || '')).join('')}</ul>` : '<p class="note">이 지역에는 이 종류 학교가 없어요.</p>';
  // 예술·체육고, 마이스터고: 우리 시·도 학교 + 다른 시·도의 "전국 모집"으로 원문에서 확인된 학교(이유를 같이 적어요)
  const my = REGIONS[area].name;
  const art = ART_LIST.filter(x => x.r === area), artO = ART_LIST.filter(x => x.nat && x.r !== area);
  const mei = MEISTER_LIST.filter(x => x.r === area), meiO = MEISTER_LIST.filter(x => x.nat && x.r !== area);
  const ownOther = (own, other, tagKey) => () => {
    const block = (head, reason, arr) => arr.length ? `<div class="rg"><h4>${head} <em>${arr.length}곳</em></h4><p class="rreason">${reason}</p><ul class="chips2">${arr.map(x => chip(ui.schoolHref(x.n, x.r), short(x.n), tagKey ? x[tagKey].replace('고', '') : '', locName(x.r, x.s))).join('')}</ul></div>` : '';
    const html = block(`${my}에 있는 학교`, `${my}에 있는 학교예요.`, own) + block('다른 시·도의 전국 모집 학교', `전국에서 모집한다고 입학전형요강에서 확인한 학교라서, ${my}에 살아도 지원할 수 있어요.`, other);
    return html || '<p class="note">이 지역에는 이 종류 학교가 없어요.</p>';
  };
  // 특성화고: 우리 시·군·구 학교를 먼저, 같은 시·도의 다른 시·군 학교를 이유와 함께
  const vocList = () => {
    if (!ensureSchools()) return '<p class="note">학교 자료를 불러오는 중이에요…</p>';
    const isAlt = x => ALT_SPECIAL.schools.includes(x[1]);
    const inArea = SCHOOLS.filter(x => x[0] === area && x[2] === '특성화고');
    const all = inArea.filter(x => !isAlt(x)), alts = inArea.filter(isAlt);
    const mine = sg ? all.filter(x => (x[5] || '').startsWith(sg)) : [];
    const other = sg ? all.filter(x => !(x[5] || '').startsWith(sg)) : all;
    const ul = L => '<ul class="chips2">' + L.map(x => chip(ui.schoolHref(x[1], x[0]), short(x[1]), '', locName(x[0], x[5]))).join('') + '</ul>';
    const blk = (head, reason, L) => L.length ? '<div class="rg"><h4>' + head + ' <em>' + L.length + '곳</em></h4>' + (reason ? '<p class="rreason">' + reason + '</p>' : '') + ul(L) + '</div>' : '';
    return blk(sg + '에 있는 학교', sg + '에 있는 학교예요.', mine) + blk('대안교육 특성화고', '일반 특성화고와 달리 학교마다 뽑는 방법과 지원 자격이 달라요. 학교 이름을 눌러 확인해 주세요.', alts) + blk(sg ? '같은 ' + my + '의 다른 시·군' : my + '에 있는 학교', my + ' 학생이면 지원할 수 있는 학교예요.', other) || '<p class="note">이 지역에는 이 종류 학교가 없어요.</p>';
  };
  const sum = (o, ks) => ks.reduce((n, k) => n + (o.c[k] || 0), 0);
  return [
    { id: 'gen', title: '일반고', color: 't1', wide: true, count: e.c.gen || 0, scope: `${where} 소재 (자공고 포함)`, list: () => rows('gen', x => ['일반고', '일반고(전환)', '자공고'].includes(x[2])) },
    { id: 'sci', title: '과학고·영재학교', color: 't3', count: sp(['과학고', '영재학교']).length, scope: '지원할 수 있는 학교', list: spList(['과학고', '영재학교']), note: '개교 예정인 부천과학고 등은 "학교 종류" 화면에서 볼 수 있어요.' },
    { id: 'lang', title: '외고·국제고', color: 't3', count: sp(['외고', '국제고']).length, scope: '지원할 수 있는 학교', list: spList(['외고', '국제고']) },
    { id: 'jasa', title: '자사고', color: 't3', count: sp(['자사고']).length, scope: '지원할 수 있는 학교', list: spList(['자사고']) },
    { id: 'art', title: '예술·체육고', color: 't3', count: art.length + artO.length, scope: '전국에서 지원할 수 있는 학교', list: ownOther(art, artO, 't'), note: '확인한 학교는 모두 전국에서 모집해요. 다만 학교에 따라 그 지역 학생을 먼저 뽑거나 다른 지역 학생 비율을 정해 둔 곳이 있어요. 학교 이름을 눌러 확인해 주세요.' },
    { id: 'mei', title: '마이스터고', color: 't4', count: mei.length + meiO.length, scope: '전국에서 지원할 수 있는 학교', list: ownOther(mei, meiO), note: '확인한 학교는 모두 전국에서 모집해요. 다만 학교에 따라 그 지역 학생을 먼저 뽑거나 다른 지역 학생 비율을 정해 둔 곳이 있어요. 학교 이름을 눌러 확인해 주세요.' },
    { id: 'voc', title: '특성화고', color: 't4', count: (c.c.voc || 0) + (c.c.alt || 0), scope: `${REGIONS[area].name} 안 어디서나 (대안교육 특성화고 포함)`, list: vocList, note: '특성화고는 보통 같은 시·도 학생이면 시·군·구에 상관없이 지원할 수 있어요. 학교마다 다를 수 있으니 학교 이름을 눌러 확인해 주세요.' },
  ];
}
// 지역 화면의 일정 칸: 원서 접수 기간(막대)과 결과 발표일(마름모)을 한눈에, 아래에 날짜를 자세히. 오늘 선을 같이 보여 줘요.
function regionSchedule(r) {
  const S = REGION_SCHEDULE[r.area];
  if (!S) return '<div class="rsoon">이 지역의 원서 날짜는 준비 중이에요. 시·도교육청 공고로 확인해 주세요.</div>';
  const lv = ui.levelOf(r.area, r.sigun);          // 평준화(flat) / 비평준화(non) 에 따라 일반고 줄이 달라요
  const rows = S.rows.filter(x => !x.only || (lv !== 'flat' && lv !== 'non') || x.only === lv);
  const D = s => new Date(s + 'T00:00:00'), t0 = D(S.from), tot = (D(S.to) - t0) / 86400000;
  const pos = s => (D(s) - t0) / 86400000 / tot * 100;
  const months = []; for (let d = new Date(t0); d < D(S.to); d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(new Date(d));
  const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const nowPct = now >= t0 && now < D(S.to) ? (now - t0) / 86400000 / tot * 100 : null;
  const head = months.map(m => `<i class="sm" style="left:${Math.max(pos(key(m)), 0)}%">${m.getMonth() + 1}월</i>`).join('');
  const vl = months.map(m => `<i class="svl" style="left:${Math.max(pos(key(m)), 0)}%"></i>`).join('');
  const bars = rows.map(x => `<div class="sr"><span class="sl">${x.label}</span><div class="st">${vl}${x.ranges.map(([a, b]) => `<i class="sbar" style="left:${pos(a)}%;width:${Math.max(pos(b) - pos(a) + 0.6, 1.6)}%"></i>`).join('')}${x.marks.map(([d, n]) => `<i class="sdot" style="left:${pos(d)}%" title="${n}"></i>`).join('')}${nowPct === null ? '' : `<i class="stoday" style="left:${nowPct}%"></i>`}</div></div>`).join('');
  const list = rows.map(x => `<div class="sli"><b>${x.label}</b><span>${x.text}</span></div>`).join('');
  return `<div class="sg"><div class="sh"><span class="sl"></span><div class="smw">${head}</div></div>${bars}
    <p class="slg"><i class="a"></i>원서 접수 <i class="b"></i>결과 발표${nowPct === null ? '' : ` <i class="c"></i>오늘(${now.getMonth() + 1}/${now.getDate()})`}</p></div>
    <div class="slist">${list}</div>
    <p class="note rsrc">출처: ${S.src}. 학교마다 달라질 수 있으니 지원 전에 공고로 꼭 확인해 주세요.</p>`;
}
// 지역 화면: 고른 종류의 학교들을 표 한 장으로 비교해요(자료는 학교 정보와 같은 학교알리미 공시). 학교 이름 칸은 왼쪽에 고정돼요.
function regionCompare(tile, r) {
  if (!ensureSchools()) return '';
  const area = r.area, sg = r.sigun, id = tile.id;
  const can = p => p.k === 'nation' || p.k === 'special' || p.r === area || (p.k === 'plus' && (p.also || []).includes(area));
  const rowOf = (reg, name) => findSchool(reg, name);
  const ents = [];
  const add = (row, extra) => { if (row) ents.push(Object.assign({ row }, extra || {})); };
  const rangeOf = p => (p.k === 'nation' || p.k === 'special') ? '전국' : p.r === area ? (p.k === 'own' ? REGIONS[area].name + '만' : REGIONS[area].name + ' + 다른 시·도 일부') : REGIONS[area].name + ' 학생 지원 가능';
  if (id === 'gen') SCHOOLS.filter(x => x[0] === area && (!sg || (x[5] || '').startsWith(sg)) && ['일반고', '일반고(전환)', '자공고'].includes(x[2])).forEach(x => add(x));
  else if (id === 'voc') SCHOOLS.filter(x => x[0] === area && x[2] === '특성화고').forEach(x => add(x, { grp: ALT_SPECIAL.schools.includes(x[1]) ? 1 : sg && (x[5] || '').startsWith(sg) ? 0 : 2 }));
  else if (id === 'sci' || id === 'lang' || id === 'jasa') {
    const types = { sci: ['과학고', '영재학교'], lang: ['외고', '국제고'], jasa: ['자사고'] }[id];
    SP_DATA.filter(p => types.includes(p.c) && can(p)).forEach(p => add(rowOf(p.r, p.n), { range: rangeOf(p) }));
  } else if (id === 'art') ART_LIST.forEach(x => add(rowOf(x.r, x.n), { range: '전국', kind: x.t.replace('고', ''), cond: !!(NATIONAL_RECRUIT[x.n] && NATIONAL_RECRUIT[x.n].note) }));
  else if (id === 'mei') MEISTER_LIST.forEach(x => add(rowOf(x.r, x.n), { range: '전국', kind: MEISTER_FIELDS[x.f].title, cond: !!(NATIONAL_RECRUIT[x.n] && NATIONAL_RECRUIT[x.n].note) }));
  if (!ents.length) return '';
  const SEX = { 공: '남녀공학', 남: '남', 여: '여' };
  const num = v => (v === undefined || v === null ? '-' : Number(v).toLocaleString('ko-KR'));
  const short = n => n.replace('등학교', '').replace('대학교', '대');
  const data = ents.map(e => { const x = e.row, I = x[11] || {};
    const vf = id === 'voc' ? VOC_LIST.find(v => v.n === x[1]) : null;
    return Object.assign({ href: ui.schoolHref(x[1], x[0]), name: short(x[1]), sido: locName(x[0], x[5]), sigun: locName(x[0], x[5]), f: x[3], x: SEX[x[4]] || '', st: I.n, cl: I.c, avg: I.n && I.c ? I.n / I.c : null, tr: I.r, dm: I.dm > 0,
      field: vf ? (x[8] || []).length ? VOC_FIELDS[vf.f].title : '-' : '', majors: (x[8] || []).slice(0, 3).join('·') + ((x[8] || []).length > 3 ? ' 외 ' + ((x[8] || []).length - 3) : '') }, e); });
  data.sort((a, b) => ((a.grp || 0) - (b.grp || 0)) || (b.st || 0) - (a.st || 0));
  const max = Math.max(1, ...data.map(d => d.st || 0));
  const stu = d => `<td class="n">${d.st ? `<span class="bar" style="width:${d.st / max * 100}%"></span>` : ''}<b>${num(d.st)}</b></td>`;
  const COLS = {
    gen: [['설립', d => d.f], ['성별', d => d.x], ['학생 수', stu], ['학급', d => num(d.cl)], ['학급당', d => d.avg ? d.avg.toFixed(1) : '-'], ['교원1인당', d => d.tr || '-'], ['기숙사', d => d.st ? (d.dm ? '있음' : '없음') : '-']],
    voc: [['분야', d => d.field], ['설립', d => d.f], ['성별', d => d.x], ['학생 수', stu], ['학급', d => num(d.cl)], ['기숙사', d => d.st ? (d.dm ? '있음' : '없음') : '-'], ['학과', d => d.majors || '-']],
    sp: [['소재', d => d.sido], ['지원 지역', d => d.range], ['설립', d => d.f], ['성별', d => d.x], ['학생 수', stu], ['학급', d => num(d.cl)], ['기숙사', d => d.st ? (d.dm ? '있음' : '없음') : '-']],
    nat: [['소재', d => d.sido], ['종류', d => d.kind], ['지원 지역', d => d.range + (d.cond ? ' · 조건 있음' : '')], ['설립', d => d.f], ['학생 수', stu], ['기숙사', d => d.st ? (d.dm ? '있음' : '없음') : '-']],
  };
  const cols = COLS[id === 'sci' || id === 'lang' || id === 'jasa' ? 'sp' : id === 'art' || id === 'mei' ? 'nat' : id];
  const th = cols.map(c => `<th>${c[0]}</th>`).join('');
  const GN = id === 'voc' ? [sg ? sg + '에 있는 학교' : r.area, '대안교육 특성화고', sg ? '같은 ' + REGIONS[area].name + '의 다른 시·군' : '일반 특성화고'] : null;
  let lastG = -1;
  const tr = data.map(d => (GN && d.grp !== lastG && (lastG = d.grp) >= 0 ? `<tr class="grp"><th>${GN[d.grp]}</th><td colspan="${cols.length}"></td></tr>` : '') + `<tr><th><a href="${d.href}">${d.name}</a>${d.sigun && (id === 'gen' || id === 'voc') ? `<small>${d.sigun}</small>` : ''}</th>${cols.map(c => { const v = c[1](d); return typeof v === 'string' && v.startsWith('<td') ? v : `<td>${v}</td>`; }).join('')}</tr>`).join('');
  return `<h2 class="rh">${tile.title} 한눈에 비교 <em class="rhn">${data.length}곳</em></h2>
    <p class="cmphint">옆으로 밀어서 보세요 · 학교 이름은 고정돼요 · 학생 수 많은 순</p>
    <div class="cmp"><table class="${id}"><thead><tr><th>학교</th>${th}</tr></thead><tbody>${tr}</tbody></table></div>
    <p class="note cmpnote">학교알리미 정보공시(2026학년도)와 나이스 자료예요. 숫자는 학교 사정에 따라 바뀔 수 있어요.${id === 'art' || id === 'mei' ? ' "조건 있음"은 지역 학생 비율 등이 정해진 학교예요. 학교 이름을 눌러 확인해 주세요.' : ''}</p>`;
}
const GG_WHY = `<details class="why"><summary aria-label="경기 내신 점수 계산 방식 보기">ⓘ</summary><div class="whybody">
<p>교과 150점 + 출결 20점 + 봉사활동 20점 + 학교활동 10점 = <b>200점</b>이에요.</p>
<h5>교과 150점</h5>
<p><b>일반교과 120점</b>은 학기마다 이렇게 계산해요. 기본점수 + (성취도 점수 합 ÷ 과목 수) × a + (원점수 합 ÷ 과목 수) × b</p>
<ul><li>1학년 2학기: 4 + 성취도 평균 × 0.8 + 원점수 평균 × 0.04 (12점 만점)</li><li>2학년 1·2학기: 8 + 성취도 평균 × 1.6 + 원점수 평균 × 0.08 (학기마다 24점 만점)</li><li>3학년 1·2학기: 10 + 성취도 평균 × 2 + 원점수 평균 × 0.1 (학기마다 30점 만점)</li></ul>
<p>성취도 점수는 A 5점, B 4점, C 3점, D 2점, E 1점이에요. 소수 넷째 자리에서 반올림해요. 원점수가 없는 일반교과는 계산에서 빠져요.</p>
<p><b>체육·예술 30점</b>은 전 학년을 한꺼번에 계산해요. 10 + 20 × (3 × A 수 + 2 × B 수 + C 수) ÷ (3 × 과목 수)</p>
<h5>출결 20점</h5><p>미인정 결석 일수에 따라 정해요(미인정 지각·조퇴·결과 3회는 결석 1일). 0일이면 만점이고 1일 90%, 2일 80%, 3일 70%, 4일 60%, 5일 50%, 6일 이상 40%예요. 1학년은 6점, 2·3학년은 7점 만점이에요.</p>
<h5>봉사활동 20점</h5><p>1·2·3학년 3년 동안 15시간 이상이면 20점이에요. 시간이 1시간 줄 때마다 1점씩 줄고, 7시간 이하는 12점이에요.</p>
<h5>학교활동 10점</h5><p>기본 8점에 교내 수상(학기마다 1개, 0.5점)과 학생회 임원 활동(한 달에 0.1점)을 더해요. 더하는 점수는 2점까지예요.</p>
<p class="note">출처: 경기도교육청 2027학년도 경기도 고등학교 입학 내신성적 반영지침(예고안). 학교와 해마다 달라질 수 있어요.</p></div></details>`;
const INTL_WHY = `<details class="why"><summary aria-label="국제고 영어 점수 계산 방식 보기">ⓘ</summary><div class="whybody">
<p>국제고 1단계는 <b>영어 내신 160점</b>과 출결 감점으로 뽑아요. 2학년 1학기, 2학년 2학기, 3학년 1학기, 3학년 2학기 4개 학기를 학기마다 40점씩 반영해요.</p>
<p>학기마다 성취도 A는 40점, B는 36점, C는 32점, D는 28점, E는 24점이에요. 원점수와 과목 평균은 쓰지 않아요.</p>
<p>출결 감점은 학교마다 달라요. 서울국제고는 미인정 결석 1일에 1점, 부산·세종·대구국제고는 1일에 0.6점(최대 6점), 인천국제고는 0.2점, 고양국제고는 0.5점, 동탄국제고는 0.1점(최대 0.5점)을 빼요. 면접 40점은 2단계에서 따로 더해요.</p>
<p class="note">출처: 각 국제고 2027학년도 입학전형요강(서울·부산·세종·대구·인천·고양·동탄), 경기도교육청 기본계획.</p></div></details>`;
// 내 지역: 내 정리의 점수 계산은 지역마다 방식이 달라서, 계산식을 확인한 지역에서만 보여 줘요
// 경기 말고 지역별 내신 점수 안내(계산식을 확인한 것만 글로). 계산 도구는 경기만 있어요
const NAESIN_NOTE = {
  seoul: '서울의 일반고는 선지원 후추첨으로 배정해요. 교육감이 중학교 성적으로 입학 정원만큼 합격자를 정해요. 지원자가 정원을 넘으면 중학교 성적순으로 정하고, 동점이면 정해 둔 우선순위로 가려요. 서울 고입 성적은 100점이에요. <b>교과 80점</b>은 2·3학년에 이수한 과목 중 최하위 성취도(5단계 평가는 E, 3단계 평가 교과는 C)를 받은 과목의 비율로 정해요(없으면 만점). <b>출결 20점</b>은 전 학년 결석일수 1일마다 0.2점씩 빼요(미인정 지각·조퇴·결과 3회는 결석 1일). 특성화고 일반전형에는 이 점수가 쓰여요. 출처: 서울특별시 2027학년도 고등학교 입학전형 기본계획(붙임 3). 점수 계산 기능은 아직 없어요.',
  busan: '부산의 일반고는 중학교 내신의 <b>개인별 석차백분율</b>(전체 학생 중 내 순위의 비율) 순서로 정원만큼 합격자를 정한 뒤 배정해요. 내신 총점은 <b>300점</b>이에요. <b>교과 240점</b>(기본점수 96점에 성취도 A 5점~E 1점으로 바꾼 점수를 더해요)과 <b>비교과 60점</b>(출결 21점, 자율활동 12점, 동아리활동 12점, 봉사활동 15점)이에요. 기본점수 96점을 뺀 144점을 학년별로 나눠요. 1학년 1학기만 자유학기제인 학교는 1학년 10%·2학년 40%·3학년 50%, 1학년이 모두 자유학기제인 학교는 2학년 40%·3학년 60%예요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 부산광역시 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  incheon: '인천의 중학교 성적 총점은 <b>300점</b>이에요. <b>교과 240점</b>(80%), 출석 21점, 행동발달 9점, 자율·동아리·진로활동 15점, 봉사활동 15점으로 나뉘어요. 교과는 성취도를 A 5점~E 1점으로 바꿔 평균 평점을 내고, 1·2학년 40%, 3학년 60%로 반영해요. 자유학기제를 한 학기의 교과 성적은 반영하지 않아요. 이 점수로 전체 학생 중 <b>개인별 석차</b>를 정해 석차백분율을 만들어요. 석차는 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 일반고(평준화)는 선복수지원 후추첨으로 배정해요. 출처: 인천광역시 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  daegu: '대구의 중학교 내신 총점은 <b>300점</b>이에요. <b>교과 240점</b>(기본점수 96점에 더해, 기본점수를 뺀 144점을 1학년 20%·2학년 30%·3학년 50%로 학기별로 나눠요)과 <b>생활 60점</b>(출결 15점, 봉사활동 15점, 창의적체험활동 15점, 행동특성 15점)이에요. 성취도를 점수로 바꿔 학기별로 더해요. 이 합계로 전 학년 석차를 정해 <b>개인별 석차백분율</b>을 만들어요. 선지원 일반고는 석차백분율 순서로 선발하고(합격점 동점자는 전원 선발), 추첨배정고는 석차백분율 순서로 전체 모집정원만큼 배정 예정자를 정한 뒤 추첨해요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 대구광역시 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  daejeon: '대전의 일반고는 <b>내신 성적 순위</b>로 모집 정원의 100%를 먼저 정한 뒤(외고·국제고·자사고 불합격자도 함께 순위를 매겨요), 학교에 배정해요. 배정은 선복수 지원 후 추첨이에요. 학교 정원의 60%는 희망 순위대로 <b>내신과 관계없이</b>, 40%는 거리(지리)로 배정해요. 내신 총점은 <b>300점</b>이에요. <b>교과 240점</b>(일반교과 186점, 체육·예술교과 54점), 출석 24점, 행동특성 12점, 자율·동아리·진로활동 12점, 봉사활동 12점이에요. 일반교과는 기본점수 6점에 1학년 18점(10%), 2학년 72점(40%), 3학년 90점(50%)을 더해요. 체육·예술교과는 학년마다 18점이에요. 교과는 후기학교(일반고 등)는 3학년 2학기 학기말 성적까지, 특성화고는 3학년 1학기 학기말 성적까지 반영해요. 출처: 대전광역시 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  ulsan: '울산의 후기 일반고는 <b>내신 성적</b>으로 고등학교 수용 인원만큼 먼저 선발한 뒤 추첨으로 배정해요. 배정은 1단계(전체 학군) 20%와 2단계(거주 학군) 40%는 지망 순위대로 추첨하고, 남은 3단계 40%는 통학 여건 등을 고려해 배정해요. 내신 총점은 <b>200점</b>이에요. <b>교과 160점</b>(80%)과 <b>비교과 40점</b>(출석 16점, 봉사활동 8점, 행동발달 8점, 창의적체험활동 8점)이에요. 교과 점수는 160 − 0.96 × <b>학교 석차백분율</b>로 정해요(석차백분율 = 우리 학교 학년 안에서의 내 석차 ÷ 학년 재적수 × 100). 학교 안 석차는 같은 학교 친구들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 교과 학년 비중은 1·2학년(자유학기 제외 3개 학기) 51%, 3학년 49%예요. 출처: 울산광역시 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  gwangju: '광주의 평준화 일반고는 먼저 내신 <b>석차백분율이 낮은(성적이 좋은) 순서</b>로 일반고 총 정원만큼 합격자를 정하고(남녀 구분 없이), 합격자를 <b>추첨</b>으로 배정해요. 선지원 추첨배정(정원의 20%, 2개교 선택)과 후지원 추첨배정(정원의 80%, 출신 중학교를 기준으로 정한 "배정가능고교" 중에서 선택)으로 나뉘어요. 이때 <b>성적 등급</b>을 함께 고려해요. 합격자의 내신 석차백분율을 남녀로 나누어 3등급으로 정하고(8% 이하 1등급, 8% 초과~80% 이하 2등급, 80% 초과 3등급), 학교마다 등급별 배정 인원(8%·72%·20%)을 맞춰 추첨해요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 광주광역시(전남광주통합특별시) 2027학년도 고등학교 신입생 전형요강. 점수 계산 기능은 아직 없어요.',
  sejong: '세종의 일반고·자율고는 <b>선 복수지원 후 추첨</b>으로 배정해요. 입학원서에 제1지망부터 제7지망까지 희망 순위대로 써요. 제1지망 지원자가 정원을 넘으면 학교 정원의 70%를 전산 추첨으로, 나머지 30%는 통학권 안에 사는 지원자 중에서 추첨해요. 중학교 내신 총점은 <b>200점</b>이에요. <b>교과 160점</b>(일반교과 120점, 예·체능교과 40점)과 <b>비교과 40점</b>(출결 12점, 봉사활동 12점, 자율·동아리활동 8점, 행동특성·수상경력 8점)이에요. 일반교과는 1·2·3학년을 1:4:5 비율로 반영하고(1학년 12점, 2학년 48점, 3학년 60점), 자유학기 성적은 빼요. 성취도는 A 5점~E 1점으로 바꾸고 원점수도 같이 반영해요. 이 점수로 정한 석차백분율을 내신 성적으로 써요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 세종특별자치시 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  gangwon: '강원의 후기 고등학교는 중학교 내신의 <b>석차백분율</b>(전체 학생 중 내 순위의 비율)로 선발해요. 내신은 교과학습발달상황, 출결, 창의적 체험활동(자율·동아리·스포츠클럽, 봉사)을 종합한 <b>300점 만점</b> 점수로 정해요. <b>평준화 지역(춘천·원주·강릉)</b>은 교육감이 석차백분율로 정원만큼 합격자를 정한 뒤 선 지원 후 추첨으로 배정해요(서로 다른 학교로 1지망 1교, 2지망 1교). <b>비평준화 지역</b>의 일반고는 학교장이 석차백분율 순서로 선발해요. 동점자는 교과성적, 출결성적, 봉사를 뺀 창의적 체험활동 성적, 생년월일이 빠른 순으로 가려요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 강원특별자치도 2027학년도 고등학교 입학전형 기본계획·전형요강. 점수 계산 기능은 아직 없어요.',
  chungbuk: '충북의 일반고·자율형공립고는 학교생활기록부로 정한 <b>내신성적(300점)</b>으로 신입생을 선발해요. <b>평준화 지역</b>(청주시, 충주시, 음성군 맹동면·진천군 덕산읍)은 내신성적으로 총정원만큼 합격자를 정한 뒤(동점자는 전원 합격), 선지원 후추첨으로 학교에 배정해요. 배정할 때는 남녀별 석차백분율을 4개 군으로 나눠요. 1군은 10% 이하, 2군은 10% 초과~50% 이하, 3군은 50% 초과~90% 이하, 4군은 90% 초과이고, 학교마다 정원을 10%·40%·40%·10%로 나눠 군별 인원을 맞춰요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 충청북도 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  chungnam: '충남의 내신성적은 학교생활기록부의 교과 성적과 비교과 성적을 합친 점수의 <b>석차백분율</b>로 정해요. 내신성적 = 50 + 150 × (1 − 석차백분율 ÷ 100)으로 <b>200점 만점</b>이에요. 일반교과는 1·2학년을 학년·학기 구분 없이 통합해서, 3학년은 학기 구분 없이 계산하고, 체육·예술은 전 학년을 통합해요. 학군별 입학전형에서 합격한 학생은 <b>성적과 관계없이 선지원 후추첨</b>으로 학교에 배정해요. 1지망 지원자가 배정 인원을 넘으면 1지망 지원자 중에서 전산 추첨하고, 배정받지 못한 학생은 2지망부터 같은 방법으로 해요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 충청남도 2027학년도 고등학교 입학전형 기본계획(내신성적 산출 방법). 점수 계산 기능은 아직 없어요.',
  jeonbuk: '전북의 <b>평준화 지역</b>(전주시, 군산시·익산시의 동 지역과 군산중앙고)은 내신성적으로 학군별 입학정원만큼 합격자를 정한 뒤, 선지원·후추첨으로 배정해요(국제고·외고·자사고 합격자는 선발 대상에서 빠져요). 추첨은 합격자의 성적을 보지 않고 지망 순위대로 해요. 읍·면 지역은 비평준화로 학교장이 전형해요. 내신은 항목별 <b>300점</b>이에요. <b>교과학습발달상황 240점</b>(80%), <b>출결 30점</b>(10%), <b>봉사활동 15점</b>(5%), <b>행동특성·종합의견·창의적 체험활동 15점</b>(5%)을 합쳐서 같은 학교 안의 석차를 정하고, 그 석차로 <b>석차백분율</b>을 만들어요. 교과 성적은 후기고(일반고 등)는 3학년 2학기 정기시험(1·2차)과 수행평가까지, 전기고는 3학년 2학기 1차고사까지 반영해요. 석차는 같은 학교 친구들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 전북특별자치도 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  jeonnam: '전남의 <b>평준화 지역</b>(목포, 여수, 순천)은 내신 석차백분율 순서로 지역별 전체 입학정원만큼 합격자를 정한 뒤, 선지원·후추첨으로 배정해요. 배정할 때는 합격자를 등급으로 나누고 학교마다 등급별 배정 인원을 맞춰 추첨해요. 동점자는 교과성적, 비교과(출석, 창의적 체험활동, 행동특성) 순으로 가리고, 그래도 같으면 모두 합격이에요. <b>비평준화 지역</b>의 일반고·자율형공립고는 내신 석차 연명부의 개인별 석차백분율로 선발해요. 중학교 내신은 <b>300점</b>이에요. <b>교과 210점</b>(70%), <b>출석 36점</b>(12%), <b>창의적 체험활동 36점</b>(12%), <b>행동특성 18점</b>(6%)이에요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 전라남도 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  gyeongbuk: '경북의 내신 총점은 <b>300점</b>이에요. <b>교과 240점</b>(80%), <b>출석 18점</b>, <b>봉사활동 18점</b>, <b>행동특성 12점</b>, <b>봉사를 뺀 창의적 체험활동 12점</b>이에요. 교과는 학기별로 같은 비율로 반영하고, 학교가 만든 석차연명부(성취도 평균 평점의 총합 순서)로 순위를 정해요. <b>평준화 지역(포항시, 14개교)</b>은 내신성적으로 학군 전체 입학정원만큼 합격자를 정한 뒤 선지원·후추첨으로 배정해요. 추첨은 성적에 관계없이 지망 순위대로 해요. <b>비평준화 지역</b>의 일반고는 내신 300점으로 학교가 전형해요. 동점자는 교과성적, 출석성적, 행동특성성적, 창의적 체험활동(봉사 제외), 봉사활동 순으로 가려요. 석차는 같은 학교 친구들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 경상북도 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  gyeongnam: '경남의 내신성적 총점은 <b>200점</b>이고, 이 점수로 정한 <b>내신 석차백분율</b>을 합격자 사정에 써요. <b>교과 160점</b>(80%)과 <b>비교과 40점</b>(20%)이고, 비교과는 출결 10점씩 3개 학년(30점)과 학교활동 등이에요. 교과는 성적이 있는 학기마다 같은 배점을 줘요. 교과는 3학년 2학기 2차 고사까지 반영해요. <b>평준화 지역</b>의 일반고는 교육감이 석차백분율로 선발하고(남녀 구분 없이 학군별로), 합격자를 학교 정원에 맞춰 등급별 배정 인원을 정해 컴퓨터 무작위 추첨으로 배정해요(평준화 지역 내용은 "안"이고 최종 요강에서 확정돼요). <b>비평준화 지역</b>의 일반고는 학교가 내신성적 석차연명부(석차백분율)로 선발해요. 평준화 지역 안에도 학교장이 직접 전형하는 학교가 11개교 있어요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 경상남도 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
  jeju: '제주의 내신성적은 총점 <b>300점</b>이에요. <b>교과성적 80%</b>(2학년 40%, 3학년 60%)와 <b>비교과성적 20%</b>(출결 6%, 봉사활동 6%, 자율활동 2%, 동아리활동 2%, 학교스포츠클럽 2%, 독서활동 2%)로 나뉘어요. 이 점수로 정한 <b>개인석차백분율</b>로 전형해요. <b>제주시 평준화 일반고</b>는 총정원만큼 남녀 구분 없이 합격자를 정한 뒤, 학교별 입학정원에 맞춘 <b>등급별 배정 인원</b>을 기준으로 지망 순서대로 전산 추첨해서 배정해요. 제주외국어고나 제주 학생이 지원할 수 있는 전국단위 자사고·국제고에 떨어진 학생도 평준화 일반고 선발 기준을 충족하면 일반고 지원자와 같은 방법으로 추첨 배정해요. 석차백분율은 다른 학생들과 비교해서 정해져서 내 점수만으로는 계산할 수 없어요. 출처: 제주특별자치도 2027학년도 고등학교 입학전형 기본계획. 점수 계산 기능은 아직 없어요.',
};
const myArea = () => (store.region && store.region.area) || '';
const INTL_AREAS = ['gg', 'seoul', 'busan', 'sejong', 'daegu', 'incheon'];   // 국제고 영어 점수를 요강으로 확인한 지역
// 국제고 1단계 영어 점수 (내 정리 결과 아래에 이어 붙여요)
function intlResult() {
  if (!INTL_AREAS.includes(myArea())) return '';
  const I = scIntl(store.score.sem);
  if (!I.rows.length) return '';
  const row = r => `<tr><th>${r.m.replace('-', '학년 ')}학기 영어 ${r.g}</th><td>${r.pts}</td><td>/ 40</td></tr>`;
  return `<div class="hrow"><h4 class="sh2">국제고 1단계 영어 점수 <small>160점 만점</small></h4>${INTL_WHY}</div><table class="scr"><tbody>${I.rows.map(row).join('')}<tr class="tot"><th>합계 (입력한 학기만)</th><td>${I.total}</td><td>/ ${I.max}</td></tr></tbody></table>
    <p class="note">영어 성취도를 학기마다 A 40점, B 36점, C 32점, D 28점, E 24점으로 바꿔서 더했어요(2학년 1학기~3학년 2학기). 서울·부산·세종·대구·인천·고양·동탄국제고 요강과 경기도 기본계획 기준이에요. 출결 감점과 면접은 빠져 있고, 학교마다 다를 수 있어요.</p>`;
}
const AS_WHY = `<details class="why"><summary aria-label="안산동산고 점수 계산 방식 보기">ⓘ</summary><div class="whybody">
<p>안산동산고 일반전형·안산우수인재전형의 1단계는 <b>교과 성적 250점</b>(출결 감점 포함)으로 모집인원의 1.5배수를 뽑아요. 중학교 2·3학년 4개 학기를 봐요.</p>
<ul><li>일반교과: 2학년 1학기 50점, 2학년 2학기 50점, 3학년 1학기 65점, 3학년 2학기 65점</li><li>체육·예술교과: 2·3학년 전체 20점</li></ul>
<p>일반교과는 학기마다 성취도를 A 5점, B 4점, C 3점, D 2점, E 1점으로 바꿔 평균을 낸 뒤, 학기 만점에 비율을 곱해요(평균 5점이면 만점). 체육·예술은 A 3점, B 2점, C 1점으로 평균을 내요. 소수 넷째 자리에서 반올림해요.</p>
<p>출결은 미인정 결석 1일마다 0.1점을 빼고 최대 0.5점까지 빼요. 미인정 지각·조퇴·결과 3회는 결석 1일이에요. 2·3학년 출결만 써요.</p>
<p class="note">출처: 안산동산고 2027학년도 신입생 입학전형요항과 학교의 내신성적 산출 프로그램. 2단계(자기소개서·면접 50점)는 빠져 있어요. 해마다 바뀔 수 있어요.</p></div></details>`;
// 안산동산고 1단계 교과 점수 (경기를 고른 사람에게만, 내 정리 결과 아래)
function ansanResult() {
  const A = scAnsan(store.score.sem, store.score.etc);
  if (!A.rows.length && !A.art) return '';
  const row = (name, r) => `<tr><th>${name}</th><td>${r.pts.toFixed(3)}</td><td>/ ${r.max}</td></tr>`;
  const rows = A.rows.map(r => row(r.m.replace('-', '학년 ') + '학기 일반교과', r)).join('') + (A.art ? row('체육·예술', A.art) : '') + (A.att ? `<tr><th>출결 감점 (미인정 결석 ${A.att.days}일)</th><td>${A.att.pts.toFixed(3)}</td><td></td></tr>` : '');
  return `<div class="hrow"><h4 class="sh2">안산동산고 1단계 점수 <small>250점 만점</small></h4>${AS_WHY}</div><table class="scr"><tbody>${rows}<tr class="tot"><th>합계 (입력한 것만)</th><td>${A.total.toFixed(3)}</td><td>/ ${A.max}</td></tr></tbody></table>
    <p class="note">안산동산고 요항과 학교의 내신 산출 프로그램 기준으로, 입력한 학기만 더했어요. 2단계(자기소개서·면접 50점)는 빠져 있어요. 안산동산고는 합격선을 공개하지 않아서 합격 여부는 알 수 없어요.</p>`;
}
// 경기 고입 교과 점수 결과 상자 (내 정리). 입력할 때마다 이 부분만 다시 그려요
let scoreSem = '';
function ggResult() {
  if (myArea() !== 'gg') return intlResult();
  const T = scTotal(store.score.sem, store.score.etc);
  const row = (name, r) => `<tr><th>${name}</th><td>${r.pts.toFixed(3)}</td><td>/ ${r.max}</td></tr>`;
  const rows = SC_SEMS.filter(m => T.sems[m]).map(m => row(m.replace('-', '학년 ') + '학기 일반교과', T.sems[m])).join('') + (T.art ? row('체육·예술', T.art) : '') + T.etc.map(r => row(r.name, r)).join('');
  if (!rows) return '<p class="note">원점수를 넣으면 경기도 기준 내신 점수가 계산돼요.</p>';
  return `<table class="scr"><tbody>${rows}<tr class="tot"><th>합계 (입력한 것만)</th><td>${T.total.toFixed(3)}</td><td>/ ${T.max}</td></tr></tbody></table>
    <p class="note">경기도교육청 2027학년도 내신성적 반영지침에 따라 계산했어요. 입력한 것만 더한 점수예요. 만점은 200점(교과 150점, 출결 20점, 봉사활동 20점, 학교활동 10점)이에요. 실제 점수는 학교와 경기도 입학·전학 포털(SATP) 계산이 기준이에요.</p>${intlResult()}${ansanResult()}`;
}
const screens = {
  // ---- 홈: 지역 고르기(지도) / 맞춤 홈 ----
  // 용어 풀이 탭(예전 이름: 자주하는 질문): 용어 설명과 아래에 서비스 안내를 둬요
  faq() {
    return `<div class="page"><h2 class="qt">용어 풀이</h2><p class="note faqhint">고입에서 자주 나오는 말을 쉬운 말로 풀었어요. 누르면 설명이 나와요.</p><h3 class="tg">뽑는 방법에 나오는 말</h3><details class="more"><summary>전기 학교 · 후기 학교</summary><p>전기 학교는 먼저 뽑는 학교(과학고, 예술·체육고, 마이스터고, 특성화고 등), 후기 학교는 나중에 뽑는 학교(외고·국제고·자사고, 일반고 등)예요. 전기 학교에 합격하면 후기 학교에는 지원할 수 없어요.</p></details><details class="more"><summary>평준화 지역 · 비평준화 지역</summary><p>평준화 지역은 일반고를 지원자 중에서 추첨으로 학교에 배정하는 지역이에요. 지역마다 먼저 내신으로 합격자를 정하고 추첨하는 곳이 많아요. 비평준화 지역은 일반고가 학교마다 직접 학생을 뽑아요.</p></details><details class="more"><summary>선지원 후추첨</summary><p>가고 싶은 학교를 먼저 순서대로(1지망, 2지망…) 적어 내면, 합격자 중에서 컴퓨터가 추첨으로 학교를 배정하는 방식이에요.</p></details><details class="more"><summary>자기주도학습전형</summary><p>외고·국제고·자사고·과학고가 쓰는 전형이에요. 학교생활기록부, 자기소개서, 면접 등으로 뽑아요. 교과 지식을 재는 필기고사는 볼 수 없어요. 학교마다 방법이 달라서 입학전형요강을 꼭 봐야 해요.</p></details><details class="more"><summary>1단계 · 2단계, 1.5배수 · 2배수</summary><p>2단계로 뽑는 학교는 먼저 1단계에서 최종 인원의 1.5배나 2배를 골라요. 그 사람들이 2단계(면접 등)를 본 뒤 최종 합격자가 정해져요.</p></details><details class="more"><summary>동점자 처리</summary><p>점수가 같을 때 누구를 먼저 뽑을지 정한 순서예요. 예를 들어 영어 점수가 같으면 국어, 사회 성적을 비교해요. 학교와 지역마다 달라요.</p></details><details class="more"><summary>정원 내 · 정원 외</summary><p>정원 내는 모집 정원에 들어가는 인원이고, 정원 외는 정원과 별도로 뽑는 인원이에요(국가유공자 자녀, 특례입학 대상자 등).</p></details><details class="more"><summary>사회통합전형</summary><p>저소득층 자녀 등이 지원하는 전형이에요. 외고·국제고·자사고·과학고는 정원의 20% 이상을 이 전형으로 뽑아요.</p></details><details class="more"><summary>지역우수자(지역인재) 전형</summary><p>그 지역 중학교에 다닌 학생을 따로 뽑는 전형이에요. 학교마다 지역과 재학 시점 조건이 달라서 요강으로 확인해야 해요.</p></details><h3 class="tg">성적에 나오는 말</h3><details class="more"><summary>성취평가제 · 성취도(A~E)</summary><p>과목 점수(원점수)를 기준에 따라 A~E 다섯 단계로 나타내는 방식이에요. 보통 90점 이상 A, 80점 이상 B, 70점 이상 C, 60점 이상 D, 60점 미만 E예요. 체육·음악·미술은 A·B·C 세 단계예요. 학교마다 기준이 다를 수 있어요.</p></details><details class="more"><summary>원점수</summary><p>시험과 수행평가를 합쳐 100점 만점으로 낸 점수예요.</p></details><details class="more"><summary>석차백분율</summary><p>같은 학교, 같은 학년에서 내 석차를 전체 인원으로 나누고 100을 곱한 값이에요. 숫자가 작을수록 성적이 좋아요. 다른 학생과 비교해서 정해져서, 내 점수만으로는 계산할 수 없어요.</p></details><details class="more"><summary>고입 내신 성적</summary><p>중학교 학교생활기록부로 계산한 고등학교 입학용 점수예요. 교과 성적과 비교과 성적을 합쳐요. 총점(200점, 300점 등)과 반영하는 학년·학기가 지역마다 달라요.</p></details><details class="more"><summary>비교과 성적</summary><p>교과가 아닌 부분이에요. 출결, 봉사활동, 학교활동(창의적 체험활동, 수상, 임원 활동), 행동 특성 등이 들어가요. 반영 방식은 지역마다 달라요.</p></details><details class="more"><summary>미인정 결석</summary><p>이유를 인정받지 못한 결석이에요. 질병이나 인정되는 사유로 빠진 건 감점에 들어가지 않아요. 대부분의 시·도에서 미인정 지각·조퇴·결과 3회를 결석 1일로 계산해요.</p></details><details class="more"><summary>자유학기제</summary><p>시험 대신 체험 활동을 중심으로 하는 학기예요. 이 학기 성적은 고입 내신에 넣지 않거나 다른 학기 성적으로 바꿔 계산해요. 지역과 학교마다 달라요.</p></details><h3 class="tg">서류에 나오는 말</h3><details class="more"><summary>학교생활기록부(학생부)</summary><p>학교가 학생의 성적, 출결, 활동을 기록해 두는 공식 문서예요. 고입 내신은 이 기록으로 계산해요.</p></details><details class="more"><summary>입학전형요강(요항)</summary><p>학교가 정한 그해의 모집 규칙을 적은 문서예요. 모집 인원, 지원 자격, 전형 방법, 일정이 들어 있어요. 해마다 바뀔 수 있어서 지원 전에 꼭 확인해야 해요.</p></details><details class="more"><summary>고입 기본계획</summary><p>시·도교육청이 정하는 고등학교 입학 규칙이에요. 일반고 배정 방법, 내신 계산 방법, 전체 일정이 들어 있어요.</p></details>${ui.legal()}</div>`;
  },
  // 지도에서 지역을 고른 직후 보는 맞춤 홈
  home() {
    const r = store.region;
    return r ? screens.homeRegion(r) : screens.homePick();
  },

  homePick() {
    return `<div class="hero"><div class="topbar">${ui.logo()}${pwaInstallHtml()}</div>
      <h1>고등학교,<br><em>어디</em> 갈까요?</h1>
      <p>우리 아이가 갈 수 있는 학교를 알려 드려요</p>
      <div class="mapbox"><div class="mapwrap">${ui.map('', true, true)}<div class="hint" aria-hidden="true"><i class="ripple"></i><span class="hand">👆</span><span class="hintTxt R">사는 지역을<br>클릭하세요.</span><span class="hintTxt L">사는 지역을<br>클릭하세요.</span></div></div></div>
      <div class="pillars">
        <a href="#/q/kinds">${ui.icon('school')}<b>학교 종류</b><small>어떤 학교가 있는지</small></a>
        <a href="#/q/select">${ui.icon('select')}<b>배정·선발 방법</b><small>어떻게 뽑는지</small></a>
        <a href="#/q/when">${ui.icon('when')}<b>일정</b><small>원서·발표는 언제</small></a>
      </div>
      <p class="mininotice">교육청 등 공공기관과 무관한 민간 서비스 · 공개 자료 기반 참고용</p>
</div>`;
  },

  // 시·도를 누른 뒤: 시·군·구 지도(평준화 색)에서 사는 곳을 골라요
  pick(key, peek) {
    const R = REGIONS[key], L = LEVELING[key];
    if (!R || !SUBMAP[key]) return `<div class="page"><p>없는 지역이에요.</p></div>`;
    const all = L && L.mode === 'all';
    return `<div class="page pick">
      <h2 class="qt">${R.name}, 어느 곳에 사세요?</h2>
      <p class="sub">${all ? `${R.name}은 모든 지역이 <b>평준화 방식</b>(추첨으로 배정)이에요.` : '색은 일반고를 가는 방식이에요. 사는 곳을 눌러 주세요.'}</p>
      ${ui.levelLegend(key)}
      ${ui.peekCard(key, peek)}
      <div class="submapbox">${ui.subMap(key, peek)}</div>
      ${L && L.note ? `<p class="note">${L.note}</p>` : ''}
      <p class="note">평준화 = 교육청이 추첨으로 학교를 배정해요. 비평준화 = 학생이 학교에 지원해서 선발돼요. (${LEVELING_ASOF} 정리, 2027학년도 시·도 기본계획 기준)</p>
      <button class="whole" data-act="sigun" data-key="${key}" data-sigun="">${R.name} 전체로 볼래요</button></div>`;
  },

  // 지도에서 지역을 고른 뒤 보는 화면: 갈 수 있는 고등학교를 종류 7가지로 한눈에, 누르면 학교 목록이 펼쳐져요
  homeRegion(r) {
    const T = regionTiles(r);
    const tile = t => `<button class="rt ${t.color}${t.id === regionTile ? ' sel' : ''}${t.wide ? ' wide' : ''}" data-act="rtile" data-id="${t.id}" aria-pressed="${t.id === regionTile}">
      <span class="rn">${t.count}<small>곳</small></span><b>${t.title}</b><small>${t.scope}</small></button>`;
    const cur = T.find(t => t.id === regionTile);
    const panel = cur ? `<div class="rpanel"><h3>${cur.title} <em>${cur.count}곳</em></h3>${cur.note ? `<p class="note">${cur.note}</p>` : ''}${cur.list()}</div>` : '<p class="note rhint">종류를 누르면 어떤 학교가 있는지 나와요.</p>';
    return `<div class="bar"><span>📍</span><b>${r.label}</b></div>
      <div class="mini"><div class="m">${ui.map(r.area, false, false)}</div>
        <div class="t">${r.sigun ? r.sigun.replace(/시$|군$/, '') + ' ' : r.label + ' '}부모님,<br><em>이 학교들</em>이<br>우리 아이 후보예요</div></div>
      <h2 class="rh">갈 수 있는 고등학교</h2>
      <div class="rgrid">${T.map(tile).join('')}</div>${panel}${cur ? regionCompare(cur, r) : `<h2 class="rh">${REGIONS[r.area].name} 일정</h2>${regionSchedule(r)}`}`;
  },

  // 묶음별 질문 목록. skipIds 는 타일에 이미 나온 질문이라 뺀다.
  groupedQuestions(groupIds, skipIds) {
    return CONFIG.groups.filter(g => groupIds.includes(g.id)).map(g => {
      const qs = QUESTIONS.filter(q => q.group === g.id && !(skipIds || []).includes(q.id));
      return qs.length ? `<div class="grp">${g.label}</div>${qs.map(ui.questionRow).join('')}` : '';
    }).join('');
  },

  // ---- 질문 화면: 모든 질문이 같은 모양 ----
  question(id) {
    const q = findQuestion(id);
    if (!q) return `<div class="page"><p>없는 질문이에요.</p></div>`;
    const r = store.region;
    const where = q.noRegion ? '' : `<div class="where">📍 ${r ? r.label : '지역 미선택'} <a data-act="repick">${r ? '바꾸기' : '고르기'}</a></div>`;
    let body;
    if (q.ready === false) {
      body = `<div class="ans soft">이 질문은 <b>준비 중</b>이에요.</div>`;
    } else {
      const reg = q.regional ? q.regional(r) : null;
      const regHtml = !r ? '' : reg ? `${ui.countBoxes(reg.counts)}
        <p class="note">${reg.note || ''}</p>` : '';
      body = `<div class="ans">${q.oneLine(r)}</div>${q.view ? views[q.view](r) : ''}${regHtml}
        ${(q.detail || []).map(d => `<details class="more"><summary>${d.t}</summary><p>${d.body}</p></details>`).join('')}`;
    }
    const next = (q.next || []).map(findQuestion).filter(Boolean);
    return `<div class="page">
      <h2 class="qt">${q.title}</h2>${where}${body}
      ${q.cta ? `<a class="btn" href="${q.cta.href}">${q.cta.label}</a>` : ''}
      ${next.length ? `<div class="next">이어서 볼 질문</div>${next.map(n => `<a class="nx" href="#/q/${n.id}">${n.title}</a>`).join('')}` : ''}
      ${ui.adSlot()}</div>`;
  },

  // ---- 빈 화면(메뉴 확인용) ----
  // 학교 찾기: 이름을 치거나 시·도·종류를 골라 찾아요. 학교 자료는 처음 열 때 불러와요
  schools() {
    ensureSchools();
    const f = findState;
    const opt = (v, t, cur) => `<option value="${v}"${cur === v ? ' selected' : ''}>${t}</option>`;
    return `<div class="page find"><h2 class="qt">학교 찾기</h2>
      <div class="fform"><input id="fq" type="search" data-find="q" placeholder="학교 이름 (예: 하나고, 부천)" value="${f.q.replace(/"/g, '&quot;')}" autocomplete="off">
        <div class="frow"><select data-find="area">${opt('', '전체 지역', f.area)}${Object.keys(REGIONS).map(id => opt(id, REGIONS[id].name, f.area)).join('')}</select>
        <select data-find="grp">${opt('', '전체 종류', f.grp)}${Object.keys(GROUP_LABEL).map(g => opt(g, GROUP_LABEL[g], f.grp)).join('')}</select></div></div>
      <div id="fres">${findResults()}</div></div>`;
  },
  mine() {
    const sc = store.score;
    const grades = ['중1', '중2', '중3'].map(g => `<option${sc.grade === g ? ' selected' : ''}>${g}</option>`).join('');
    const open = SC_OPEN[sc.grade] || [];
    if (!open.includes(scoreSem)) scoreSem = open[open.length - 1] || '';
    const tabs = open.map(m => `<button type="button" class="stab${m === scoreSem ? ' on' : ''}" data-act="semtab" data-m="${m}">${m.replace('-', '학년 ')}학기</button>`).join('');
    const d = (sc.sem && sc.sem[scoreSem]) || {};
    const opt = (list, cur) => '<option value="">-</option>' + list.map(x => `<option${cur === x ? ' selected' : ''}>${x}</option>`).join('');
    const mainRows = SC_MAIN.map(subj => { const v = d[subj] && typeof d[subj] === 'object' ? d[subj] : {};
      return `<tr><th>${subj}</th><td><input type="number" inputmode="decimal" min="0" max="100" step="0.1" data-sc="${scoreSem}|${subj}" value="${v.s === undefined ? '' : v.s}" aria-label="${subj} 원점수"></td><td><select data-scach="${scoreSem}|${subj}" aria-label="${subj} 성취도">${opt(ACHIEVE, v.a || scAch(v.s))}</select></td></tr>`; }).join('');
    const artRows = SC_ART.map(subj => `<tr><th>${subj}</th><td class="dash">-</td><td><select data-scart="${scoreSem}|${subj}" aria-label="${subj} 성취도">${opt(['A', 'B', 'C'], d[subj])}</select></td></tr>`).join('');
    const ev = (store.score.etc || {});
    const etcIn = (k, label) => `<input type="number" inputmode="decimal" min="0" step="1" data-etc="${k}" value="${ev[k] === undefined ? '' : ev[k]}" aria-label="${label}">`;
    const teuk = scoreSem === '3-2' && myArea() === 'gg' ? '<p class="note"><b>3학년 2학기:</b> 일반고는 학기말 성적까지 반영해요. 특성화고는 3학년 2학기 1차 정기시험 성적까지만 반영하고, 그때까지의 성적을 학교가 100%로 환산해요.</p>' : '';
    const form = scoreSem ? `<div class="stabs">${tabs}</div>
        <table class="scf"><colgroup><col class="c1"><col><col></colgroup><thead><tr><th>과목</th><th>원점수</th><th>성취도</th></tr></thead><tbody>${mainRows}<tr class="sep"><th colspan="3">체육·예술</th></tr>${artRows}</tbody></table>${teuk}
        <p class="note">원점수를 넣으면 성취도(A~E)가 자동으로 들어가요. 성적표에 없는 과목은 비워 두세요. 자유학기 등 성적이 없는 학기도 비워 두세요.</p>` : '<p class="note">학년을 고르면 입력할 수 있는 학기가 열려요.</p>';
    return `<div class="page"><h2 class="qt">내 정리</h2>
      <section id="score" class="box"><h3>내 성적</h3>
        <p class="note">고등학교 입학(고입)에는 중학교 성적이 학기별로 들어가요. 학기별로 원점수를 입력해 주세요. 입력한 성적은 이 기기에만 저장돼요.</p>
        <label class="grade">학년 <select data-score-grade><option value="">선택</option>${grades}</select></label>
        ${form}</section>
      ${myArea() === 'gg' ? `<section class="box"><h3>출결·봉사·학교활동</h3>
        <p class="note">경기 내신은 성적 말고도 이 세 가지가 50점이에요. 모르는 칸은 비워 두세요.</p>
        <table class="scf etc"><colgroup><col class="c1"><col><col></colgroup><thead><tr><th>출결</th><th>미인정 결석(일)</th><th>미인정 지각·조퇴·결과(회)</th></tr></thead><tbody>${[1, 2, 3].map(g => `<tr><th>${g}학년</th><td>${etcIn('abs' + g, '결석')}</td><td>${etcIn('late' + g, '지각 조퇴 결과')}</td></tr>`).join('')}</tbody></table>
        <p class="note">질병·인정 결석은 빼요. 미인정 지각·조퇴·결과는 3회가 결석 1일이에요.</p>
        <table class="scf etc"><colgroup><col class="c1"><col><col></colgroup><tbody>
          <tr><th>봉사활동</th><td>${etcIn('vol', '3년 봉사활동 시간')}</td><td class="unit">시간 (1·2·3학년 합계)</td></tr>
          <tr><th>교내 수상</th><td>${etcIn('award', '상을 받은 학기 수')}</td><td class="unit">학기 (학기에 1개만 인정)</td></tr>
          <tr><th>학생회 임원</th><td>${etcIn('council', '임원 활동 개월 수')}</td><td class="unit">개월 (전교·학년 회장·부회장, 학급 회장·부회장)</td></tr>
        </tbody></table></section>` : ''}
      ${myArea() === 'gg' ? `<section class="box"><div class="hrow"><h3>경기 내신 점수 <small>200점 만점</small></h3>${GG_WHY}</div><div id="gg-res">${ggResult()}</div></section>`
        : `<section class="box"><h3>내신 점수</h3><p class="note">${NAESIN_NOTE[myArea()] || ((myArea() ? REGIONS[myArea()].name + '의 내신 점수 계산은 아직 준비 중이에요. ' : '메인 화면에서 지역을 고르면 그 지역 기준으로 알려 드려요. ') + '내신 점수를 쓰는 방법은 지역마다 달라서, 지역별로 하나씩 확인해서 채우고 있어요.')}</p><div id="gg-res">${ggResult()}</div></section>`}
      <section class="box"><h3>내 후보 학교 <small>${store.data.cands.length ? store.data.cands.length + '곳' : ''}</small></h3>${candList()}</section>
      <section class="box"><h3>내 원서 일정표</h3><div class="ans soft">준비 중이에요.</div></section></div>`;
  },
};

// 질문 화면 안에 들어가는 전용 본문들 (질문 자료의 view 이름과 같아요)
const views = {
  // 학교 분류: 큰 버튼 → (있으면) 안의 세부 버튼. 버튼은 name 이 같은 것끼리 하나만 열려요.
  kinds() {
    const c = null; // 학교 종류는 전국 공통 화면이라 지역 숫자를 넣지 않아요
    // 학교 수: 마이스터·자사고·대안은 시·군·구가 의미 없어서 시·도 전체로 세요
    const cnt = k => k.subs ? k.subs.reduce((n, s) => n + cnt(s), 0) : k.view ? c.areaSum(k.cats) : c.sum(k.cats);
    const num = k => c ? cnt(k) : null;
    const node = (k, group, sub) => {
      const n = num(k);
      const cnt = n === null ? '' : `<strong>${n}곳</strong>`;
      return `<details class="kind ${sub ? 'sub' : k.color}" name="${group}"><summary><span class="ic">${k.icon}</span>
        <span class="kt"><b>${k.title}</b><small>${k.short}</small></span>${cnt}</summary>
        <div class="kbody">${views.kindBody(k, c)}</div></details>`;
    };
    return `<div class="kinds">${KINDS.map(k => node(k, 'kinds', false)).join('')}</div>
      <p class="note">학교 종류와 학교 수는 교육부 학교 정보 시스템(나이스) 자료(${COUNTS_ASOF})를 따랐어요. 학교는 유형이 바뀌거나 문을 닫을 수 있어서, 지원 전에 교육청 공고로 꼭 확인해 주세요.</p>`;
  },

  // 한 분류를 펼쳤을 때 안쪽: 설명, 법적 이름, 세부 종류, 전용 목록, 세부 버튼
  kindBody(k, c) {
    const rows = (k.items || []).filter(([name]) => !c || c.t[name]).map(([name, desc]) => {
      const cnt = c ? `<em>${c.t[name] || 0}곳</em>` : '';
      return `<li><b>${name}</b>${cnt}<span>${desc}</span></li>`;
    }).join('');
    const subs = k.subs ? `<div class="subs">${k.subs.map(s => {
      const n = c ? `<strong>${s.view ? c.areaSum(s.cats) : c.sum(s.cats)}곳</strong>` : '';
      return `<details class="kind sub" name="sub-${k.id}"><summary><span class="ic">${s.icon}</span>
        <span class="kt"><b>${s.title}</b><small>${s.short}</small></span>${n}</summary><div class="kbody">${views.kindBody(s, c)}</div></details>`;
    }).join('')}</div>` : '';
    const none = c && k.cats && !k.subs && !k.view && !rows ? '<p class="kopen">이 지역에는 이 종류 학교가 없어요.</p>' : '';
    const extra = k.view ? views[k.view](c, k) : '';
    const go = k.next ? `<a class="kgo" href="#/q/${k.next}">더 알아보기 ›</a>` : '';
    const law = k.law ? `<p class="law">법적 이름: ${k.law}</p>` : '';
    return `<p>${k.intro}</p>${rows ? `<ul>${rows}</ul>` : none}${extra}${law}${subs}${go}`;
  },

  // 모집 범위 3가지로 나눠 학교 이름을 보여 줘요 (자사고, 과학고·영재학교 등). 학교 종류는 k.spTypes, 모집 지역 자료는 data/special.js
  recruit(c, k) {
    const types = k.spTypes, many = types.length > 1;
    const J = SP_DATA.filter(p => types.includes(p.c));
    const G = [['nation', '🌐 전국 모집', '어느 지역에 살아도 지원할 수 있어요'],
      ['plus', '🗺️ 해당 시·도 + 일부 다른 지역', '그 지역 학생과 정해진 몇 곳의 학생이 지원할 수 있어요'],
      ['own', '📍 해당 시·도만', '그 시·도에 사는 학생만 지원할 수 있어요']];
    const short = n => n.replace('등학교', '').replace('대학교', '대');
    return G.map(([g, t, d]) => {
      const L = J.filter(p => p.k === g);
      if (!L.length) return '';
      return `<div class="jg"><h4>${t} <em>${L.length}곳</em></h4><p>${d}</p><ul class="chips2">${L.map(p => {
        const tag = many ? `<small class="tg">${p.c === '영재학교' ? '영재' : p.c}</small>` : '';
        return `<li title="${REGIONS[p.r].name}${p.conf === 'ok' ? '' : ' · 확인 필요'}"><a href="${ui.schoolHref(p.n, p.r)}">${short(p.n)}${tag}<small>${REGIONS[p.r].name}${p.conf === 'ok' ? '' : '·확인필요'}</small></a></li>`;
      }).join('')}</ul></div>`;
    }).join('') + (k.planned ? `<div class="jg"><h4>🚧 개교 예정 <em>${k.planned.schools.length}곳</em></h4><p>${k.planned.note}</p><ul class="chips2">${k.planned.schools.map(p =>
      `<li title="${p.sub}">${p.n}<small class="tg">예정</small><small>${REGIONS[p.r].name}</small></li>`).join('')}</ul>
      <ul class="plist">${k.planned.schools.map(p => `<li><b>${p.n}</b> · ${p.when} · ${p.sub}</li>`).join('')}</ul></div>` : '') + `<p class="note">모집 범위는 학교 2027학년도 입학전형요강과 시·도 기본계획을 기준으로 했어요. 지원 전에 학교 요강으로 꼭 확인해 주세요.</p>`;
  },

  // 모집 범위 자료가 없는 종류(예술·체육고 등): 시·도별로 학교 이름만 보여 줘요. 학교 이름 목록은 data/groups.js
  byRegion(c, k) {
    const L = k.list === 'ART_LIST' ? ART_LIST : k.list === 'GONG_LIST' ? GONG_LIST : [], many = new Set(L.map(x => x.t)).size > 1;
    const groups = Object.keys(REGIONS).map(id => [id, L.filter(x => x.r === id)]).filter(g => g[1].length);
    return groups.map(([id, arr]) => `<div class="jg"><h4>${REGIONS[id].name} <em>${arr.length}곳</em></h4><ul class="chips2">${arr.map(x =>
      `<li><a href="${ui.schoolHref(x.n, x.r)}">${x.n.replace('등학교', '')}${many ? `<small class="tg">${x.t.replace('고', '')}</small>` : ''}<small>${x.s}</small></a></li>`).join('')}</ul></div>`).join('')
      + `<p class="note">${k.note || ''}</p>`;
  },

  // 전문 분야 특성화고: 대표 분야별 버튼, 안에 시·도별 학교 이름 (분야는 학과 이름으로 나눈 것: data/classify.js)
  vocFields() {
    const sido = Object.keys(REGIONS);
    return `<div class="subs">${Object.keys(VOC_FIELDS).map(f => {
      const F = VOC_FIELDS[f], all = VOC_LIST.filter(x => x.f === f);
      if (!all.length) return '';
      const body = sido.map(id => [id, all.filter(x => x.r === id)]).filter(g => g[1].length).map(([id, arr]) =>
        `<div class="jg"><h4>${REGIONS[id].name} <em>${arr.length}곳</em></h4><ul class="chips2">${arr.map(x => `<li><a href="${ui.schoolHref(x.n, x.r)}">${x.n.replace('등학교', '')}<small>${x.s}</small></a></li>`).join('')}</ul></div>`).join('');
      return `<details class="kind sub" name="sub-vocfield"><summary><span class="kt"><b>${F.title}</b><small>${F.desc}</small></span><strong>${all.length}곳</strong></summary><div class="kbody">${body}</div></details>`;
    }).join('')}</div><p class="note">분야는 학과 이름을 보고 학교마다 가장 많은 분야로 나눈 정리예요. 여러 분야의 학과가 섞인 학교가 많아서 정확하지 않을 수 있어요. 학교 홈페이지로 꼭 확인해 주세요. (대안교육 특성화고는 따로 있어요)</p>`;
  },

  // 어떻게 뽑아요?: 학교 종류별 버튼 (자료: data/select.js)
  selectKinds() {
    const li = arr => arr.map(x => `<li>${x}</li>`).join('');
    return `<div class="kinds">${SELECT_KINDS.map(k => {
      const body = k.ready === false ? '<p>준비 중이에요.</p>' : `<p>${k.summary}</p>
        <h4 class="sh">어떻게 뽑나요</h4><ul class="ways">${k.ways.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ul>
        <h4 class="sh">지원 순서</h4><ol class="steps">${li(k.steps)}</ol>
        <h4 class="sh">알아 둘 규칙</h4><ul class="rules">${li(k.rules)}</ul>
        <h4 class="sh">성적은 어떻게 쓰이나요</h4><p>${k.score}</p>
        <p class="where">${k.where}</p>`;
      return `<details class="kind ${k.color}" name="selk"><summary><span class="ic">${k.icon}</span><span class="kt"><b>${k.title}</b><small>${k.short}</small></span></summary><div class="kbody">${body}</div></details>`;
    }).join('')}</div><p class="note">2027학년도 시·도교육청 고등학교 입학전형 기본계획을 바탕으로 정리한 전국 공통 설명이에요. 지역마다 다른 점이 있으니 지원 전에 교육청 공고로 꼭 확인해 주세요.</p>`;
  },

  // 원서는 언제 내요?: 시기 순서대로 (자료: data/schedule.js)
  scheduleFlow() {
    const C = SCHEDULE_CHART;
    const head = C.months.map(m => `<span class="gm">${m}</span>`).join('');
    const rows = C.rows.map(r => `<div class="gr"><span class="gl">${r.label}</span>${C.months.map(m => `<span class="gc${r.on.includes(m) ? ' on-' + r.kind : ''}"></span>`).join('')}</div>`).join('');
    const chart = `<div class="gantt"><h3 class="tlband">한눈에 보기</h3>
      <div class="gy"><span class="gl"></span><span class="y1">2026년</span><span class="y2">2027년</span></div>
      <div class="gr gh"><span class="gl">월</span>${head}</div>${rows}
      <p class="glegend"><i class="on-a"></i>원서 접수 <i class="on-b"></i>발표·추가모집·등록</p></div>`;
    return chart + SCHEDULE.map(g => `<h3 class="tlband">${g.band}</h3><ol class="tl">${g.steps.map(s =>
      `<li><span class="tm">${s.m}</span><div><b>${s.t}</b><p>${s.n}</p></div></li>`).join('')}</ol>`).join('')
      + `<p class="note">2027학년도 입시(2026년 가을~2027년 겨울) 시·도교육청 기본계획에서 공통으로 나타난 시기를 월 단위로 정리한 거예요. 날짜는 지역마다 며칠씩 다르고 해마다 바뀌니, 정확한 날짜는 시·도교육청 공고로 꼭 확인해 주세요.</p>`;
  },

  // 마이스터고: 분야 5개 버튼, 안에 학교 이름
  meister(c) {
    const r = null; // 전국 공통 화면: 지역 거름 없음
    return `<div class="subs">${Object.keys(MEISTER_FIELDS).map(f => {
      const F = MEISTER_FIELDS[f], all = MEISTER_LIST.filter(x => x.f === f), mine = r ? all.filter(x => x.r === r.area) : all;
      const list = mine.length ? mine.map(x => `<li><a href="${ui.schoolHref(x.n, x.r)}">${x.n}<small>${REGIONS[x.r].name}</small></a></li>`).join('') : '';
      const note = r ? (mine.length ? `<p class="note">${REGIONS[r.area].name}에 있는 학교예요. 전국에는 ${all.length}곳이 있어요.</p>` : `<p class="kopen">${REGIONS[r.area].name}에는 이 분야 마이스터고가 없어요. 전국에는 ${all.length}곳이 있어요.</p>`) : '';
      return `<details class="kind sub" name="sub-meister"><summary><span class="kt"><b>${F.title}</b><small>${F.desc}</small></span><strong>${r ? mine.length : all.length}곳</strong></summary>
        <div class="kbody">${note}${list ? `<ul class="names">${list}</ul>` : ''}</div></details>`;
    }).join('')}</div><p class="note">분야는 학교 이름과 대표 학과를 보고 나눈 정리예요. 학교 홈페이지로 꼭 확인해 주세요.</p>`;
  },

  // 대안·기타: 대안교육 특성화고 (경기도교육청 공식 목록)
  alt() {
    const L = ALT_LIST.map(x => `<li><a href="${ui.schoolHref(x.n, x.r)}">${x.n}<small>${REGIONS[x.r].name} ${x.s}${x.u ? ' · 확인필요' : ''}</small></a></li>`).join('');
    return `<p class="note altwarn"><b>지금은 경기도 학교만 담겨 있어요.</b> 다른 지역에도 있을 수 있으니 시·도교육청에서 확인해 주세요.</p><ul class="names">${L}</ul><p class="note">출처: ${ALT_SPECIAL.src}. 경기도 학교만 정리했고, 다른 시·도는 교육청 자료로 확인되는 대로 더해요.</p>`;
  },
};

// ---- 학교 정보 화면: 학교를 누르면 나와요. 자료가 있는 칸만 보여 줘요 ----
// 학교 자료(약 1MB)는 이 화면을 처음 열 때 불러와요
let schoolsLoading = false;
function ensureSchools() {
  if (typeof SCHOOLS !== 'undefined') return true;
  if (!schoolsLoading) {
    schoolsLoading = true;
    const el = document.createElement('script');
    el.src = 'data/schools.js';
    el.onload = () => render(true);
    el.onerror = () => { schoolsLoading = false; };
    document.head.appendChild(el);
  }
  return false;
}
// 이름은 나이스 이름이든 줄인 이름(대원외고, 부천고 등)이든 찾아요
function findSchool(r, name) {
  const alt = name.replace(/외고$/, '외국어고');
  return SCHOOLS.find(x => x[0] === r && (x[1] === name || x[1] === name + '등학교'))
    || SCHOOLS.find(x => x[0] === r && (x[1].startsWith(name) || x[1].startsWith(alt)));
}
screens.school = function (path) {
  const i = path.indexOf('/'), r = path.slice(0, i), name = decodeURIComponent(path.slice(i + 1));
  if (!ensureSchools()) return `<div class="page"><div class="ans soft">학교 정보를 불러오는 중이에요…</div></div>`;
  const row = findSchool(r, name);
  if (!row) return `<div class="page"><div class="ans soft">학교 정보를 찾지 못했어요.</div></div>`;
  const [, full, type, found, sex, sigun, home, tel, majors, , , I0] = row, I = I0 || {};
  const sp = SP_DATA.find(p => p.r === r && (full === p.n || full === p.n + '등학교' || full.startsWith(p.n) || full.startsWith(p.n.replace(/외고$/, '외국어고'))));
  const num = v => Number(v).toLocaleString('ko-KR');
  const kv = rows => `<dl class="kv">${rows.filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const sec = (t, body) => body ? `<section class="sec"><h2>${t}</h2>${body}</section>` : '';
  const tags = [type, found, { 공: '남녀공학', 남: '남학교', 여: '여학교' }[sex], REGIONS[r].name + (sigun ? ' ' + sigun : '')].filter(Boolean);

  // 지원할 수 있는 지역(특목·자사·영재만)
  let range = '';
  if (sp) {
    const also = (sp.also || []).map(a => REGIONS[a].name).join('·');
    const line = { nation: ['🌐 전국 모집', '어느 지역에 살아도 지원할 수 있어요.'],
      plus: ['🗺️ 해당 시·도 + 일부 다른 지역', `${REGIONS[sp.r].name}${also ? ' 학생과 ' + also : ''} 학생이 지원할 수 있어요.`],
      own: ['📍 해당 시·도만', `${REGIONS[sp.r].name}에 사는 학생만 지원할 수 있어요.`] }[sp.k];
    if (line) range = `<section class="sec range"><h2>지원할 수 있는 지역</h2><p class="rg"><b>${line[0]}</b> — ${line[1]}</p>
      ${sp.note ? `<p class="note">${sp.note}</p>` : ''}<p class="note">출처: ${sp.src}${sp.conf === 'ok' ? '' : ' · 일부 확인하지 못했어요(확인 필요)'}</p></section>`;
  }
  // 특목·자사·영재가 아니어도 원문에서 전국 모집으로 확인된 예술·체육고·마이스터고
  if (!range && NATIONAL_RECRUIT[full]) { const N = NATIONAL_RECRUIT[full]; range = `<section class="sec range"><h2>지원할 수 있는 지역</h2><p class="rg"><b>🌐 전국 모집</b> — 어느 지역에 살아도 지원할 수 있어요.</p>${N.note ? `<p class="note"><b>알아 두세요.</b> ${N.note}</p>` : ''}<p class="note">출처: ${N.src}. 해마다 바뀔 수 있으니 학교 요강으로 꼭 확인해 주세요.</p></section>`; }
  // 대구국제고(2026학년도 입학전형계획)·인천국제고(2025학년도 요강): 요강에서 확인한 것만 적어요
  const admitOther = false && sp && sp.c === '국제고' && (r === 'daegu' || r === 'incheon') ? `<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계</b> — 영어 내신(160점 만점)과 출결(감점)로 ${r === 'daegu' ? '모집 인원의 150%' : '정원의 2배수'}를 뽑아요.</p>${r === 'incheon' ? '<p class="note">영어 내신이 같으면 국어와 사회 성취도를 3학년 2학기부터 거꾸로(3학년 2학기 국어, 3학년 2학기 사회, 3학년 1학기 국어…) 비교해요. 그래도 같으면 모두 2단계로 올려요.</p>' : '<p class="note">영어 내신이 같을 때 어떻게 가르는지는 학교 요강으로 확인해 주세요.</p>'}<p class="rg"><b>2단계</b> — 1단계 점수 160점에 면접 40점을 더해 최종 합격자를 정해요. 면접은 자기주도학습과 인성을 물어요.</p><p class="note">출처: ${r === 'daegu' ? '대구국제고 2026학년도 입학전형계획' : '인천국제고 2025학년도 신입생 입학전형 요강(2027학년도는 확인 전)'}. 학교와 해마다 달라질 수 있으니 지원 전에 학교 입학전형요강으로 꼭 확인해 주세요.</p></section>` : '';
  // 서울·부산·세종 국제고: 2027학년도 학교 입학전형요강 원문 기준 (영어 160점 = 2학년 1학기~3학년 2학기 4개 학기 × 40점)
  const ADMIT3 = {
    seoul: { name: '서울국제고', beats: '정원의 1.5배수', att: '미인정 결석 1일마다 1점을 빼요(지각·조퇴·결과 3회는 결석 1일).',
      tie1: '영어 성취도를 3학년 2학기, 3학년 1학기, 2학년 2학기, 2학년 1학기 순으로 비교하고, 그래도 같으면 국어·사회 성취도를 3학년 2학기부터 거꾸로 비교해요(사회가 없는 학기는 역사).',
      tie2: '면접 총점, 자기주도학습 영역 점수, 인성 영역 점수, 1단계 영어 점수, 출결 점수 순으로 가려요.', iv: '자기주도학습 영역 30점, 인성 영역 10점' },
    daegu: { name: '대구국제고', beats: '모집 정원의 1.5배수', att: '미인정 결석 1일마다 0.6점을 빼고, 10일 이상이면 6점이에요.',
      tie1: '국어·사회 성취도를 3학년 2학기 국어, 3학년 2학기 사회, 3학년 1학기 국어… 순으로 비교하고(사회가 없으면 역사), 마지막으로 출결 감점이 적은 사람이 앞서요. 그래도 같으면 모두 1단계에 합격해요.',
      tie2: '', iv: '자기주도학습 영역과 인성 영역' },
    incheon: { name: '인천국제고', beats: '정원의 2배수', att: '미인정 결석 1일마다 0.2점을 빼요(8일 이상이면 최대).',
      tie1: '국어·사회 성취도를 3학년 2학기 국어, 3학년 2학기 사회, 3학년 1학기 국어… 순으로 비교해요(사회가 없으면 역사). 그래도 같으면 모두 2단계로 올려요.',
      tie2: '면접 점수, 면접 중 자기주도학습 영역 점수, 1단계 국어·사회 성취도, 생년월일이 늦은 사람 순으로 가려요.', iv: '자기주도학습 영역과 인성 영역' },
    busan: { name: '부산국제고', tag: '(받은 파일 제목이 "요강(안)"이라 확정본과 다를 수 있어요)', beats: '정원의 1.5배수(소수점은 올려요)', att: '미인정 결석 1일마다 0.6점을 빼고, 최대 6점까지 빼요(지각·조퇴·결과 3회는 결석 1일, 모든 학년을 합해요).',
      tie1: '국어·사회 성취도를 3학년 2학기 국어, 3학년 2학기 사회, 3학년 1학기 국어… 순으로 비교해요(사회가 없으면 역사). 그래도 같으면 모두 1단계에 합격해요.',
      tie2: '', iv: '자기주도학습 영역과 인성 영역' },
    sejong: { name: '세종국제고', beats: '일반전형은 정원의 1.5배수, 사회통합·특례입학전형은 2배수', att: '미인정 결석 1일마다 0.6점을 빼고, 최대 6점까지 빼요(지각·조퇴·결과 3회는 결석 1일, 전 학년을 합해요).',
      tie1: '국어·사회 성취도를 3학년 2학기 국어, 3학년 2학기 사회, 3학년 1학기 국어… 순으로 비교해요(사회가 없으면 역사). 그래도 같으면 모두 2단계로 올려요.',
      tie2: '면접 총점, 자기주도학습 영역 점수, 인성 영역 점수, 1단계 영어 점수, 국어·사회 성취도 순으로 가려요.', iv: '자기주도학습 영역과 인성 영역' },
  };
  const A3 = sp && sp.c === '국제고' && ADMIT3[r] ? ADMIT3[r] : null;
  const admit3 = A3 ? `<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계</b> — 영어 내신(160점 만점)과 출결(감점)로 ${A3.beats}를 뽑아요.</p>
    <p class="note">영어는 2학년 1학기부터 3학년 2학기까지 4개 학기를 봐요. 학기마다 성취도 A는 40점, B는 36점, C는 32점, D는 28점, E는 24점이에요(원점수와 평균은 안 써요).</p>
    <p class="note">출결: ${A3.att}</p><p class="note">1단계 점수가 같으면: ${A3.tie1}</p>
    <p class="rg"><b>2단계</b> — 1단계 160점에 면접 40점(${A3.iv})을 더해 최종 합격자를 정해요.</p>${A3.tie2 ? `<p class="note">2단계 점수가 같으면: ${A3.tie2}</p>` : ''}
    <p class="note">출처: ${A3.name} 2027학년도 신입생 입학전형요강${A3.tag || ''}. 해마다 바뀔 수 있으니 지원 전에 꼭 확인해 주세요.</p></section>` : '';
  // 세종과학고·한성과학고(서울): 2027학년도 입학전형요강(연진님이 보내 준 요강 화면) 기준, 두 학교 전형 방법이 같아요. 점수 배점은 요강에 없어요(서류·면담·면접 종합 평가)
  const ASCI = { '세종과학고등학교': { n: '세종과학고', cap: '정원 내 160명(일반 128명, 사회통합 32명)과 정원 외 10명 이내' }, '한성과학고등학교': { n: '한성과학고', cap: '정원 내 140명(일반 112명, 사회통합 28명)과 정원 외 8명 이내' } };
  const AS = r === 'seoul' && ASCI[full];
  const admitSci = AS ? '<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계</b> — 서류 평가와 출석 면담으로 소집 면접 대상자를 모집 인원의 1.5배수 이내로 뽑아요. 서류는 학교생활기록부, 자기소개서, 교사추천서예요.</p><p class="rg"><b>2단계</b> — 소집 면접을 봐요. 중학교 교육과정에 충실하고 과학·수학 기본 개념에 바탕을 둔 열린 문항으로 창의성, 인성, 잠재력을 평가해요. 최종 합격자는 서류 평가, 출석 면담, 소집 면접 결과를 종합해서 정해요.</p><p class="note">내신은 <b>과학·수학</b> 성취도만 봐요. 1단계는 2학년 1학기~3학년 1학기, 2단계는 3학년 2학기까지 반영해요. 성적이 없는 학기는 같은 학년의 다른 학기 성적을 써요.</p><p class="note">내신·서류·면접을 각각 몇 점으로 반영하는지는 요강에 나와 있지 않아서, 점수로 계산해 볼 수 없어요.</p><p class="note">모집: ' + AS.cap + '예요. 출처: ' + AS.n + ' 2027학년도 신입생 입학전형 요강. 해마다 바뀔 수 있으니 지원 전에 꼭 확인해 주세요.</p></section>' : '';
  // 외고: 시·도 기본계획에서 확인한 지역(경기·서울·울산·전남)만. 학교별 요강은 따로 확인해야 해요
  const FL = { gg: { src: '경기도교육청 2026학년도 고등학교 입학전형 기본계획(2027학년도는 확인 전)', beats: '정원의 1.5~2배수', note: '영어는 중학교 2·3학년 4개 학기를 보고, 학기마다 성취도 A는 40점, B는 36점, C는 32점, D는 28점, E는 24점으로 바꿔요(원점수와 평균은 안 써요). 1단계 점수가 같으면 국어와 사회 성취도를 3학년 2학기부터 거꾸로 비교해요(사회가 없으면 역사).', iv: '면접 40점' },
    seoul: { src: '서울특별시 2027학년도 고등학교 입학전형 기본계획', beats: '정원의 1.5배수', note: '세부 방법(배점, 동점자 처리)은 학교의 입학전형 요강에 나와요.', iv: '면접' },
    ulsan: { src: '울산광역시 2027학년도 고등학교 입학전형 기본계획', beats: '정원의 1.5~2배수', note: '영어는 중학교 2·3학년 성취도를 쓰고 원점수와 평균은 안 써요. 출결 감점 점수는 학교가 정해요.', iv: '면접 40점' },
    jeonnam: { src: '전라남도 2027학년도 고등학교 입학전형 기본계획', beats: '정원의 1.5~2배수', note: '영어는 중학교 2·3학년 성취도를 쓰고 원점수와 평균은 안 써요. 자유학기가 있으면 같은 학년의 다른 학기 성적으로 바꿔요. 외고는 학과별로 학생을 뽑아요.', iv: '면접 40점(자기주도학습 영역과 인성 영역)' } };
  const AF = sp && sp.c === '외고' && FL[r] ? FL[r] : null;
  const admitFl = AF ? `<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계</b> — 영어 내신(160점 만점)과 출결(감점)로 ${AF.beats}를 뽑아요.</p><p class="note">${AF.note}</p><p class="rg"><b>2단계</b> — 1단계 점수에 ${AF.iv}를 더해 최종 합격자를 정해요.</p><p class="note">출처: ${AF.src}. 학교마다 다를 수 있으니 지원 전에 학교 입학전형요강으로 꼭 확인해 주세요.</p></section>` : '';
  // 경기북과학고: 2027학년도 학교 홈페이지(입학안내 > 전형별 세부사항·모집정원)에서 확인한 내용. 점수 배점은 공개 안 돼 있어요
  const admitGbs = full === '경기북과학고등학교' && r === 'gg' ? '<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계 · 서류 평가</b> — 최근 4학기의 수학·과학 성취도와 수강자 수, 제출 서류로 수학·과학 분야의 열정, 학업소양, 탐구력, 핵심인성역량을 종합해서 봐요. 일반전형(정원 80명)은 3배수(240명) 내외를 개별면담 대상자로 뽑아요.</p><p class="rg"><b>2단계 · 개별면담</b> — 제출 서류가 사실인지 확인하는 면담이에요. 학교에서 하고, 필요하면 입학담당관이 중학교를 찾아가기도 해요. 2배수(160명) 내외를 소집면접 대상자로 뽑아요.</p><p class="rg"><b>3단계 · 소집면접</b> — 탐구력, 창의적 문제해결력, 의사소통능력을 평가해요. 서류 평가, 개별면담, 소집면접 결과를 종합해서 최종 합격자를 정해요.</p><p class="note">내신·서류·면접을 각각 몇 점으로 반영하는지는 공개돼 있지 않아서, 점수로 계산해 볼 수 없어요.</p><p class="note">모집: 정원 내 100명(일반전형 80명, 사회통합전형 20명)과 정원 외(국가유공자 자녀 3명 이내, 특례입학 2명 이내, 지역균형선발 3명 이내, 특수교육대상자 약간 명)예요. 출처: 경기북과학고 2027학년도 입학안내(전형별 세부사항, 모집정원). 해마다 바뀔 수 있으니 지원 전에 꼭 확인해 주세요.</p></section>' : '';
  // 청심국제고: 학교 2027학년도 신입생 입학전형요항(최종) 기준
  const admitCs = full === '청심국제고등학교' && r === 'gg' ? '<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계</b> — 영어 내신(160점 만점)과 출결(감점)로 모집 정원의 <b>2배수</b>를 뽑아요. 동점자는 모두 선발해요.</p><p class="note">영어는 2학년 1학기부터 3학년 2학기까지 4개 학기를 봐요(1학년 성적은 안 써요). 학기마다 성취도 A는 40점, B는 36점, C는 32점, D는 28점, E는 24점이에요. 출결은 미인정 결석 1~3일이면 0.5점, 4~6일이면 1점, 7~9일이면 1.5점, 10일 이상이면 2점을 빼요(미인정 지각·조퇴·결과 3회는 결석 1일).</p><p class="note">1단계 점수가 같으면 국어와 사회 성취도를 3학년 2학기부터 거꾸로 비교해요(사회가 없으면 역사). 그래도 같으면 모두 2단계로 올려요.</p><p class="rg"><b>2단계</b> — 1단계 160점에 면접 40점을 더해 최종 합격자를 정해요. 면접은 자기소개서와 학교생활기록부를 바탕으로 해요.</p><p class="note">모집: 정원 내 104명(일반전형 64명, 지역우수자전형 20명, 사회통합전형 20명)이에요. 출처: 청심국제고 2027학년도 신입생 입학전형요항(최종). 해마다 바뀔 수 있으니 지원 전에 꼭 확인해 주세요.</p></section>' : '';
  // 동탄국제고: 학교 2027학년도 신입생 전형요강 기준
  const admitDt = full === '동탄국제고등학교' && r === 'gg' ? '<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계</b> — 영어 내신(160점 만점)과 출결(감점)로 모집 정원의 <b>2배수</b>를 뽑아요.</p><p class="note">영어는 2학년 1학기부터 3학년 2학기까지 4개 학기를 봐요. 학기마다 성취도 A는 40점, B는 36점, C는 32점, D는 28점, E는 24점이에요. 출결은 미인정 결석 1일마다 0.1점을 빼고, 5일 이상이면 0.5점이에요(미인정 지각·조퇴·결과 3회는 결석 1일, 2회 이하는 감점 없음).</p><p class="note">1단계 점수가 같으면 국어와 사회 성취도를 3학년 2학기부터 거꾸로 비교해요(사회가 없으면 역사). 그래도 같으면 모두 2단계로 올려요.</p><p class="rg"><b>2단계</b> — 1단계 160점에 면접 40점(자기주도학습 영역 25점, 인성 영역 15점)을 더해 최종 합격자를 정해요.</p><p class="note">2단계 점수가 같으면 면접 점수, 자기주도학습 영역 점수, 1단계 영어 점수, 국어·사회 성취도, 서류평가 순으로 가려요.</p><p class="note">모집: 정원 내 200명(일반전형 120명, 지역우수자전형 40명(화성시 소재 중학교 졸업예정자), 사회통합전형 40명)과 정원 외 특례입학 4명이에요. 출처: 동탄국제고 2027학년도 신입생 전형요강. 해마다 바뀔 수 있으니 지원 전에 꼭 확인해 주세요.</p></section>' : '';
  // 고양국제고: 학교 2027학년도 신입생 입학전형요항 기준
  const admitGy = full === '고양국제고등학교' && r === 'gg' ? '<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계</b> — 영어 내신(160점 만점)과 출결(감점)로 모집인원의 <b>2배수</b>를 뽑아요.</p><p class="note">영어는 2학년 1학기부터 3학년 2학기까지 4개 학기를 봐요. 학기마다 성취도 A는 40점, B는 36점, C는 32점, D는 28점, E는 24점이에요(원점수와 평균은 안 써요). 출결은 미인정 결석 1일마다 0.5점을 빼요(미인정 지각·조퇴·결과 3회는 결석 1일, 1~2회는 감점 없음).</p><p class="note">1단계 점수가 같으면 국어와 사회 성취도를 3학년 2학기부터 거꾸로 비교해요. 그래도 같으면 모두 2단계로 올려요.</p><p class="rg"><b>2단계</b> — 1단계 160점에 면접 40점을 더해 최종 합격자를 정해요. 면접은 자기소개서와 학교생활기록부를 참고해요.</p><p class="note">2단계 점수가 같으면 면접 점수, 면접 중 자기주도학습 영역 점수, 1단계 영어 점수, 국어·사회 성취도 순으로 가려요.</p><p class="note">모집: 정원 200명이에요. 출처: 고양국제고 2027학년도 신입생 입학전형요항. 해마다 바뀔 수 있으니 지원 전에 꼭 확인해 주세요.</p></section>' : '';
  // 안산동산고(자사고): 학교 2027학년도 신입생 입학전형요항 기준
  const admitAs = full === '안산동산고등학교' && r === 'gg' ? '<section class="sec"><h2>선발 방법</h2><p class="rg"><b>일반전형(165명)과 안산우수인재전형(66명, 2025년 3월 31일 이전부터 안산교육지원청 관내 중학교에 다니는 졸업예정자)</b></p><p class="rg"><b>1단계</b> — 교과 성적(250점 만점, 출결 감점)으로 모집인원의 1.5배수를 뽑아요. 중학교 2·3학년 4개 학기를 봐요. 일반교과는 2학년 1·2학기가 각 50점, 3학년 1·2학기가 각 65점이고, 체육·예술교과는 20점이에요. 성취도를 A 5점~E 1점으로 바꿔서 학기별 평균으로 계산해요. 출결은 미인정 결석 1일마다 0.1점을 빼고 최대 0.5점까지 빼요.</p><p class="rg"><b>2단계</b> — 자기소개서와 면접(50점)을 더해 최종 300점으로 뽑아요.</p><p class="note">1단계 점수가 같으면 3학년 성적, 2학년 성적, 3학년 2학기·3학년 1학기·2학년 2학기·2학년 1학기 순으로 비교해요.</p><p class="rg"><b>안산미래인재전형(33명, 2025년 3월 31일 이전부터 안산교육지원청 관내 중학교에 다니는 졸업예정자)</b> — 1단계는 성적을 보지 않고 <b>공개 추첨</b>으로 모집인원의 1.5배수를 뽑고, 2단계 자기소개서·면접(50점)으로 정해요.</p><p class="note">사회통합전형은 66명이고, 정원의 20%예요. 1단계는 우선순위별로 성적 없이 공개 추첨으로 뽑아요. 후기 모집이고 경기도 전체에서 뽑아요(정원 330명, 11학급).</p><p class="note">출처: 안산동산고 2027학년도 신입생 입학전형요항. 해마다 바뀔 수 있으니 지원 전에 꼭 확인해 주세요.</p></section>' : '';
  // 경기과학고(과학영재학교): 학교 2027학년도 입학전형 요항 기준
  const admitGs = full === '경기과학고등학교' && r === 'gg' ? '<section class="sec"><h2>선발 방법</h2><p class="note">아래는 일반전형과 사회통합전형 기준이에요.</p><p class="rg"><b>1단계 · 서류 평가</b> — 학교생활기록부Ⅱ의 모든 내용과 자기소개서, 추천서를 종합해서 평가해요.</p><p class="rg"><b>2단계 · 영재성검사</b> — 영재성검사 Ⅰ·Ⅱ를 지필평가로 봐요. 기출 문항은 학교 홈페이지 입학안내에 올라와 있어요.</p><p class="rg"><b>3단계 · 영재성캠프</b> — 정원의 1.5배수 내외가 참여하고, 탐구활동과 면접, 관찰 등으로 인성과 영재성을 평가해요.</p><p class="note">모집: 정원 내 일반전형 120명(지역인재선발 최대 47명 포함)과 추천관찰전형(SW-AI 분야) 10명 내외, 정원 외 사회통합전형 12명 이내예요. 한 가지 전형으로만 지원할 수 있어요. 추천관찰전형(SW-AI 분야)은 1단계 서류 평가와 비대면 관찰평가, 2단계 영재성검사 Ⅰ과 대면 관찰평가로 뽑아요. 전형 단계별 배점은 요항에 나와 있지 않아서, 점수로 계산해 볼 수 없어요.</p><p class="note">출처: 경기과학고 2027학년도 입학전형 요항. 해마다 바뀔 수 있으니 지원 전에 꼭 확인해 주세요.</p></section>' : '';
  // 국제고: 1단계·2단계 선발 방법 (영어 160점·면접 40점은 보도 자료, 동점자 순서는 연진님 안내라 감수 때 요강 확인)
  const admit = sp && sp.c === '국제고' && r === 'gg' && full !== '고양국제고등학교' && full !== '동탄국제고등학교' && full !== '청심국제고등학교' ? '<section class="sec"><h2>선발 방법</h2><p class="rg"><b>1단계</b> — 영어 내신(4개 학기, 160점 만점)과 출결로 정원의 1.5~2배수를 먼저 뽑아요.</p><p class=\"note\">영어는 학기마다 성취도 A는 40점, B는 36점, C는 32점, D는 28점, E는 24점으로 바꿔요.</p>' + (r === 'gg' ? '<p class=\"note\">영어 내신이 같은 지원자가 많으면(대부분 영어 만점이에요) 국어와 사회 성취도로 가려요. 3학년 2학기 국어 → 3학년 2학기 사회 → 3학년 1학기 국어 → 3학년 1학기 사회 → 2학년 2학기 국어 → 2학년 2학기 사회 → 2학년 1학기 국어 → 2학년 1학기 사회 순서예요. 사회를 배우지 않았다면 역사로 대신해요.</p><p class=\"note\">출처: 경기도교육청 2026학년도 고등학교 입학전형 기본계획. 2027학년도는 학교 요강으로 확인해 주세요.</p>' : '<p class=\"note\">영어 내신이 같은 지원자가 많으면 그다음 국어와 사회 성적으로 가려요. 자세한 순서는 학교 요강으로 확인해 주세요.</p>') + '<p class="rg"><b>2단계</b> — 면접(40점)을 더해 최종 합격자를 정해요. 2단계는 내신이 아니라 면접으로 가려요.</p><p class="note">학교와 해마다 달라질 수 있으니 지원 전에 학교 입학전형요강으로 꼭 확인해 주세요.</p></section>' : '';
  // 학과
  const maj = (majors || []).length ? `<ul class="chips2">${majors.map(m => `<li>${m}</li>`).join('')}</ul>
    <p class="note">학과는 나이스에 등록된 이름이라 지금은 없는 옛 학과가 섞여 있을 수 있어요. 학교 홈페이지로 꼭 확인해 주세요.</p>` : '';
  // 규모
  const size = I.n ? `<div class="big"><div><b>${num(I.n)}명</b><span>전체 학생</span></div>${I.c ? `<div><b>${I.c}학급</b><span>전체 학급</span></div>` : ''}${I.t ? `<div><b>${I.t}명</b><span>교원</span></div>` : ''}</div>`
    + kv([I.g && ['학년별', I.g.map((n, k) => `${k + 1}학년 ${num(n)}명`).join(' · ')],
          I.a && ['학급당 학생', I.a.map((n, k) => `${k + 1}학년 ${n}명`).join(' · ')],
          (I.m || I.w) && ['남·여', `남학생 ${num(I.m || 0)}명 · 여학생 ${num(I.w || 0)}명`],
          I.r && ['교원 1인당', `학생 ${I.r}명`]]) : '';
  // 생활
  const life = kv([I.dm > 0 && ['기숙사', `있어요 (${num(I.dm)}명 수용)`],
    I.cl && I.cl[0] > 0 && ['동아리', `창의적 체험활동 동아리 ${I.cl[0]}개(참여 ${num(I.cl[1])}명)${I.cl[2] > 0 ? `<br>자율동아리 ${I.cl[2]}개(참여 ${num(I.cl[3])}명)` : ''}`],
    I.as && I.as[0] > 0 && ['방과후', `프로그램 ${I.as[0]}개(참여 ${num(I.as[1])}명)`],
    I.u && I.u[0] > 0 && ['교복', `구입 지원금 ${num(I.u[0])}원`]]);
  const link = home ? home.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
  const contact = kv([home && ['홈페이지', `<a class="a" href="${home}" target="_blank" rel="noopener">${link}</a>`],
    tel && ['전화', `<a class="a" href="tel:${tel}">${tel}</a>`],
    sigun && ['소재지', `${REGIONS[r].name} ${sigun}`]]);
  const srcs = ['학교 기본 정보: 나이스(' + (typeof SCHOOLS_ASOF !== 'undefined' ? SCHOOLS_ASOF : '') + ')', I.n ? `규모·생활 정보: 학교알리미 ${I.y || ''}학년도 공시` : '', sp ? '지원 지역: 학교 2027학년도 입학전형요강·시·도 기본계획' : ''].filter(Boolean).join(' · ');
  const saved = store.hasCand(r, full);
  const gl = typeof GROUP_LABEL !== 'undefined' ? (GROUP_LABEL[schoolGroup(row)] || type) : type;
  return `<div class="page sch"><div class="shero"><div class="shead"><h1>${full}</h1>
      <button class="candbtn${saved ? ' on' : ''}" data-act="cand" data-r="${r}" data-n="${full}" data-t="${gl}" data-s="${sigun || ''}" aria-label="${saved ? '내 후보에서 빼기' : '내 후보에 담기'}" aria-pressed="${saved}">${ui.icon('mine', saved)}<span>${saved ? '담았어요' : '후보 담기'}</span></button></div>
      <div class="tags">${tags.map(t => `<span>${t}</span>`).join('')}</div></div>
    ${range}${admit}${admitOther}${admit3}${admitSci}${admitFl}${admitGbs}${admitGy}${admitDt}${admitCs}${admitAs}${admitGs}${sec('학과', maj)}${sec('학교 규모', size)}${sec('학교 생활', life)}${sec('학교 연락처', contact)}
    <p class="src">${srcs}. 학교 사정으로 바뀔 수 있으니 지원 전에 학교에 꼭 확인해 주세요.</p></div>`;
};

// ---- 학교 찾기 도우미 ----
const GROUP_LABEL = { gen: '일반고', gong: '자공고', sci: '과학고·영재학교', lang: '외고·국제고', jasa: '자사고', art: '예술·체육고', meister: '마이스터고', voc: '특성화고', alt: '대안교육 특성화고' };
const findState = { q: '', area: '', grp: '' };
// 학교(자료 한 줄)가 어느 종류인지: 학교 종류 화면의 분류와 같아요
function schoolGroup(row) {
  const t = row[2];
  if (t === '자공고') return 'gong';
  let k = CAT_OF_TYPE[t];
  if (k === 'gen') return 'gen';
  if (k === 'meister') return 'meister';
  if (k === 'voc' && row[0] === 'gg' && ALT_SPECIAL.schools.includes(row[1])) return 'alt';
  return k;
}
function findResults() {
  const f = findState;
  if (typeof SCHOOLS === 'undefined') return '<p class="note">학교 자료를 불러오는 중이에요…</p>';
  const q = f.q.replace(/\s/g, '');
  if (!q && !f.area && !f.grp) return '<p class="note">학교 이름을 입력하거나, 지역·종류를 골라 보세요.</p>';
  const alias = q.replace(/외고/g, '외국어고');
  const list = SCHOOLS.filter(r => (!f.area || r[0] === f.area) && (!f.grp || schoolGroup(r) === f.grp)
    && (!q || r[1].replace(/\s/g, '').includes(q) || r[1].includes(alias)));
  const MAX = 100;
  const rows = list.slice(0, MAX).map(r => `<a class="srow" href="${ui.schoolHref(r[1], r[0])}"><b>${r[1]}</b><small>${GROUP_LABEL[schoolGroup(r)] || r[2]} · ${REGIONS[r[0]].name}${r[5] ? ' ' + r[5] : ''}</small></a>`).join('');
  return `<p class="fcount"><b>${list.length}곳</b>${list.length > MAX ? ` 중 ${MAX}곳을 보여 드려요. 이름이나 지역을 더 좁혀 보세요.` : ''}</p>${rows || '<p class="note">찾는 학교가 없어요. 이름 일부만 입력해 보세요.</p>'}`;
}

// 내 정리: 담은 후보 학교 목록
function candList() {
  const L = store.data.cands;
  if (!L.length) return '<p class="note">아직 담은 학교가 없어요. 학교 정보 화면의 "후보 담기"를 눌러 담아 보세요.</p>';
  return L.map(c => `<div class="crow"><a href="${ui.schoolHref(c.n, c.r)}"><b>${c.n}</b><small>${c.t} · ${REGIONS[c.r].name}${c.s ? ' ' + c.s : ''}</small></a>
    <button data-act="candrm" data-r="${c.r}" data-n="${c.n}" aria-label="${c.n} 빼기">빼기</button></div>`).join('');
}
