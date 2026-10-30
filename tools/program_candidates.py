"""체험 레이더 후보 모으기 (초등·중등 체험·교육 프로그램 모집 소식).
제목·출처·링크만 모은다. 올리기 전에는 반드시 공고문 원문과 대조한다.
사용: python tools/program_candidates.py [출력파일.html]
"""
import sys, os, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from datetime import datetime
import news_candidates as nc

QUERIES = {
    "영재·과학·수학": "영재교육원 모집",
    "초등 체험·캠프": "초등학생 체험 참가자 모집",
    "중등 체험·진로": "중학생 체험 참가 신청",
    "과학관·박물관": "과학관 어린이 프로그램 신청",
    "교육청·공공기관": "교육지원청 학생 프로그램 모집",
}
MUST = ["모집", "신청", "접수", "참가", "참여", "선발"]
EXCLUDE = ["학원", "선착순", "특강", "할인", "체험단", "입사생", "대학원", "교원", "교사 대상", "직무연수"]
nc.DAYS = 14

def main(out):
    seen, rows = set(), []
    for label, q in QUERIES.items():
        n = 0
        for date, title, src, link in nc.fetch(q):
            if title in seen or any(w in title for w in EXCLUDE) or not any(w in title for w in MUST):
                continue
            seen.add(title); rows.append((label, date, title, src, link)); n += 1
            if n >= 10: break
    parts = ["<meta charset='utf-8'><title>체험 레이더 후보</title><body style='font-family:Malgun Gothic;max-width:820px;margin:20px auto;line-height:1.6'>",
             f"<h1>체험 레이더 후보 ({datetime.now():%Y-%m-%d})</h1><p>최근 {nc.DAYS}일, 제목·출처·링크만. 신청 기간·대상은 공고문 원문에서 직접 확인해야 합니다.</p>"]
    cur, no = None, 0
    for label, date, title, src, link in rows:
        if label != cur: parts.append(f"<h2>{html.escape(label)}</h2>"); cur = label
        no += 1
        parts.append(f"<p><b>{no}.</b> <a href='{html.escape(link)}' target='_blank'>{html.escape(title)}</a> <small>· {html.escape(src)} · {date:%m.%d}</small></p>")
    open(out, "w", encoding="utf-8").write("\n".join(parts))
    print(no, "건 ->", out)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "program_candidates.html")
