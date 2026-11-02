// 저장: 이 폰(브라우저)에만 저장돼요.
const STORE_KEY = 'gdd-v1';
const store = {
  data: { region: null, score: { grade: '', subj: {}, sem: {} }, cands: [] }, // cands = 내 후보 학교 [{ r:'seoul', n:'하나고등학교', t:'자사고', s:'은평구' }] // region = { key:'gg', sigun:'부천시', label:'경기 부천시' }
  get score() { return this.data.score; },
  // 학기별 성취도: sem = { '1-1': { 국어: 'A', ... } }
  setAch(sem, subject, v) {
    const s = this.data.score.sem = this.data.score.sem || {};
    s[sem] = s[sem] || {};
    if (v === '') delete s[sem][subject]; else s[sem][subject] = v;
    this.save();
  },
  // 학기별 점수 한 칸: 일반교과 { s: 원점수, a: 성취도(직접 고른 경우) }, 체육·예술은 'A'|'B'|'C'. 비우면 지워요
  setSub(sem, subject, v) {
    const s = this.data.score.sem = this.data.score.sem || {};
    s[sem] = s[sem] || {};
    if (v === undefined || v === '' || v === null) delete s[sem][subject]; else s[sem][subject] = v;
    this.save();
  },
  // 출결·봉사·학교활동 입력 한 칸 (비우면 지워요)
  setEtc(key, v) {
    const e = this.data.score.etc = this.data.score.etc || {};
    if (v === '' || v === undefined) delete e[key]; else e[key] = Number(v);
    this.save();
  },
  // 내 후보 학교 담기·빼기
  hasCand(r, n) { return this.data.cands.some(c => c.r === r && c.n === n); },
  toggleCand(c) {
    const i = this.data.cands.findIndex(x => x.r === c.r && x.n === c.n);
    if (i >= 0) this.data.cands.splice(i, 1); else this.data.cands.push(c);
    this.save();
    return i < 0; // 담았으면 true
  },
  setGrade(g) { this.data.score.grade = g; this.save(); },
  setScore(subject, v) { if (v === '') delete this.data.score.subj[subject]; else this.data.score.subj[subject] = Number(v); this.save(); },
  load() {
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(STORE_KEY)) || {}); } catch (e) { /* 저장소를 못 써도 앱은 돼요 */ }
    if (!Array.isArray(this.data.cands)) this.data.cands = [];
    if (!this.data.score.sem) this.data.score.sem = {};
  },
  save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { /* 무시 */ } },
  get region() { return this.data.region; },
  setRegion(key, sigun) {
    const name = REGIONS[key].name;
    this.data.region = { key: key + (sigun ? ':' + sigun : ''), area: key, sigun: sigun || '', label: name + (sigun ? ' ' + sigun : '') };
    this.save();
  },
  clearRegion() { this.data.region = null; this.save(); },
};
store.load();
