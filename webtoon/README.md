# 직장맘 웹툰 파이프라인

1. `python3 webtoon.py prompts ep001` → `out/ep001_prompts.md` (Gemini에 붙여넣을 캐릭터시트 + 컷 프롬프트)
2. Gemini 앱에서 그린 그림을 `images/ep001/01.png ~ 05.png` 로 저장 (테스트: `python3 webtoon.py placeholder ep001`)
3. `python3 webtoon.py compose ep001` → `out/ep001/` (표지 + 컷별 말풍선 합성 1080x1350 + caption.txt)
4. 결과를 폰으로 옮겨 인스타 앱에서 캐러셀로 업로드

새 에피소드: `episodes/ep002.json` 을 ep001.json 형식으로 추가.
캐릭터 외형: `characters.json`. 한글 폰트는 `fonts/font.ttf`(예: 나눔고딕) 또는 `WEBTOON_FONT` 환경변수.
