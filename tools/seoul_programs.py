"""체험 레이더 후보: 서울열린데이터광장 '공공서비스예약' (교육강좌·문화체험) 중
지금 접수 중이고 초등·중등 대상으로 보이는 것을 마감 빠른 순으로 모은다.
인증키는 저장소 밖 파일에서 읽는다 (저장소에 올리지 않는다).
사용: python tools/seoul_programs.py [키파일] [출력.html]
출처 표시: 서울 열린데이터광장(공공서비스예약)
"""
import sys, json, html, re, urllib.request
from datetime import datetime

KEY_FILE = sys.argv[1] if len(sys.argv) > 1 else r"C:\JINI\블로그샘플\seoul_key.txt"
OUT = sys.argv[2] if len(sys.argv) > 2 else "seoul_programs.html"
SERVICES = ["ListPublicReservationEducation", "ListPublicReservationCulture"]
LEVEL_WORDS = {
    "초등": ["초등", "어린이", "유아·어린이", "초1", "초2", "초3", "초4", "초5", "초6", "초 1", "초 2", "초 3", "초 4", "초 5", "초 6"],
    "중등": ["중학", "중등", "청소년", "중1", "중2", "중3"],
}
EXCLUDE_TGT = ["성인", "일반 성인", "어르신", "노인", "교사", "교원"]

def get(key, svc):
    rows, start = [], 1
    while True:
        url = f"http://openapi.seoul.go.kr:8088/{key}/json/{svc}/{start}/{start+999}/"
        with urllib.request.urlopen(url, timeout=60) as r:
            d = json.load(r)
        if svc not in d:
            break
        rows += d[svc]["row"]
        if len(rows) >= d[svc]["list_total_count"]:
            break
        start += 1000
    return rows

def level_of(t):
    got = [lv for lv, ws in LEVEL_WORDS.items() if any(w in t for w in ws)]
    return "·".join(got)

def d(s):
    return datetime.strptime(s[:10], "%Y-%m-%d")

def main():
    key = open(KEY_FILE, encoding="utf-8").read().strip()
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    out, seen = [], set()
    for svc in SERVICES:
        for r in get(key, svc):
            tgt = html.unescape(r.get("USETGTINFO", "")).strip()
            lv = level_of(tgt)
            if r["SVCID"] in seen or not lv or r["SVCSTATNM"] != "접수중":
                continue
            if any(w in tgt for w in EXCLUDE_TGT) and "초등" not in tgt and "청소년" not in tgt and "중학" not in tgt:
                continue
            end = d(r["RCPTENDDT"])
            if end < today:
                continue
            seen.add(r["SVCID"])
            out.append((end, lv, r, tgt))
    out.sort(key=lambda x: x[0])
    p = ["<meta charset='utf-8'><title>서울 체험 후보</title><body style='font-family:Malgun Gothic;max-width:860px;margin:20px auto;line-height:1.6'>",
         f"<h1>서울 체험·교육 후보 ({datetime.now():%Y-%m-%d})</h1>",
         f"<p>접수중이고 초등·중등 대상으로 보이는 {len(out)}건, 마감 빠른 순. 대상·기간은 반드시 원문 링크에서 확인하세요. 출처: 서울 열린데이터광장(공공서비스예약)</p>"]
    for i, (end, lv, r, tgt) in enumerate(out, 1):
        t = html.escape(html.unescape(r["SVCNM"]))
        p.append(f"<p><b>{i}.</b> <a href='{html.escape(r['SVCURL'])}' target='_blank'>{t}</a><br>"
                 f"<small>[{lv}] {html.escape(r['PLACENM'])}({html.escape(r['AREANM'])}) · {html.escape(r['PAYATNM'])} · 대상: {html.escape(tgt)}<br>"
                 f"접수 {r['RCPTBGNDT'][:10]} ~ <b>{r['RCPTENDDT'][:10]}</b> · 진행 {r['SVCOPNBGNDT'][:10]} ~ {r['SVCOPNENDDT'][:10]}</small></p>")
    open(OUT, "w", encoding="utf-8").write("\n".join(p))
    print(len(out), "건 ->", OUT)

if __name__ == "__main__":
    main()
