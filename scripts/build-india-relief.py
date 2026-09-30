"""Build a compact, India-clipped 3D elevation grid from Mapzen Terrarium tiles.

Source: https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
Terrarium RGB heights: (R * 256 + G + B / 256) - 32768 metres.
The checked-in output is a 0.2-degree grid, so the site needs no map-tile requests.
"""
from concurrent.futures import ThreadPoolExecutor
import base64
from io import BytesIO
import json
import math
import struct
from pathlib import Path
from urllib.request import urlopen
from PIL import Image

ZOOM = 6
BOUNDS = {"west": 67.0, "east": 98.0, "south": 5.0, "north": 38.0}
WIDTH = 196
HEIGHT = 208
ROOT = Path(__file__).resolve().parents[1]
STATE_FILE = ROOT / "lib/mapData/indiaStates.json"
OUTPUT_FILE = ROOT / "lib/mapData/indiaElevation.json"


def pixel_xy(lon, lat):
    n = 2 ** ZOOM
    x = (lon + 180.0) / 360.0 * n * 256
    lat_r = math.radians(max(-85.05112878, min(85.05112878, lat)))
    y = (1 - math.asinh(math.tan(lat_r)) / math.pi) / 2 * n * 256
    return x, y


def download_tile(key):
    x, y = key
    url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png"
    with urlopen(url, timeout=25) as response:
        return key, Image.open(BytesIO(response.read())).convert("RGB")


def elevation_at(lon, lat, tiles):
    px, py = pixel_xy(lon, lat)
    x0, y0 = math.floor(px), math.floor(py)
    fx, fy = px - x0, py - y0

    def sample(x, y):
        tx, ox = divmod(x, 256)
        ty, oy = divmod(y, 256)
        image = tiles.get((tx, ty))
        if image is None:
            return 0
        r, g, b = image.getpixel((ox, oy))
        return r * 256 + g + b / 256 - 32768

    a, b, c, d = sample(x0, y0), sample(x0 + 1, y0), sample(x0, y0 + 1), sample(x0 + 1, y0 + 1)
    return round((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy)


def build_feature_polygons(features):
    prepared = []
    for feature in features:
        rings = feature["rings"]
        all_points = [point for ring in rings for point in ring]
        prepared.append((min(p[0] for p in all_points), max(p[0] for p in all_points), min(p[1] for p in all_points), max(p[1] for p in all_points), rings))
    return prepared


def contains(point_x, point_y, ring):
    inside = False
    previous = ring[-1]
    for current in ring:
        x1, y1 = previous
        x2, y2 = current
        if (y1 > point_y) != (y2 > point_y):
            crossing_x = (x2 - x1) * (point_y - y1) / (y2 - y1) + x1
            if point_x < crossing_x:
                inside = not inside
        previous = current
    return inside


def is_land(lon, lat, polygons):
    for min_x, max_x, min_y, max_y, rings in polygons:
        if min_x <= lon <= max_x and min_y <= lat <= max_y:
            if any(contains(lon, lat, ring) for ring in rings):
                return True
    return False


state_features = json.loads(STATE_FILE.read_text())
polygons = build_feature_polygons(state_features)
west, east = BOUNDS["west"], BOUNDS["east"]
south, north = BOUNDS["south"], BOUNDS["north"]
# Two-pixel border covers interpolation at the bounds.
tile_x0, tile_y0 = (int(v // 256) for v in pixel_xy(west, north))
tile_x1, tile_y1 = (int(v // 256) for v in pixel_xy(east, south))
keys = [(x, y) for x in range(tile_x0, tile_x1 + 1) for y in range(tile_y0, tile_y1 + 1)]
with ThreadPoolExecutor(max_workers=12) as pool:
    tiles = dict(pool.map(download_tile, keys))

heights = []
for row in range(HEIGHT):
    lat = north - row / (HEIGHT - 1) * (north - south)
    for column in range(WIDTH):
        lon = west + column / (WIDTH - 1) * (east - west)
        heights.append(max(0, elevation_at(lon, lat, tiles)))

land_cells = []
for row in range(HEIGHT - 1):
    lat = north - (row + 0.5) / (HEIGHT - 1) * (north - south)
    for column in range(WIDTH - 1):
        lon = west + (column + 0.5) / (WIDTH - 1) * (east - west)
        land_cells.append(is_land(lon, lat, polygons))

height_bytes = struct.pack("<" + "H" * len(heights), *heights)
mask_bytes = bytearray((len(land_cells) + 7) // 8)
for index, is_inside in enumerate(land_cells):
    if is_inside:
        mask_bytes[index // 8] |= 1 << (index % 8)

result = {
    "source": "Mapzen Terrain Tiles (Terrarium), aggregated elevation data",
    "zoom": ZOOM,
    "bounds": BOUNDS,
    "width": WIDTH,
    "height": HEIGHT,
    "heightsMetersLE": base64.b64encode(height_bytes).decode("ascii"),
    "landCellsBits": base64.b64encode(mask_bytes).decode("ascii"),
}
OUTPUT_FILE.write_text(json.dumps(result, separators=(",", ":")) + "\n")
print(f"Wrote {WIDTH}×{HEIGHT} elevations / {len(keys)} source tiles: {OUTPUT_FILE.stat().st_size:,} bytes")
print(f"Elevation range: {min(heights):,}–{max(heights):,} m; land cells: {sum(land_cells):,}")
