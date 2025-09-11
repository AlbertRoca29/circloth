from pathlib import Path
import sys

try:
    import cairosvg
    from PIL import Image
except Exception as e:
    print("Missing required packages. Please run: pip install cairosvg Pillow")
    raise

ROOT = Path(__file__).resolve().parents[0]
# repository root is parent of scripts directory
REPO_ROOT = ROOT.parent
SVG_PATH = REPO_ROOT / 'frontend' / 'public' / 'logo.svg'
OUT_DIR = REPO_ROOT / 'frontend' / 'public'
OUT_DIR.mkdir(parents=True, exist_ok=True)

sizes = [192, 512]
created = []

if not SVG_PATH.exists():
    print(f"SVG source not found at {SVG_PATH}")
    sys.exit(1)

with open(SVG_PATH, 'rb') as f:
    svg_data = f.read()

for s in sizes:
    out_png = OUT_DIR / f'logo-{s}.png'
    # Render square with requested size
    cairosvg.svg2png(bytestring=svg_data, output_width=s, output_height=s, write_to=str(out_png))
    created.append(out_png)
    print(f"Wrote {out_png}")

# Create multi-size ICO from the largest PNG
ico_path = OUT_DIR / 'logo.ico'
# Open largest PNG and let Pillow generate icon sizes
largest = OUT_DIR / 'logo-512.png'
if largest.exists():
    im = Image.open(largest).convert('RGBA')
    # Pillow will resize the source image to produce the listed sizes
    im.save(ico_path, format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
    created.append(ico_path)
    print(f"Wrote {ico_path}")
else:
    print("Largest PNG not found; cannot create ICO")

print('\nCreated files:')
for p in created:
    print(' -', p)
