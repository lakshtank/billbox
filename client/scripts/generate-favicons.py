import os
from PIL import Image, ImageDraw

def draw_receipt_icon(draw, x_offset, y_offset, scale, color):
    # Lucide ReceiptText scaled paths
    def p(x, y):
        return (x_offset + x * scale, y_offset + y * scale)

    # 3 Horizontal Text Lines
    # Line 1: (8, 8) to (14, 8)
    draw.line([p(8, 8), p(14, 8)], fill=color, width=max(1, int(2.2 * scale)))
    # Line 2: (8, 12) to (16, 12)
    draw.line([p(8, 12), p(16, 12)], fill=color, width=max(1, int(2.2 * scale)))
    # Line 3: (8, 16) to (13, 16)
    draw.line([p(8, 16), p(13, 16)], fill=color, width=max(1, int(2.2 * scale)))

    # Outer Zig-zag outline points
    # Top zig-zags from (4, 3) to (20, 3)
    top_points = [
        (4, 3), (5, 2.2), (6, 2.8), (7.4, 2.2), (8.8, 2.8), (10.2, 2.2),
        (11.6, 2.8), (13, 2.2), (14.4, 2.8), (15.8, 2.2), (17.2, 2.8), (18.6, 2.2), (20, 3)
    ]
    # Right border
    right_points = [(20, 21)]
    # Bottom zig-zags from (20, 21) to (4, 21)
    bottom_points = [
        (18.6, 21.8), (17.2, 21.2), (15.8, 21.8), (14.4, 21.2), (13, 21.8),
        (11.6, 21.2), (10.2, 21.8), (8.8, 21.2), (7.4, 21.8), (6, 21.2), (5, 21.8), (4, 21)
    ]
    # Left border
    left_points = [(4, 3)]

    polygon = [p(x, y) for x, y in (top_points + right_points + bottom_points + left_points)]
    line_w = max(1, int(2.2 * scale))
    draw.line(polygon, fill=color, width=line_w, joint='curve')

def generate_icon(size, output_path):
    # Oversample 4x for clean antialiasing
    super_size = size * 4
    img = Image.new("RGBA", (super_size, super_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle: radius 7/24 of size
    radius = int(super_size * (7.0 / 24.0))
    # Fill with Cosmic Petrol Teal (#124E66)
    cosmic_petrol = (18, 78, 102, 255)
    draw.rounded_rectangle([0, 0, super_size - 1, super_size - 1], radius=radius, fill=cosmic_petrol)

    # 14px icon centered inside 24px box
    icon_target_size = super_size * (14.0 / 24.0)
    scale = icon_target_size / 24.0
    offset = (super_size - icon_target_size) / 2.0

    draw_receipt_icon(draw, offset, offset, scale, (255, 255, 255, 255))

    # Downsample with Lanczos for smooth rendering
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    final_img.save(output_path, "PNG")
    print(f"Generated: {output_path} ({size}x{size})")

if __name__ == '__main__':
    public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))
    generate_icon(32, os.path.join(public_dir, 'favicon-32x32.png'))
    generate_icon(180, os.path.join(public_dir, 'apple-touch-icon.png'))
