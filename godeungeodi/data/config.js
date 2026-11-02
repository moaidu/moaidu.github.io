// 앱 전체 설정: 이름, 아래 메뉴, 질문 묶음. 메뉴나 이름을 바꿀 땐 여기만 고쳐요.
const CONFIG = {
  name: '고등어디',
  tagline: '고등학교, 어디 갈까요?',
  // 아래 메뉴 (route = 주소)
  nav: [
    { route: '/', icon: 'q', label: '용어 풀이' },
    { route: '/schools', icon: 'school', label: '학교 찾기' },
    { route: '/mine', icon: 'mine', label: '내 정리' },
  ],
  // 질문 묶음(홈 아래쪽 목록에 이 순서로 나와요)
  groups: [
    { id: 'type', label: '학교 종류' },
    { id: 'area', label: '우리 지역' },
    { id: 'how', label: '뽑는 방법과 때' },
    { id: 'check', label: '소문 확인' },
  ],
  // 지역을 고른 홈의 큰 타일 4개(질문 id)
  tiles: ['kinds', 'where', 'select', 'when'],
};

// 내 성적: 고입에 쓰는 중학교 학기(학년-학기)와 성취도. 학년을 고르면 그 학년까지 지난 학기가 열려요
const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1'];
const OPEN_SEMESTERS = { '중1': ['1-1', '1-2'], '중2': ['1-1', '1-2', '2-1', '2-2'], '중3': ['1-1', '1-2', '2-1', '2-2', '3-1'] };
const ACHIEVE = ['A', 'B', 'C', 'D', 'E'];
// 내 성적 입력 칸에 나오는 과목 (내 정리 화면)
const SUBJECTS = ['국어', '영어', '수학', '사회', '과학'];
