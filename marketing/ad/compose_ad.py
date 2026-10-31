"""Composite the 15 s Slice Empire promo from raw footage (record.py) into frames + audio, then encode.

Usage: python3 compose_ad.py <raw_dir> <out.mp4>
"""
import json, os, subprocess, sys, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAW, OUT_MP4 = sys.argv[1], sys.argv[2]
FPS, W, H = 30, 1080, 1920
TMP = "frames"
shutil.rmtree(TMP, ignore_errors=True); os.makedirs(TMP)
HERE = os.path.dirname(os.path.abspath(__file__))
BOLD = os.path.join(HERE, "Fredoka_700Bold.ttf")
SEMI = os.path.join(HERE, "Fredoka_600SemiBold.ttf")
INK, CREAM, RED, BASIL, GOLD = (74, 42, 26), (255, 244, 220), (217, 68, 58), (46, 139, 62), (246, 195, 67)

taps = json.load(open(os.path.join(RAW, "taps.json")))

# ---- edit decision list: (segment, first raw frame, frame count, caption) ----
EDL = [
    ("kitchen", 0, 69, "Tap. Bake. Serve."),
    ("kitchen", 69, 69, "Every pizza = cash!"),
    ("busy", 6, 114, "Hire a crew. Watch it run."),
    ("tour-uptown", 4, 24, "6 pizzerias. One city."),
    ("tour-waterfront", 4, 24, "6 pizzerias. One city."),
    ("tour-suburbs", 4, 24, "6 pizzerias. One city."),
    ("city", 4, 30, "Build your pizza empire."),
]
END_FRAMES = 450 - sum(n for _, _, n, _ in EDL)   # end card fills to exactly 15.0 s
XFADE = 3                                          # crossfade frames into each new segment

def font(path, size):
    return ImageFont.truetype(path, size)

def caption_card(text, t):
    """Cream pill with a brown outline, like the in-game tutorial card. Pops in over the first 6 frames."""
    f = font(BOLD, 84)
    tw = f.getlength(text)
    pw, ph = int(tw + 110), 150
    card = Image.new("RGBA", (pw + 20, ph + 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((10, 18, pw + 10, ph + 18), 44, fill=(0, 0, 0, 90))            # shadow
    d.rounded_rectangle((10, 6, pw + 10, ph + 6), 44, fill=CREAM, outline=INK, width=8)
    d.text(((pw + 20) / 2, ph / 2 + 6), text, font=f, fill=INK, anchor="mm")
    s = min(1.0, 0.6 + 0.4 * t / 6) if t < 6 else 1.0
    s = s * (1.0 + 0.06 * max(0, 1 - abs(t - 4) / 2)) if t < 8 else s     # small overshoot
    if s != 1.0:
        card = card.resize((max(1, int(card.width * s)), max(1, int(card.height * s))), Image.LANCZOS)
    return card

def tap_marks(img, seg, raw_f):
    """White ripple + fingertip dot for 10 frames after each tap."""
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for tp in taps:
        if tp["seg"] != seg:
            continue
        age = raw_f - tp["frame"]
        if 0 <= age < 10:
            r = 34 + age * 7
            a = int(230 * (1 - age / 10))
            x, y = tp["x"], tp["y"]
            d.ellipse((x - r, y - r, x + r, y + r), outline=(255, 255, 255, a), width=9)
            if age < 6:
                d.ellipse((x - 24, y - 24, x + 24, y + 24), fill=(255, 255, 255, 200), outline=(*INK, 220), width=4)
    return Image.alpha_composite(img, ov)

def place_caption(img, text, t):
    c = caption_card(text, t)
    img.alpha_composite(c, (int((W - c.width) / 2), int(1745 - c.height / 2)))

def load(seg, f):
    return Image.open(os.path.join(RAW, seg, f"f{f:04d}.png")).convert("RGBA").resize((W, H))

out_i = 0
def emit(img):
    global out_i
    img.convert("RGB").save(os.path.join(TMP, f"o{out_i:04d}.png"), compress_level=1)
    out_i += 1

prev_last, prev_caption, cap_t = None, None, 0
for seg, first, n, cap in EDL:
    if cap != prev_caption:
        cap_t = 0
    for k in range(n):
        raw_f = first + k
        img = tap_marks(load(seg, raw_f), seg, raw_f)
        if prev_last is not None and k < XFADE and seg != "kitchen":
            img = Image.blend(prev_last, img, (k + 1) / (XFADE + 1))
        frame = img.copy()
        place_caption(frame, cap, cap_t)
        emit(frame)
        cap_t += 1
        last = img
    prev_last, prev_caption = last, cap

# ---- end card: the title card's logo frame, slow push-in, CTA ----
title = Image.open(os.path.join(RAW, "title", "f0002.png")).convert("RGBA").resize((W, H))
# hide the in-game "Tap to start" line; the CTA replaces it
bg = title.getpixel((40, 300))
d = ImageDraw.Draw(title)
d.rectangle((0, 1760, W, H), fill=bg)             # drop the in-game "Tap to start"
lifted = Image.new("RGBA", (W, H), bg)
lifted.paste(title.crop((0, 220, W, H)), (0, 0))  # lift the card so Nonna clears the CTA
title = lifted
d = ImageDraw.Draw(title)
d.rectangle((0, 1548, W, H), fill=(184, 53, 44))           # footer panel behind the CTA (hides the seam)
d.rectangle((0, 1540, W, 1548), fill=(150, 40, 34))
for k in range(END_FRAMES):
    s = 1.0 + 0.05 * k / END_FRAMES
    big = title.resize((int(W * s), int(H * s)), Image.LANCZOS)
    x0, y0 = (big.width - W) // 2, int((big.height - H) * 0.35)
    frame = big.crop((x0, y0, x0 + W, y0 + H))
    if k < XFADE + 2:
        frame = Image.blend(prev_last, frame, (k + 1) / (XFADE + 3))
    d = ImageDraw.Draw(frame)
    t = k
    if t >= 8:
        # "Play free" button
        bw, bh = 640, 150
        bx, by = (W - bw) // 2, 1600
        pulse = 1.0 + 0.03 * ((k // 15) % 2)
        bw2, bh2 = int(bw * pulse), int(bh * pulse)
        bx2, by2 = (W - bw2) // 2, by - (bh2 - bh) // 2
        d.rounded_rectangle((bx2, by2 + 12, bx2 + bw2, by2 + bh2 + 12), 75, fill=(0, 0, 0, 90))
        d.rounded_rectangle((bx2, by2, bx2 + bw2, by2 + bh2), 75, fill=BASIL, outline=INK, width=8)
        d.text((W / 2, by2 + bh2 / 2), "Play free", font=font(BOLD, 84), fill="white", anchor="mm")
    if t >= 16:
        d.text((W / 2, 1835), "Coming soon on iPhone", font=font(SEMI, 56), fill=CREAM, anchor="mm")
    emit(frame)

assert out_i == 450, out_i

# ---- audio: music bed from the Downtown loop's A section, taps, a ka-ching + stinger on the end card ----
taps_out = []
t0 = 0
for seg, first, n, cap in EDL:
    for tp in taps:
        if tp["seg"] == seg and first <= tp["frame"] < first + n:
            taps_out.append((t0 + tp["frame"] - first) / FPS)
    t0 += n
end_t = t0 / FPS
A = os.path.join(HERE, "audio")
inputs = ["-ss", "11.43", "-t", "15.2", "-i", f"{A}/downtown.m4a"]
filters = ["[0:a]volume=0.9,afade=t=out:st=13.9:d=1.1[m]"]
mix = ["[m]"]
idx = 1
for j, t in enumerate(taps_out):
    inputs += ["-i", f"{A}/tap_{j % 4}.m4a"]
    filters.append(f"[{idx}:a]volume=0.55,adelay={int(t * 1000)}|{int(t * 1000)}[t{idx}]")
    mix.append(f"[t{idx}]"); idx += 1
for j, t in enumerate(x for x in taps_out if x < 4.6):           # cash pop a beat after each counter tap
    pass
inputs += ["-i", f"{A}/collect_2.m4a", "-i", f"{A}/downtown_milestone_big.m4a"]
filters.append(f"[{idx}:a]volume=0.8,adelay={int(end_t * 1000 + 150)}|{int(end_t * 1000 + 150)}[c]"); mix.append("[c]"); idx += 1
filters.append(f"[{idx}:a]volume=0.9,adelay={int(end_t * 1000)}|{int(end_t * 1000)}[s]"); mix.append("[s]"); idx += 1
filters.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,alimiter=limit=0.89,atrim=0:15[a]")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", "[a]",
                "-ar", "48000", "-ac", "2", "ad_audio.wav"], check=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(FPS), "-i", f"{TMP}/o%04d.png", "-i", "ad_audio.wav",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", "15", OUT_MP4], check=True)
print("wrote", OUT_MP4, "taps", len(taps_out), "end card at", end_t)
