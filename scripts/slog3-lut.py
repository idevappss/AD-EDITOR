# Sony S-Log3 / S-Gamut3.Cine -> Rec.709 LUTs (the "S-Log3 → Rec.709 …" grades in Assets), 33-point .cube.
# Input is full-range normalised code values: how ffmpeg hands the creator's Sony XAVC ("pc" range) files to lut3d.
# Sony's S-Log3 curve and gamut matrix, a filmic highlight roll-off, then the look. Brightness is measured on his face.
#
# The grades in Assets (2026-09-29):
#   Bright:      --exp 0.8 --lift 0.2 --sat 1.1
#   Warm:        --exp 0.8 --lift 0.2 --sat 1.14 --warm 0.045 --tint 0.02
#   Warm + Blue: --exp 0.8 --lift 0.2 --sat 1.14 --warm 0.055 --tint 0.02 --cool 0.06 --teal 0.032 --skin 0.04
#                (Template 1, the default grade for new ads)
#   python3 scripts/slog3-lut.py "out.cube" --title "…" <flags>, then upload it in Assets as a LUT.
import argparse
ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("--title", default="S-Log3 to Rec.709")
ap.add_argument("--exp", type=float, default=0.6)     # scene exposure into the filmic curve (0.6 = neutral)
ap.add_argument("--lift", type=float, default=0.0)    # extra lift at the lower mids (peak at ~33% output), blacks/whites fixed
ap.add_argument("--sat", type=float, default=1.0)     # saturation around Rec.709 luma
ap.add_argument("--warm", type=float, default=0.0)    # white balance: +R / -B in linear
ap.add_argument("--tint", type=float, default=0.0)    # + = less green (magenta)
ap.add_argument("--cool", type=float, default=0.0)    # blue tint on near-neutral colours (walls, whites, greys), by output level
ap.add_argument("--teal", type=float, default=0.0)    # teal tint in the shadows
ap.add_argument("--skin", type=float, default=0.0)    # extra warmth/richness on skin hues only
a = ap.parse_args()
N = 33

def slog3_to_lin(x):
    cv = x * 1023.0
    if cv >= 171.2102946929:
        return (10 ** ((cv - 420.0) / 261.5)) * 0.19 - 0.01
    return (cv - 95.0) * 0.01125 / (171.2102946929 - 95.0)

# S-Gamut3.Cine -> Rec.709 linear (Sony's published matrix)
M = [[1.6269474, -0.5401385, -0.0868088], [-0.1785155, 1.4179409, -0.2394254], [-0.0444233, -0.1959181, 1.2403414]]
WB = [1 + a.warm, 1 - a.tint * 0.5, 1 - a.warm]

def tone(x):  # Narkowicz ACES filmic fit: soft toe, highlight shoulder
    x = max(0.0, x) * a.exp
    return min(1.0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14))

# Skin lift: a bump peaking at ~44% output, ~zero in the deep shadows (blacks stay black) and at white.
def lift(y): return y + a.lift * 22 * y ** 2 * (1 - y) ** 2.5

import colorsys
LUMA = (0.2126, 0.7152, 0.0722)
def keep_luma(d):  # a colour push that leaves brightness exactly where it was
    k = sum(w * c for w, c in zip(LUMA, d)); return [c - k for c in d]
BLUE, TEAL, ORANGE = keep_luma([-0.6, -0.1, 1.0]), keep_luma([-1.0, 0.25, 0.6]), keep_luma([1.0, 0.25, -0.9])
def smooth(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
def split_tone(y):
    l = sum(w * c for w, c in zip(LUMA, y))
    c = max(y) - min(y)
    h = colorsys.rgb_to_hsv(*[min(1, max(0, v)) for v in y])[0] * 360
    neutral = 1 - smooth(0.05, 0.18, c)                      # walls, white jacket, grey sofa
    cool = a.cool * neutral * smooth(0.08, 0.5, l)           # more on the brighter neutrals, none in black
    teal = a.teal * smooth(0.02, 0.1, l) * (1 - smooth(0.12, 0.4, l))
    skin = a.skin * max(0.0, 1 - abs(((h - 25 + 180) % 360) - 180) / 30) * smooth(0.04, 0.14, c) * smooth(0.03, 0.12, l)
    return [v + cool * b + teal * t + skin * o for v, b, t, o in zip(y, BLUE, TEAL, ORANGE)]

out = [f'TITLE "{a.title}"', f"LUT_3D_SIZE {N}", ""]
for b in range(N):
    for g in range(N):
        for r in range(N):
            lin = [slog3_to_lin(v / (N - 1)) for v in (r, g, b)]
            rgb = [sum(M[i][k] * lin[k] for k in range(3)) * WB[i] for i in range(3)]
            y = [lift(tone(v) ** (1 / 2.4)) for v in rgb]
            l = 0.2126 * y[0] + 0.7152 * y[1] + 0.0722 * y[2]
            y = [l + (v - l) * a.sat for v in y]
            y = [min(1.0, max(0.0, v)) for v in split_tone(y)]
            out.append(" ".join(f"{v:.6f}" for v in y))
open(a.out, "w").write("\n".join(out) + "\n")
