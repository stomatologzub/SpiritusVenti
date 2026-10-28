from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1] / 'assets' / 'gallery'
output = root / 'optimized'
output.mkdir(exist_ok=True)
original_size = final_size = 0
for source in root.iterdir():
    if not source.is_file():
        continue
    original_size += source.stat().st_size
    with Image.open(source) as raw:
        image = ImageOps.exif_transpose(raw).convert('RGB')
        preview = image.copy()
        preview.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
        preview.save(output / f'{source.stem}.webp', 'WEBP', quality=80, method=6)
        thumbnail = ImageOps.fit(image, (640, 480), Image.Resampling.LANCZOS)
        path = output / f'{source.stem}-640.webp'
        thumbnail.save(path, 'WEBP', quality=78, method=6)
        final_size += path.stat().st_size
print(f'Gallery thumbnails: {original_size:,} -> {final_size:,} bytes')
