// 질문 자료. 질문을 추가·수정할 땐 여기만 고쳐요. 화면은 모든 질문을 같은 모양으로 그려요.
//   id, group(묶음), icon, color(타일 색), title(제목)
//   oneLine(r)  : 한 줄 답. r = 고른 지역(없으면 null)
//   regional(r) : "우리 지역 기준" 글. 지역을 골랐을 때만 나와요. 없으면 null
//   detail      : [{t:제목, body:글}] 자세히 보기
//   next        : 이어서 볼 질문 id
//   ready:false 이면 "준비 중" 화면
//   noRegion:true 이면 지역 정보(사는 곳 줄)를 보여 주지 않는 전국 공통 화면
// ※ 뼈대 단계의 글은 모양을 보여 주기 위한 예시예요.
const QUESTIONS = [
  { id: 'kinds', group: 'type', icon: '🏫', color: 't1', title: '어떤 학교가 있어요?', sub: '종류 한눈에', view: 'kinds', noRegion: true,
    oneLine: () => `고등학교에는 이런 <b>종류</b>가 있어요. 누르면 자세한 설명이 나와요.`,
    next: ['select'] },

  { id: 'where', group: 'area', icon: '📍', color: 't2', title: '우리 동네는 어디 가요?', sub: '지원 가능 학교',
    oneLine: r => r
      ? `${r.label}에 살면 <b>일반고는 내가 사는 지역 안</b>에서 고르고, <b>특목·자사·영재</b> 중에는 우리 지역 학생이 지원할 수 있는 학교만 골라 볼 수 있어요.`
      : `<b>사는 곳에 따라 지원할 수 있는 학교가 달라요.</b> 위에서 사는 곳을 고르면 내 기준으로 알려 드려요.`,
    regional: r => {
      const c = regionCounts(r);
      return c ? { counts: c, note: `${c.scope}에 있는 학교 수예요. 특별한 학교(특목·자사·영재)는 우리 지역 학생이 지원할 수 있는 학교 수예요. (${COUNTS_ASOF} 자료)` }
        : { note: '이 지역 자료는 아직 준비 중이에요.' };
    },
    detail: [
      { t: '학교 목록 보기', body: '준비 중이에요. (2단계에서 학교 자료를 연결해요)' },
      { t: '지원할 수 없는 학교는?', body: '준비 중이에요.' },
      { t: '근거와 확인 수준', body: '준비 중이에요.' },
    ],
    next: ['select', 'when'] },
  { id: 'assign', group: 'area', icon: '🧭', color: 't2', title: '우리 동네 일반고는 어떻게 배정돼요?',
    ready: false, next: ['where'] },

  { id: 'select', group: 'how', icon: '📝', color: 't3', title: '어떻게 뽑아요?', sub: '배정·선발 방법', noRegion: true, view: 'selectKinds',
    oneLine: () => `학교 종류에 따라 <b>뽑는 방법</b>이 달라요. 누르면 자세한 설명이 나와요.`, next: ['when'] },
  { id: 'when', group: 'how', icon: '📅', color: 't4', title: '원서는 언제 내요?', sub: '일정 한눈에', noRegion: true, view: 'scheduleFlow',
    oneLine: () => `학교 종류에 따라 원서 내는 때가 달라요. <b>전기 학교는 먼저, 후기 학교는 12월 초</b>에 원서를 받아요.`, next: ['select'] },
  { id: 'grade', group: 'how', icon: '📊', color: 't1', title: '성적(내신)은 어떻게 쓰이나요?',
    oneLine: () => '학교 종류에 따라 <b>성적이 쓰이는 방식이 달라요.</b> (뼈대용 예시 글)',
    cta: { label: '✍️ 내 성적 넣어 보기', href: '#/mine' },
    detail: [{ t: '일반고는?', body: '준비 중이에요.' }, { t: '특목·자사고는?', body: '준비 중이에요.' }],
    next: ['select'] },

  { id: 'rumor', group: 'check', icon: '🔎', color: 't3', title: '마이스터고가 대입에 유리하다는데 사실인가요?',
    ready: false, next: ['kinds'] },
];

function findQuestion(id) { return QUESTIONS.find(q => q.id === id); }
