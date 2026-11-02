// 지역 자료. 시·도 이름은 여기, 시·군·구 목록과 학교 수는 data/counts.js(자동 생성)에서 와요.
const REGIONS = {
  seoul: { name: '서울' }, busan: { name: '부산' }, daegu: { name: '대구' }, incheon: { name: '인천' },
  gwangju: { name: '광주' }, daejeon: { name: '대전' }, ulsan: { name: '울산' }, sejong: { name: '세종' },
  gg: { name: '경기' }, gangwon: { name: '강원' }, chungbuk: { name: '충북' }, chungnam: { name: '충남' },
  jeonbuk: { name: '전북' }, jeonnam: { name: '전남' }, gyeongbuk: { name: '경북' }, gyeongnam: { name: '경남' },
  jeju: { name: '제주' },
};
Object.keys(REGIONS).forEach(id => {
  const c = COUNTS[id];
  REGIONS[id].sigun = c && Object.keys(c.sigun).length ? Object.keys(c.sigun) : null; // 고를 시·군·구 목록(없으면 시·도만)
});

// 고른 지역의 학교 수. r = store.region. 시·군·구까지 골랐으면 그 숫자, 아니면 시·도 전체
//   c = 분류별 수, t = 나이스 유형별 수, open = 지원 가능한 특목·자사·영재 수(시·도 기준)
function regionCounts(r) {
  const a = r && COUNTS[r.area];
  if (!a) return null;
  const own = r.sigun && a.sigun[r.sigun];
  const e = own || a;
  const sum = ks => ks.reduce((n, k) => n + (e.c[k] || 0), 0);
  return { c: e.c, t: e.t, open: a.open, scope: own ? r.sigun : REGIONS[r.area].name,
    areaSum: ks => ks.reduce((n, k) => n + (a.c[k] || 0), 0), // 시·도 전체 기준(시·군·구 단위가 의미 없는 분류용)
    general: sum(['gen']), vocational: sum(['voc', 'm_it', 'm_mach', 'm_energy', 'm_marine', 'm_bio']), sum };
}
