"""Writes assets/img/frame-gilt.svg: a carved, gilded palace frame used as a CSS border-image
(Contact page, .talk__frame). A 360-unit square tile with a 90-unit moulding on every side:
outer bead and cove, a row of beads, an egg-and-dart band, a bright torus and the sight edge,
mitred at the corners and capped by rosette blocks. Lit from the top left: each side has its own
profile gradient and the ornaments are drawn per side (never rotated), so every highlight falls
the same way. The middle 180 units of each side repeat (border-image-repeat: round); its ornaments
have a 30-unit period aligned to the slice lines, so the repeats join seamlessly.

    python3 _build/frame_gilt.py
"""
from pathlib import Path

S, B = 360, 90           # tile size, moulding width (= border-image-slice)
OUT = Path(__file__).resolve().parent.parent / 'assets/img/frame-gilt.svg'

# the moulding's profile, outer edge (0) to sight edge (90)
PROFILE = [(0, '#4A320E'), (4.5, '#8A6422'), (7, '#E6C674'), (11.5, '#FFF0B8'), (16, '#C39232'), (18, '#4A3210'),
           (19.5, '#6A4B16'), (30, '#6A4B16'), (30.6, '#F2D581'), (31.8, '#B98A31'), (32.6, '#563C10'),
           (49, '#7A581C'), (65.6, '#4C3510'), (66.3, '#F3D987'), (68.6, '#FFF3C4'), (74, '#C7953A'),
           (79, '#6A4914'), (81, '#38260B'), (85.5, '#8C6826'), (87, '#E4C26C'), (88.6, '#A47A2C'), (90, '#211504')]

SIDES = {   # gradient direction (outer -> inner) and the trapezoid each side is clipped to
    'top':    ((0, 0, 0, B),           f'0,0 {S},0 {S-B},{B} {B},{B}'),
    'bottom': ((0, S, 0, S - B),       f'0,{S} {S},{S} {S-B},{S-B} {B},{S-B}'),
    'left':   ((0, 0, B, 0),           f'0,0 0,{S} {B},{S-B} {B},{B}'),
    'right':  ((S, 0, S - B, 0),       f'{S},0 {S},{S} {S-B},{S-B} {S-B},{B}'),
}
LIGHT = {'top': 'rgba(255,246,214,.12)', 'left': 'rgba(255,246,214,.05)', 'right': 'rgba(40,20,0,.12)', 'bottom': 'rgba(40,20,0,.22)'}


def at(side, along, depth):
    """A point on a side: `along` the side (0..S), `depth` in from its outer edge (0..B)."""
    return {'top': (along, depth), 'bottom': (along, S - depth), 'left': (depth, along), 'right': (S - depth, along)}[side]


def side_ornaments(side):
    vertical = side in ('left', 'right')
    out = []
    for i in range(-1, S // 10 + 1):                      # beads, 10-unit period, centred between the slice lines' multiples
        x, y = at(side, i * 10 + 5, 25)
        out.append(f'<circle cx="{x}" cy="{y}" r="4.1" fill="url(#bead)"/>')
    for i in range(-1, S // 30 + 2):                      # egg-and-dart, 30-unit period: eggs on the slice lines
        x, y = at(side, i * 30, 49)
        rx, ry = (15, 12.5) if vertical else (12.5, 15)
        out.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#4E3710" stroke="#33220A" stroke-width="1.3"/>')
        rx, ry = (13, 10) if vertical else (10, 13)
        out.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#egg)"/>')
        c = i * 30 + 15                                   # the dart between two eggs, pointing in towards the picture
        pts = [at(side, c, 35), at(side, c + 2.2, 50), at(side, c, 58), at(side, c - 2.2, 50)]
        head = [at(side, c - 4.5, 55), at(side, c, 64), at(side, c + 4.5, 55)]
        out.append('<polygon points="' + ' '.join(f'{px:g},{py:g}' for px, py in pts) + '" fill="url(#dart)"/>')
        out.append('<polygon points="' + ' '.join(f'{px:g},{py:g}' for px, py in head) + '" fill="url(#dart)"/>')
    return ''.join(out)


def corner(dx, dy):
    """A square block over the bead row and the ornament band, with a carved rosette."""
    cx, cy = 45 + dx, 45 + dy
    petals = ''.join(f'<ellipse cx="{cx}" cy="{cy - 13}" rx="5.2" ry="10.5" fill="url(#egg)" stroke="#3E2A0C" stroke-width=".6" transform="rotate({k * 45} {cx} {cy})"/>' for k in range(8))
    small = ''.join(f'<ellipse cx="{cx}" cy="{cy - 15}" rx="2.6" ry="6" fill="url(#bead)" transform="rotate({22.5 + k * 45} {cx} {cy})"/>' for k in range(8))
    return (f'<rect x="{17 + dx}" y="{17 + dy}" width="56" height="56" fill="url(#block)" stroke="#33220A" stroke-width="1.4"/>'
            f'<rect x="{21.5 + dx}" y="{21.5 + dy}" width="47" height="47" fill="none" stroke="#FFF0B8" stroke-opacity=".55" stroke-width=".9"/>'
            f'<circle cx="{cx}" cy="{cy}" r="21" fill="#4E3710"/>{small}{petals}'
            f'<circle cx="{cx}" cy="{cy}" r="7.5" fill="url(#bead)" stroke="#3E2A0C" stroke-width=".8"/>')


def build():
    stops = ''.join(f'<stop offset="{o / B:.4f}" stop-color="{c}"/>' for o, c in PROFILE)
    grads = ''.join(f'<linearGradient id="p-{n}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{stops}</linearGradient>'
                    for n, ((x1, y1, x2, y2), _) in SIDES.items())
    clips = ''.join(f'<clipPath id="c-{n}"><polygon points="{pts}"/></clipPath>' for n, (_, pts) in SIDES.items())
    defs = (grads + clips +
            '<radialGradient id="bead" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#FFF5C8"/><stop offset=".35" stop-color="#E2BB60"/><stop offset=".75" stop-color="#9A6F26"/><stop offset="1" stop-color="#5A3E10"/></radialGradient>'
            '<radialGradient id="egg" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#FFF1BA"/><stop offset=".4" stop-color="#DBB257"/><stop offset=".8" stop-color="#9E7327"/><stop offset="1" stop-color="#5E4212"/></radialGradient>'
            '<linearGradient id="dart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6DC92"/><stop offset=".55" stop-color="#B8892F"/><stop offset="1" stop-color="#5E4212"/></linearGradient>'
            '<linearGradient id="block" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2D27C"/><stop offset=".45" stop-color="#B5862E"/><stop offset="1" stop-color="#5E4212"/></linearGradient>')
    sides = ''.join(f'<g clip-path="url(#c-{n})"><rect width="{S}" height="{S}" fill="url(#p-{n})"/>{side_ornaments(n)}<polygon points="{pts}" fill="{LIGHT[n]}"/></g>'
                    for n, (_, pts) in SIDES.items())
    corners = ''.join(corner(dx, dy) for dx, dy in ((0, 0), (S - B, 0), (0, S - B), (S - B, S - B)))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">'
           f'<defs>{defs}</defs>{sides}{corners}</svg>\n')
    OUT.write_text(svg)
    print('wrote', OUT.name, len(svg), 'bytes')


if __name__ == '__main__':
    build()
