"""The Contact page's museum frame (after a grand gilt frame in a gallery): writes three SVGs.

  assets/img/frame-gilt.svg   the moulding, used as a CSS border-image (slice 90, round):
                              a reeded outer edge, a broad burnished cove, bead-and-reel, a bright
                              torus and the sight edge, mitred, lit from the top left
  assets/img/frame-boss.svg   the round gilt boss with a rosette that sits on each corner
  assets/img/frame-crest.svg  the carved crest on top: the Summit mountain mark in a cartouche,
                              a sunburst of rays and an acanthus scroll either side

Each side of the moulding has its own profile gradient and its ornaments are drawn per side
(never rotated), so every highlight falls the same way. The middle 180 units of a side repeat;
the ornaments' periods (3 and 10 units) divide 90 and 180, so the repeats join seamlessly.

    python3 _build/frame_gilt.py
"""
import math
from pathlib import Path

S, B = 360, 90
IMG = Path(__file__).resolve().parent.parent / 'assets/img'
DARK = '#3E280A'

PROFILE = [(0, '#2A1A05'), (2, '#6E4C16'), (3.5, '#D9AC55'), (4.5, '#9A6C24'), (12, '#8A6020'), (12.6, '#4A320C'), (13.8, '#A87828'),
           (20, '#B9893A'), (29, '#F4DA9C'), (35, '#E3BD6B'), (45, '#B07E30'), (53.5, '#6E4C16'), (54.5, '#45300C'), (55.6, '#8E6422'),
           (63.4, '#7A561C'), (64.2, '#F6E0A2'), (66.5, '#FAE9B6'), (70, '#E2BC68'), (74, '#B48233'), (77, '#6E4C16'), (79, '#3A2509'),
           (84, '#8A6222'), (85.4, '#ECCB7A'), (87.2, '#A47A2C'), (90, '#1C1203')]
SIDES = {
    'top':    ((0, 0, 0, B),     f'0,0 {S},0 {S-B},{B} {B},{B}'),
    'bottom': ((0, S, 0, S - B), f'0,{S} {S},{S} {S-B},{S-B} {B},{S-B}'),
    'left':   ((0, 0, B, 0),     f'0,0 0,{S} {B},{S-B} {B},{B}'),
    'right':  ((S, 0, S - B, 0), f'{S},0 {S},{S} {S-B},{S-B} {S-B},{B}'),
}
LIGHT = {'top': 'rgba(255,246,214,.10)', 'left': 'rgba(255,246,214,.04)', 'right': 'rgba(40,20,0,.12)', 'bottom': 'rgba(40,20,0,.22)'}
GOLD_DEFS = ('<radialGradient id="ball" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#FFF3C6"/><stop offset=".38" stop-color="#E4BB60"/><stop offset=".78" stop-color="#9A6B22"/><stop offset="1" stop-color="#4E3410"/></radialGradient>'
             '<linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE6AC"/><stop offset=".38" stop-color="#E0B75D"/><stop offset=".72" stop-color="#AE7C2F"/><stop offset="1" stop-color="#6A4914"/></linearGradient>'
             '<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBE6AC"/><stop offset=".45" stop-color="#D2A54E"/><stop offset="1" stop-color="#6A4914"/></linearGradient>')


def at(side, along, depth):
    return {'top': (along, depth), 'bottom': (along, S - depth), 'left': (depth, along), 'right': (S - depth, along)}[side]


def poly(pts, fill, extra=''):
    return '<polygon points="' + ' '.join(f'{x:g},{y:g}' for x, y in pts) + f'" fill="{fill}"{extra}/>'


def side_ornaments(side):
    vert = side in ('left', 'right')
    out = []
    for i in range(-2, S // 3 + 2):                      # reeding on the outer edge, 3-unit period
        a = i * 3
        out.append(poly([at(side, a + .3, 4.6), at(side, a + 1.5, 4.6), at(side, a + 1.5, 11.6), at(side, a + .3, 11.6)], 'rgba(255,240,190,.38)'))
        out.append(poly([at(side, a + 1.6, 4.6), at(side, a + 2.6, 4.6), at(side, a + 2.6, 11.6), at(side, a + 1.6, 11.6)], 'rgba(50,30,5,.32)'))
    for i in range(-1, S // 10 + 1):                     # bead and reel on the flat, 10-unit period
        x, y = at(side, i * 10 + 5, 59.5)
        out.append(f'<circle cx="{x:g}" cy="{y:g}" r="3.3" fill="url(#ball)"/>')
        x, y = at(side, i * 10, 59.5)
        rx, ry = (3.4, 1.4) if vert else (1.4, 3.4)
        out.append(f'<ellipse cx="{x:g}" cy="{y:g}" rx="{rx}" ry="{ry}" fill="url(#ball)"/>')
    return ''.join(out)


def moulding():
    stops = ''.join(f'<stop offset="{o / B:.4f}" stop-color="{c}"/>' for o, c in PROFILE)
    grads = ''.join(f'<linearGradient id="p-{n}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{stops}</linearGradient>'
                    for n, ((x1, y1, x2, y2), _) in SIDES.items())
    clips = ''.join(f'<clipPath id="c-{n}"><polygon points="{pts}"/></clipPath>' for n, (_, pts) in SIDES.items())
    sides = ''.join(f'<g clip-path="url(#c-{n})"><rect width="{S}" height="{S}" fill="url(#p-{n})"/>{side_ornaments(n)}<polygon points="{pts}" fill="{LIGHT[n]}"/></g>'
                    for n, (_, pts) in SIDES.items())
    # the mitre seams
    seams = ''.join(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="rgba(40,22,4,.35)" stroke-width=".7"/>'
                    for x1, y1, x2, y2 in ((0, 0, B, B), (S, 0, S - B, B), (0, S, B, S - B), (S, S, S - B, S - B)))
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}"><defs>{GOLD_DEFS}{grads}{clips}</defs>{sides}{seams}</svg>\n'


def boss():
    gad = []
    for k in range(20):                                  # gadrooning round the rim
        a = k * 2 * math.pi / 20
        c, s = math.cos(a), math.sin(a)
        p = lambda r, w: (50 + r * c - w * s, 50 + r * s + w * c)
        pts = [p(33, 0), p(40, 4.6), p(47, 0), p(40, -4.6)]
        gad.append(poly(pts, 'url(#gd)', f' stroke="{DARK}" stroke-width=".7"'))
    petals = ''.join(f'<ellipse cx="50" cy="35.5" rx="5.6" ry="11" fill="url(#gv)" stroke="{DARK}" stroke-width=".6" transform="rotate({k * 45} 50 50)"/>' for k in range(8))
    small = ''.join(f'<ellipse cx="50" cy="31" rx="2.4" ry="5" fill="url(#ball)" transform="rotate({22.5 + k * 45} 50 50)"/>' for k in range(8))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs>{GOLD_DEFS}</defs>'
            f'<circle cx="50" cy="50" r="48.5" fill="url(#ball)" stroke="{DARK}" stroke-width="1.2"/>{"".join(gad)}'
            f'<circle cx="50" cy="50" r="31.5" fill="#5A3C10"/><circle cx="50" cy="50" r="30" fill="url(#ball)"/>{small}{petals}'
            f'<circle cx="50" cy="50" r="9" fill="url(#ball)" stroke="{DARK}" stroke-width=".9"/></svg>\n')


def crest():
    W, H, cx, cy = 320, 128, 160, 92
    rays = []
    for k, deg in enumerate(range(-80, 81, 10)):          # a sunburst behind the cartouche
        a = math.radians(deg)
        d, pp = (math.sin(a), -math.cos(a)), (math.cos(a), math.sin(a))
        L = 94 if k % 2 == 0 else 74
        base = (cx + d[0] * 24, cy + d[1] * 24)
        rays.append(poly([(base[0] + pp[0] * 4.2, base[1] + pp[1] * 4.2), (cx + d[0] * L, cy + d[1] * L), (base[0] - pp[0] * 4.2, base[1] - pp[1] * 4.2)],
                         'url(#gv)', f' stroke="{DARK}" stroke-width=".7"'))
    # a C-scroll either side: a band that sweeps out from the plinth and curls up into a volute,
    # with a second, inner band and a small leaf tucked under the curl
    scroll = (f'<g id="scroll" stroke="{DARK}" stroke-width="1.1" stroke-linejoin="round">'
              '<path d="M124 120 C100 121 70 118 50 109 C30 100 22 86 30 76 C37 67 51 69 52 79 C53 88 43 91 39 85 C41 93 49 99 62 103 C80 108 102 109 124 108 Z" fill="url(#gv)"/>'
              '<path d="M124 108 C104 109 82 107 66 102 C58 99 53 94 52 88" fill="none" stroke="#FCEBB8" stroke-opacity=".75" stroke-width="1.2"/>'
              '<path d="M118 108 C104 104 96 96 98 88 C100 81 108 80 111 85 C113 89 110 93 106 92 C108 98 113 103 120 105 Z" fill="url(#gd)"/>'
              '<path d="M60 104 C62 97 70 93 78 95 C73 98 72 102 74 106 Z" fill="url(#gd)"/>'
              '<circle cx="44" cy="80" r="3.6" fill="url(#ball)" stroke="none"/></g>')
    mark = 'M4 38 18 10l6 12 5-8 15 24z'
    cart = (f'<ellipse cx="{cx}" cy="64" rx="31" ry="35" fill="url(#gd)" stroke="{DARK}" stroke-width="1.3"/>'
            f'<ellipse cx="{cx}" cy="64" rx="26.5" ry="30.5" fill="none" stroke="#FCEBB8" stroke-width="1.2" stroke-opacity=".8"/>'
            f'<ellipse cx="{cx}" cy="64" rx="23" ry="27" fill="url(#recess)" stroke="{DARK}" stroke-width=".8"/>'
            f'<g transform="translate({cx - 21.6} {64 - 21}) scale(.9)"><path d="{mark}" fill="#2E1E06" transform="translate(1 1.6)" opacity=".7"/><path d="{mark}" fill="url(#gv)" stroke="#5A3C10" stroke-width=".8"/>'
            f'<path d="M4 43h40" stroke="url(#gv)" stroke-width="2.2"/></g>'
            f'<circle cx="{cx}" cy="25.5" r="5.5" fill="url(#ball)" stroke="{DARK}" stroke-width=".8"/>')
    plinth = (f'<path d="M106 128 L110 110 Q160 98 210 110 L214 128 Z" fill="url(#gv)" stroke="{DARK}" stroke-width="1.1"/>'
              f'<path d="M112 114 Q160 103 208 114" fill="none" stroke="#FCEBB8" stroke-opacity=".7" stroke-width="1.1"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{GOLD_DEFS}'
            '<radialGradient id="recess" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#9C7028"/><stop offset="1" stop-color="#5A3C10"/></radialGradient></defs>'
            f'{"".join(rays)}{scroll}<use href="#scroll" transform="translate({W} 0) scale(-1 1)"/>{plinth}{cart}</svg>\n')


def build():
    for name, svg in (('frame-gilt.svg', moulding()), ('frame-boss.svg', boss()), ('frame-crest.svg', crest())):
        (IMG / name).write_text(svg)
        print('wrote', name, len(svg), 'bytes')


if __name__ == '__main__':
    build()
