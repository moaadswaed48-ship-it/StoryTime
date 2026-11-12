#!/usr/bin/env python3
"""
Upscales the story paintings 2x with Real-ESRGAN (CPU) and writes sharp WebP copies for dense phone screens.

  pip install --index-url https://download.pytorch.org/whl/cpu torch && pip install spandrel pillow numpy
  python3 scripts/assets/upscale.py --weights <RealESRGAN_x2plus.pth> [--only cover,k08] [--keep-png <dir>]

Weights (not committed, 67 MB): RealESRGAN_x2plus.pth — the official Real-ESRGAN x2 model, e.g. from a Hugging Face
mirror of xinntao/Real-ESRGAN. The small "realesr-general-x4v3" / "realesr-animevideov3" files also load (their 4x
result is reduced to 2x), but x2plus keeps the knit and leaf texture of these renders best.

Reads   assets-src/film/cover.png, k01.png … k12.png
Writes  public/story/cover@2x.webp          1760 x 2336, the whole cover
        public/story/hero-phone.webp        1320 x 1752, the phone hero still (kept under ~250 KB)
        public/story/kNN@2x.webp            2688 x 1504
Faces are never redrawn: this is a plain super-resolution pass over the committed paintings (hard rule 9).
"""
import argparse
import sys
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets-src" / "film"
OUT = ROOT / "public" / "story"
NAMES = ["cover"] + [f"k{i:02d}" for i in range(1, 13)]


def upscale(model, img: Image.Image, tile: int = 384, pad: int = 16) -> Image.Image:
    """Runs the model tile by tile (with overlap, so no seams) and returns the picture at exactly 2x."""
    scale = model.scale
    x = torch.from_numpy(np.asarray(img.convert("RGB"), dtype=np.float32) / 255).permute(2, 0, 1).unsqueeze(0)
    _, _, h, w = x.shape
    out = torch.zeros(1, 3, h * scale, w * scale)
    for ty in range(0, h, tile):
        for tx in range(0, w, tile):
            y0, x0 = max(0, ty - pad), max(0, tx - pad)
            y1, x1 = min(h, ty + tile + pad), min(w, tx + tile + pad)
            part = x[:, :, y0:y1, x0:x1]
            # even sizes: the x2 model folds 2x2 pixels into channels first
            ph, pw = part.shape[2] % 2, part.shape[3] % 2
            if ph or pw:
                part = torch.nn.functional.pad(part, (0, pw, 0, ph), mode="replicate")
            with torch.no_grad():
                res = model(part).clamp(0, 1)
            cy0, cx0 = (ty - y0) * scale, (tx - x0) * scale
            th, tw = (min(h, ty + tile) - ty) * scale, (min(w, tx + tile) - tx) * scale
            out[:, :, ty * scale : ty * scale + th, tx * scale : tx * scale + tw] = res[:, :, cy0 : cy0 + th, cx0 : cx0 + tw]
    arr = (out.squeeze(0).permute(1, 2, 0).numpy() * 255 + 0.5).astype(np.uint8)
    big = Image.fromarray(arr)
    return big if scale == 2 else big.resize((w * 2, h * 2), Image.LANCZOS)


def save_webp(img: Image.Image, path: Path, quality: int = 80, max_bytes: int = 0) -> None:
    while True:
        img.save(path, "WEBP", quality=quality, method=6)
        if not max_bytes or path.stat().st_size <= max_bytes or quality <= 50:
            break
        quality -= 4
    print(f"  {path.relative_to(ROOT)}  {img.width}x{img.height}  q{quality}  {path.stat().st_size // 1024} KB")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", required=True)
    ap.add_argument("--only", default="", help="comma list, e.g. cover,k08")
    ap.add_argument("--keep-png", default="", help="also write the raw 2x PNGs to this folder")
    ap.add_argument("--no-webp", action="store_true", help="only the PNGs (for comparing models)")
    a = ap.parse_args()
    torch.set_grad_enabled(False)
    model = ModelLoader().load_from_file(a.weights).eval()  # spandrel reads .pth files with a safe unpickler
    print(f"model: {model.architecture.name} x{model.scale}")
    names = [n for n in NAMES if not a.only or n in a.only.split(",")]
    for name in names:
        src = SRC / f"{name}.png"
        if not src.exists():
            print(f"  missing {src}")
            continue
        t = time.time()
        big = upscale(model, Image.open(src))
        print(f"{name}: {big.width}x{big.height} in {time.time() - t:.0f}s")
        if a.keep_png:
            Path(a.keep_png).mkdir(parents=True, exist_ok=True)
            big.save(Path(a.keep_png) / f"{name}@2x.png")
        if a.no_webp:
            continue
        save_webp(big, OUT / f"{name}@2x.webp", 80)
        if name == "cover":
            # the phone hero: 3 device pixels per CSS pixel on a 440px-wide screen, light enough for the first paint
            phone = big.resize((1320, round(big.height * 1320 / big.width)), Image.LANCZOS)
            save_webp(phone, OUT / "hero-phone.webp", 80, 250 * 1024)
    return 0


if __name__ == "__main__":
    sys.exit(main())
