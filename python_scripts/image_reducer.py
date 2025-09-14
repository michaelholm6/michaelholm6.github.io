from PIL import Image
import os

# Root folder to start searching in
TARGET_DIR = r"C:\Users\Michael\OneDrive - purdue.edu\Desktop\Personal Projects\personal-website\docs\pages\astrophotography_blog\blog_posts\New_mexico_starscape\images"   # change this to your top-level folder

# Max sizes (widths in pixels)
SIZES = {
    "hero": 2000,
    "content": 1200,
    "thumb": 600
}

QUALITY = 80  # WebP quality (0–100)

# Walk through all subdirectories
for root, _, files in os.walk(TARGET_DIR):
    for file in files:
        if not file.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        img_path = os.path.join(root, file)
        try:
            img = Image.open(img_path)
        except Exception as e:
            print(f"❌ Could not open {img_path}: {e}")
            continue

        base, _ = os.path.splitext(file)

        for label, max_width in SIZES.items():
            resized = img.copy()
            w, h = resized.size

            # Resize if wider than max width
            if w > max_width:
                new_height = int(h * max_width / w)
                resized = resized.resize((max_width, new_height), Image.LANCZOS)

            out_path = os.path.join(root, f"{base}_{label}.webp")
            resized.save(out_path, "WEBP", quality=QUALITY, method=6)
            print(f"✅ Saved {out_path}")