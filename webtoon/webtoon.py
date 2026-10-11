#!/usr/bin/env python3
"""직장맘 웹툰 파이프라인: prompts -> (이미지 준비) -> compose"""
import argparse, json, os, sys, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
W, H = 1080, 1350
FONT_CANDIDATES = [
    os.environ.get("WEBTOON_FONT", ""),
    str(ROOT / "fonts" / "font.ttf"),
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "C:/Windows/Fonts/malgunbd.ttf",
]


def font(size):
    for p in FONT_CANDIDATES:
        if p and Path(p).exists():
            return ImageFont.truetype(p, size)
    sys.exit("한글 폰트를 찾을 수 없습니다. webtoon/fonts/font.ttf 에 나눔고딕 등을 넣으세요.")


def load(ep):
    return json.loads((ROOT / "episodes" / f"{ep}.json").read_text(encoding="utf-8"))


def cmd_prompts(a):
    chars = json.loads((ROOT / "characters.json").read_text(encoding="utf-8"))
    ep = load(a.episode)
    out = [f"# {ep['title']} - Gemini용 컷 프롬프트\n",
           "같은 대화창에서 1컷부터 순서대로 붙여넣고, 결과를 images/{ep}/01.png ... 으로 저장하세요.\n".replace("{ep}", a.episode),
           "먼저 캐릭터 시트를 요청하세요:\n"]
    cast = "\n".join(f"- {k}: {v}" for k, v in chars["characters"].items())
    out.append(f"```\nCreate a character reference sheet.\nStyle: {chars['style']}\n{cast}\n```\n")
    for i, c in enumerate(ep["cuts"], 1):
        out.append(f"## {i}컷\n```\nSame characters as the reference sheet, same style. Portrait 4:5. {c['scene']}. {chars['style']}\n```\n")
    p = ROOT / "out" / f"{a.episode}_prompts.md"
    p.parent.mkdir(exist_ok=True)
    p.write_text("\n".join(out), encoding="utf-8")
    print(p)


def cmd_placeholder(a):
    ep = load(a.episode)
    d = ROOT / "images" / a.episode
    d.mkdir(parents=True, exist_ok=True)
    for i, c in enumerate(ep["cuts"], 1):
        im = Image.new("RGB", (W, H), (250, 240, 230 - i * 8))
        ImageDraw.Draw(im).text((60, H - 140), f"CUT {i}", fill=(150, 130, 110), font=font(36))
        im.save(d / f"{i:02d}.png")
    print(d)


def gemini(parts, ratio):
    import base64, urllib.request
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("GEMINI_API_KEY 환경변수가 없습니다.")
    model = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["TEXT", "IMAGE"], "imageConfig": {"aspectRatio": ratio}}}
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        json.dumps(body).encode(), {"Content-Type": "application/json", "x-goog-api-key": key})
    with urllib.request.urlopen(req, timeout=180) as r:
        res = json.load(r)
    for p in res["candidates"][0]["content"]["parts"]:
        d = p.get("inlineData") or p.get("inline_data")
        if d:
            return base64.b64decode(d["data"])
    sys.exit("이미지가 반환되지 않았습니다: " + json.dumps(res, ensure_ascii=False)[:500])


def ref_part(path):
    import base64
    return {"inlineData": {"mimeType": "image/png", "data": base64.b64encode(Path(path).read_bytes()).decode()}}


def cmd_sheet(a):
    chars = json.loads((ROOT / "characters.json").read_text(encoding="utf-8"))
    cast = "\n".join(f"- {k}: {v}" for k, v in chars["characters"].items())
    prompt = (f"Create a character reference sheet for a Korean family webtoon. Style: {chars['style']}. "
              f"Simple white background. Show each character full-body, standing, front view, side by side with even spacing:\n{cast}")
    out = ROOT / "characters" / "sheet.png"
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(gemini([{"text": prompt}], "16:9"))
    print(out)


def cmd_draw(a):
    chars = json.loads((ROOT / "characters.json").read_text(encoding="utf-8"))
    ep = load(a.episode)
    sheet = ROOT / "characters" / "sheet.png"
    if not sheet.exists():
        sys.exit("먼저 `webtoon.py sheet` 로 캐릭터 시트를 만들고 확정하세요.")
    d = ROOT / "images" / a.episode
    d.mkdir(parents=True, exist_ok=True)
    for i, c in enumerate(ep["cuts"], 1):
        f = d / f"{i:02d}.png"
        if f.exists() and not a.force:
            continue
        prompt = (f"Using the attached character reference sheet, draw this scene with the exact same characters and style. "
                  f"Scene: {c['scene']}. {chars['style']}")
        f.write_bytes(gemini([ref_part(sheet), {"text": prompt}], "4:5"))
        print(f)


def wrap(draw, text, f, maxw):
    lines, cur = [], ""
    for ch in text:
        if draw.textlength(cur + ch, font=f) > maxw and cur:
            lines.append(cur); cur = ch
        else:
            cur += ch
    return lines + [cur]


def bubble(im, text, who, idx, total):
    d = ImageDraw.Draw(im)
    f = font(46)
    lines = wrap(d, f"{text}", f, 620)
    lh = 64
    bw = max(d.textlength(l, font=f) for l in lines) + 70
    bh = len(lines) * lh + 40
    x = 70 + (idx % 2) * (W - bw - 140)
    y = 90 + idx * (bh + 40)
    d.rounded_rectangle([x, y, x + bw, y + bh], 40, fill="white", outline=(60, 60, 60), width=5)
    tx = x + bw // 2
    d.polygon([(tx - 20, y + bh - 3), (tx + 20, y + bh - 3), (tx, y + bh + 40)], fill="white", outline=(60, 60, 60))
    d.line([(tx - 17, y + bh), (tx + 17, y + bh)], fill="white", width=8)
    for k, l in enumerate(lines):
        d.text((x + 35, y + 20 + k * lh), l, fill=(30, 30, 30), font=f)
    d.text((x + 12, y - 38), who, fill=(90, 90, 90), font=font(30))


def fit(img):
    img = img.convert("RGB")
    s = max(W / img.width, H / img.height)
    img = img.resize((int(img.width * s), int(img.height * s)))
    l, t = (img.width - W) // 2, (img.height - H) // 2
    return img.crop((l, t, l + W, t + H))


def cover(title):
    im = Image.new("RGB", (W, H), (255, 236, 214))
    d = ImageDraw.Draw(im)
    f = font(96)
    y = 480
    for l in wrap(d, title, f, 900):
        d.text(((W - d.textlength(l, font=f)) / 2, y), l, fill=(90, 60, 40), font=f); y += 130
    sub = "40대 직장맘의 아들둘 육아일기"
    d.text(((W - d.textlength(sub, font=font(44))) / 2, y + 40), sub, fill=(150, 110, 80), font=font(44))
    return im


def cmd_compose(a):
    ep = load(a.episode)
    src = ROOT / "images" / a.episode
    out = ROOT / "out" / a.episode
    out.mkdir(parents=True, exist_ok=True)
    cover(ep["title"]).save(out / "00_cover.png")
    for i, c in enumerate(ep["cuts"], 1):
        f = next((src / f"{i:02d}{e}" for e in (".png", ".jpg", ".jpeg", ".webp") if (src / f"{i:02d}{e}").exists()), None)
        if not f:
            sys.exit(f"이미지 없음: {src}/{i:02d}.png (placeholder 명령으로 임시 이미지 생성 가능)")
        im = fit(Image.open(f))
        for k, b in enumerate(c["bubbles"]):
            bubble(im, b["text"], b["who"], k, len(c["bubbles"]))
        im.save(out / f"{i:02d}.png")
    (out / "caption.txt").write_text(ep["caption"], encoding="utf-8")
    print(out)


p = argparse.ArgumentParser(description=__doc__)
sp = p.add_subparsers(required=True)
for name, fn in (("prompts", cmd_prompts), ("placeholder", cmd_placeholder), ("compose", cmd_compose)):
    s = sp.add_parser(name); s.add_argument("episode"); s.set_defaults(fn=fn)
s = sp.add_parser("sheet"); s.set_defaults(fn=cmd_sheet)
s = sp.add_parser("draw"); s.add_argument("episode"); s.add_argument("--force", action="store_true"); s.set_defaults(fn=cmd_draw)
a = p.parse_args()
a.fn(a)
