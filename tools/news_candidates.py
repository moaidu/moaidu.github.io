"""교육 레이더 뉴스 후보 모으기.
구글 뉴스 검색 RSS에서 키워드별로 최근 기사 제목·출처·링크만 가져와 후보 목록(HTML)을 만든다.
기사 본문은 가져오지 않는다. 사용: python tools/news_candidates.py
"""
import sys, io, html, urllib.request, urllib.parse, xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone, timedelta

KEYWORDS = {
    "초등 수학": "초등 수학",
    "서술형·사고력": "서술형 평가 수학",
    "교육과정": "교육과정 개정 수학",
    "에듀테크·AI": "AI 교육 에듀테크 초등",
}
DAYS = 7
# 학원 홍보·모집 공고성 기사는 후보에서 뺀다
EXCLUDE = ["학원", "선착순", "특강", "모집", "출간", "설명회", "신입생", "접수", "할인", "체험단"]
PER_KEYWORD = 8

def fetch(query):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": f"{query} when:{DAYS}d", "hl": "ko", "gl": "KR", "ceid": "KR:ko"})
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        root = ET.fromstring(r.read())
    items = []
    for it in root.iter("item"):
        title = it.findtext("title", "")
        src = it.findtext("source", "")
        if src and title.endswith(" - " + src):
            title = title[: -len(src) - 3]
        date = parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone(timedelta(hours=9)))
        items.append((date, title, src, it.findtext("link", "")))
    items.sort(reverse=True)
    return items

def main(out_path):
    seen, rows = set(), []
    for label, q in KEYWORDS.items():
        n = 0
        for date, title, src, link in fetch(q):
            if title in seen or any(w in title for w in EXCLUDE):
                continue
            seen.add(title)
            rows.append((label, date, title, src, link))
            n += 1
            if n >= PER_KEYWORD:
                break
    parts = ["<meta charset='utf-8'><title>교육 레이더 후보</title><body style='font-family:Malgun Gothic;max-width:820px;margin:20px auto;line-height:1.6'>",
             f"<h1>교육 레이더 후보 ({datetime.now().strftime('%Y-%m-%d')})</h1><p>최근 {DAYS}일, 제목·출처·링크만. 올릴 기사 번호를 알려 주세요.</p>"]
    cur, no = None, 0
    for label, date, title, src, link in rows:
        if label != cur:
            parts.append(f"<h2>{html.escape(label)}</h2>"); cur = label
        no += 1
        parts.append(f"<p><b>{no}.</b> <a href='{html.escape(link)}' target='_blank'>{html.escape(title)}</a> <small>· {html.escape(src)} · {date:%m.%d}</small></p>")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print(f"{no}건 -> {out_path}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "news_candidates.html")
