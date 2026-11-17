"""Import the approved 2026-11-12 tutorial atlases and card art.

Usage: python tools/import-tutorial-art.py PUMPKIN BOSS BEETLE CARDS
Requires Pillow, numpy and scipy. Inputs remain unchanged. Connected sprites
are isolated before cropping: the generated sheet is not an exact tile grid.
One scale per species is shared by both views and every pose, including down.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
REV = "v98.418"
manifest_path = ROOT / "data/asset-manifest.json"
manifest = json.loads(manifest_path.read_text())
assets = {a["id"]: a for a in manifest["assets"]}


def save(image, relative):
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=92, method=6)


def sprites(path, columns):
    image = Image.open(path).convert("RGBA")
    pixels = np.array(image)
    labels, _ = label(pixels[:, :, 3] > 12)
    parts = []
    for number, box in enumerate(find_objects(labels), 1):
        if box is None or np.count_nonzero(labels[box] == number) < 500:
            continue
        # Keep antialiased fringe, without including a neighbouring extended arm.
        mask = binary_dilation(labels[box] == number, iterations=1)
        part = pixels[box].copy()
        part[:, :, 3] *= mask
        parts.append((box[0].start, box[1].start, Image.fromarray(part)))
    assert len(parts) == columns * 2, (path, len(parts))
    # Sort the two rows independently: some poses have raised antennae or arms.
    parts.sort(key=lambda p: p[0])
    return [p[2] for row in [parts[:columns], parts[columns:]]
            for p in sorted(row, key=lambda p: p[1])]


def import_species(kind, path, poses, canvas, idle_height):
    parts = sprites(path, len(poses))
    width, height = canvas
    baseline = height - 24
    # Shrink only; never upscale a source sprite or independently fit each pose.
    scale = min(1, idle_height / max(parts[0].height, parts[len(poses)].height),
                (width - 32) / max(p.width for p in parts),
                (height - 44) / max(p.height for p in parts))
    for index, part in enumerate(parts):
        view = "se" if index < len(poses) else "ne"
        pose = poses[index % len(poses)]
        part = part.resize((round(part.width * scale), round(part.height * scale)),
                           Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", canvas)
        # For the boss, centre the pumpkin body rather than its extended vine.
        body_x = part.width / 2
        if kind == "pumpkinBoss":
            px = np.array(part)
            orange = ((px[:, :, 0].astype(float) > px[:, :, 1] * 1.45)
                      & (px[:, :, 0] > 100) & (px[:, :, 3] > 128))
            if orange.any():
                xs = np.where(orange)[1]
                body_x = (xs.min() + xs.max()) / 2
        x = max(8, min(width - part.width - 8, round(width / 2 - body_x)))
        frame.alpha_composite(part, (x, baseline - part.height))
        relative = f"assets/enemies/animations/{kind}/{view}-{pose}.webp"
        save(frame, relative)
        key = f"enemy-anim-{kind}-{view}-{pose}"
        entry = assets[key]
        entry.update(file=relative, status="final", size=list(canvas),
                     frameSize=list(canvas), pivot=[.5, baseline / height],
                     artRevision=REV, barHeight=min(.95, max(parts[0].height, parts[len(poses)].height) * scale / height + .03),
                     renderHeight=1, normalization={"commonScale": round(scale, 6),
                     "sharedAcross": "all poses and both views per species",
                     "baseline": baseline / height},
                     animation={"columns": 1, "rows": 1, "frames": 1,
                     "timings": [650 if pose == "idle" else 360],
                     "impactMs": 180, "loop": pose in ["idle", "walk", "loot"]},
                     note="ภาพท่าหลักจากชีต 12 พ.ย. 2026; 1 เฟรมต่อท่า ยังไม่มีเฟรมแทรก; สเกลร่วมทุกท่า/สองมุม ท่าล้มไม่ขยายเต็มกรอบ")
        for obsolete in ["qaStatus", "qaIssueIds", "qaCheckedAt"]:
            entry.pop(obsolete, None)
        if pose == "idle":
            suffix = "" if view == "se" else "-back"
            static_file = f"assets/enemies/{kind}{suffix}.webp"
            save(frame, static_file)
            assets[f"enemy-{kind}{suffix}"].update(
                status="final", size=list(canvas), artRevision=REV,
                pivot=[.5, baseline / height], note="ภาพนิ่งจากท่า idle ใช้สเกลและจุดยึดเดียวกับท่าต่อสู้")
            if view == "se":
                save(frame, f"assets/cards/portraits/en-{kind}.webp")


def import_cards(path):
    names = ["thunder", "backstab", "dive", "tide", "formation", "counter",
             "evade", "firstAid", "ambush", "rockfall", "perch", "climb",
             "chaosBolt", "chaosRend", "chaosWard"]
    titles = ["อัสนีบาต", "แทงข้างหลัง", "กระโจนฟาด", "คลื่นซัด", "จู่โจมประสาน",
              "ท่าสวนกลับ", "ก้าวหลบ", "ยาฉุกเฉิน", "ซุ่มโจมตี", "หินถล่ม",
              "ยึดที่สูง", "ปีนป่าย", "ประกายโกลาหล", "ฉีกกระแสโกลาหล", "ผนึกโกลาหล"]
    sheet = Image.open(path).convert("RGB")
    for i, (name, title) in enumerate(zip(names, titles)):
        column, row = i % 3, i // 3
        crop = sheet.crop((round(column * sheet.width / 3) + 1,
                           round(row * sheet.height / 5) + 1,
                           round((column + 1) * sheet.width / 3) - 1,
                           round((row + 1) * sheet.height / 5) - 1))
        file = f"assets/cards/tactic-{name}.webp"
        save(crop, file)
        key = f"tactic-card-{name}"
        previous = assets.get(key)
        assert previous is None or previous.get("artRevision") == REV, f"Existing card must be reviewed, not overwritten: {key}"
        entry = dict(id=key, file=file, category="tactic-cards", status="final",
                     size=list(crop.size), transparent=False, subject=title,
                     artRevision=REV, usedIn="ภาพประกอบการ์ดสนามตาราง",
                     note="ภาพจริงจากชีต 15 ใบ 12 พ.ย. 2026; เก็บขนาดพิกเซลจริง ไม่ขยายไฟล์")
        if previous is None:
            assets[key] = entry
            manifest["assets"].append(entry)
        else:
            previous.update(entry)


if __name__ == "__main__":
    pumpkin, boss, beetle, cards = sys.argv[1:]
    import_species("pumpkin", pumpkin, ["idle", "hit", "down", "loot"], (384, 384), 240)
    import_species("pumpkinBoss", boss,
                   ["idle", "walk", "windup", "strike", "cast", "hit", "down"], (512, 288), 240)
    import_species("pest", beetle, ["idle", "walk", "windup", "strike", "hit", "down"], (384, 384), 170)
    import_cards(cards)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n")
    (ROOT / "js/asset-manifest.js").write_text(
        "/* Generated asset registry; source: data/asset-manifest.json. */\nwindow.ASSET_MANIFEST="
        + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("Imported 34 pose images, 6 static images, 3 portraits, 15 card illustrations.")
