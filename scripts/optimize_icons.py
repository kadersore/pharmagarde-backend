from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICON_SOURCE = ROOT / "assets" / "images" / "icon.png"
TARGETS = {
    "icon.png": 1024,
    "splash-icon.png": 512,
    "android-icon-foreground.png": 512,
    "favicon.png": 256,
}

source = Image.open(ICON_SOURCE).convert("RGBA")
for name, size in TARGETS.items():
    target = ROOT / "assets" / "images" / name
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    # Palette quantization keeps launcher-style art sharp while greatly reducing PNG size.
    quantized = resized.convert("P", palette=Image.Palette.ADAPTIVE, colors=128)
    quantized.save(target, optimize=True)
    print(f"{target.relative_to(ROOT)} -> {target.stat().st_size / 1024:.1f} KB")
