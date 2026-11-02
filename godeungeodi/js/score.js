// 경기도 고입 내신 중 "교과활동상황 150점" 계산 (2027학년도 경기도 고등학교 입학 내신성적 반영지침)
// 학기마다: 기본점수 + 성취도 평균 × k + 원점수 평균 × w  (일반교과, 120점 만점) / 체육·예술은 전 학년 한꺼번에 30점 만점.
const SC_SEMS = ['1-2', '2-1', '2-2', '3-1', '3-2'];                       // 경기 고입에 들어가는 학기 (1학년 1학기는 자유학기라 안 들어가요)
const SC_OPEN = { '중1': ['1-2'], '중2': ['1-2', '2-1', '2-2'], '중3': ['1-2', '2-1', '2-2', '3-1', '3-2'] };
const SC_MAIN = ['국어', '도덕', '사회', '역사', '수학', '과학', '기술·가정', '정보', '영어'];   // 일반교과: 원점수 + 성취도(A~E)
const SC_ART = ['체육', '음악', '미술'];                            // 체육·예술교과: 성취도(A~C)만
const SC_RULE = { '1-2': { base: 4, k: 0.8, w: 0.04 }, '2-1': { base: 8, k: 1.6, w: 0.08 }, '2-2': { base: 8, k: 1.6, w: 0.08 }, '3-1': { base: 10, k: 2, w: 0.1 }, '3-2': { base: 10, k: 2, w: 0.1 } };
const SC_PT = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const scRound = x => Math.round(x * 1000 + 1e-7) / 1000;           // 소수 넷째 자리에서 반올림, 셋째 자리까지

// 원점수 → 성취도 (90 이상 A, 80 이상 B, 70 이상 C, 60 이상 D, 그 아래 E)
function scAch(s) {
  if (s === '' || s === undefined || s === null || isNaN(s)) return '';
  return s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'E';
}
// 한 학기 일반교과 점수. rows = [{ s: 원점수, a: 성취도 }] (원점수 없는 과목은 빼요). 과목이 없으면 null
function scSemester(m, rows) {
  const R = SC_RULE[m], L = rows.filter(r => r.s !== undefined && r.s !== null && !isNaN(r.s) && SC_PT[r.a]);
  if (!L.length) return null;
  const n = L.length;
  const ach = L.reduce((t, r) => t + SC_PT[r.a], 0) / n * R.k;
  const raw = L.reduce((t, r) => t + r.s, 0) / n * R.w;
  return { pts: scRound(R.base + ach + raw), max: R.base * 3, n };
}
// 체육·예술: 전 학년 성취도(A·B·C)로 한 번에. 과목이 없으면 null
function scArt(list) {
  const n = list.length;
  if (!n) return null;
  const a = list.filter(x => x === 'A').length, b = list.filter(x => x === 'B').length, c = list.filter(x => x === 'C').length;
  return { pts: scRound(10 + 20 * (3 * a + 2 * b + c) / (3 * n)), max: 30, n };
}

// 출결(20점): 학년별 미인정 결석일수. 미인정 지각·조퇴·결과는 3회를 결석 1일로 쳐요. 1학년 6점, 2·3학년 7점 만점
const SC_ABS_PCT = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
function scAbsence(grade, absent, late) {
  const days = Math.max(0, Math.floor(absent || 0)) + Math.floor(Math.max(0, late || 0) / 3);
  const max = grade === 1 ? 6 : 7;
  return { pts: scRound(max * SC_ABS_PCT[Math.min(days, 6)]), max };
}
// 봉사활동(20점): 1·2·3학년 3년간 시간 합계. 15시간 이상 20점, 시간이 1 줄 때마다 1점씩 줄고 7시간 이하는 12점
function scVolunteer(hours) { const h = Math.floor(hours); return { pts: h >= 15 ? 20 : h <= 7 ? 12 : 5 + h, max: 20 }; }
// 학교활동(10점): 기본 8점 + 교내 수상(학기당 1개 0.5점) + 학생회장·부회장·학급회장·부회장(월 0.1점). 기본점수 뺀 점수는 2점까지
function scActivity(awardSems, months) { return { pts: scRound(8 + Math.min(2, 0.5 * Math.max(0, awardSems || 0) + 0.1 * Math.max(0, months || 0))), max: 10 }; }
// 입력한 출결·봉사·학교활동 점수 목록. etc = { abs1, late1, abs2, late2, abs3, late3, vol, award, council } (비워 둔 것은 빼요)
function scEtc(etc) {
  const e = etc || {}, has = k => e[k] !== undefined && e[k] !== '' && !isNaN(e[k]), out = [];
  let ap = 0, am = 0;
  [1, 2, 3].forEach(g => { if (has('abs' + g) || has('late' + g)) { const r = scAbsence(g, Number(e['abs' + g]), Number(e['late' + g])); ap += r.pts; am += r.max; } });
  if (am) out.push({ name: '출결', pts: scRound(ap), max: am });
  if (has('vol')) out.push(Object.assign({ name: '봉사활동' }, scVolunteer(Number(e.vol))));
  if (has('award') || has('council')) out.push(Object.assign({ name: '학교활동' }, scActivity(Number(e.award), Number(e.council))));
  return out;
}
// 저장된 점수(store.score.sem)에서 전체 계산
function scTotal(sem, etc) {
  const out = { sems: {}, art: null, etc: scEtc(etc), total: 0, max: 0 };
  const artList = [];
  SC_SEMS.forEach(m => {
    const d = (sem && sem[m]) || {};
    const rows = SC_MAIN.map(s => d[s]).filter(v => v && typeof v === 'object' && v.s !== undefined)
      .map(v => ({ s: Number(v.s), a: v.a || scAch(Number(v.s)) }));
    const r = scSemester(m, rows);
    if (r) { out.sems[m] = r; out.total += r.pts; out.max += r.max; }
    SC_ART.forEach(s => { if (SC_PT[d[s]] && 'ABC'.includes(d[s])) artList.push(d[s]); });
  });
  out.art = scArt(artList);
  if (out.art) { out.total += out.art.pts; out.max += 30; }
  out.etc.forEach(r => { out.total += r.pts; out.max += r.max; });
  out.total = scRound(out.total);
  return out;
}

// 국제고 1단계 영어 점수 (160점 만점): 2학년 1학기~3학년 2학기, 학기마다 성취도 A40·B36·C32·D28·E24 (서울·부산·세종 국제고 요강, 경기도 기본계획)
const SC_ENG_SEMS = ['2-1', '2-2', '3-1', '3-2'];
const SC_ENG_PT = { A: 40, B: 36, C: 32, D: 28, E: 24 };
function scIntl(sem) {
  const rows = [];
  SC_ENG_SEMS.forEach(m => {
    const v = sem && sem[m] && sem[m]['영어'];
    if (!v || typeof v !== 'object' || v.s === undefined) return;
    const g = v.a || scAch(Number(v.s));
    if (SC_ENG_PT[g]) rows.push({ m, g, pts: SC_ENG_PT[g] });
  });
  return { rows, total: rows.reduce((t, r) => t + r.pts, 0), max: rows.length * 40 };
}

// 안산동산고(자사고) 1단계 교과 점수 (250점 만점): 2학년 1·2학기 각 50점, 3학년 1·2학기 각 65점(일반교과, 성취도 A5~E1 평균 × 학기 비중 ÷ 2), 체육·예술 20점, 출결 미인정 결석 1일 -0.1점(최대 -0.5)
// 학교 2027학년도 입학전형요항과 학교의 내신성적 산출 엑셀 기준
const SC_AS_W = { '2-1': 20, '2-2': 20, '3-1': 26, '3-2': 26 };   // 학기 비중(%) → 만점 = 비중 × 2.5
function scAnsan(sem, etc) {
  const rows = [];
  let artSum = 0, artN = 0;
  Object.keys(SC_AS_W).forEach(m => {
    const d = (sem && sem[m]) || {};
    const grades = SC_MAIN.map(s => d[s]).filter(v => v && typeof v === 'object' && v.s !== undefined).map(v => SC_PT[v.a || scAch(Number(v.s))]).filter(Boolean);
    if (grades.length) rows.push({ m, pts: scRound(grades.reduce((t, g) => t + g, 0) / grades.length * SC_AS_W[m] / 2), max: SC_AS_W[m] * 2.5 });
    SC_ART.forEach(s => { const g = d[s]; if (g === 'A' || g === 'B' || g === 'C') { artSum += g === 'A' ? 3 : g === 'B' ? 2 : 1; artN++; } });
  });
  const art = artN ? { pts: scRound(artSum / artN * 8 * 5 / 6), max: 20 } : null;
  const e = etc || {}, num = k => (e[k] !== undefined && e[k] !== '' && !isNaN(e[k]) ? Number(e[k]) : null);
  let att = null;
  if (['abs2', 'abs3', 'late2', 'late3'].some(k => num(k) !== null)) {
    const days = Math.max(0, Math.floor((num('abs2') || 0) + (num('abs3') || 0))) + Math.floor(Math.max(0, (num('late2') || 0) + (num('late3') || 0)) / 3);
    att = { days, pts: -Math.min(0.5, scRound(days * 0.1)) };
  }
  const total = scRound(rows.reduce((t, r) => t + r.pts, 0) + (art ? art.pts : 0) + (att ? att.pts : 0));
  return { rows, art, att, total, max: rows.reduce((t, r) => t + r.max, 0) + (art ? 20 : 0) };
}
