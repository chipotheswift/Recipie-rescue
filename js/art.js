// =============================================================
//  ART — every ingredient drawn with SVG shapes (no image files).
//  TOP  = bird's-eye view (200x200, centered at 100,100)
//  SIDE = side-view layer (240 wide, `h` tall, drawn at y)
//  To swap in real PNGs later, return `<image href="img/x.png" .../>`.
// =============================================================

const ART = (() => {
  const f = n => n.toFixed(1);

  // Seeded random so textures look identical on every render.
  function rng(seed) {
    let s = seed % 2147483647 || 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  function wavy(r, amp, waves, phase = 0, cx = 100, cy = 100) {
    let d = '';
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      const rr = r + amp * Math.sin(waves * t + phase);
      d += (i ? 'L' : 'M') + f(cx + rr * Math.cos(t)) + ' ' + f(cy + rr * Math.sin(t));
    }
    return d + 'Z';
  }

  function dots(seed, count, radius, color, size) {
    const R = rng(seed);
    let s = '';
    for (let i = 0; i < count; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * radius;
      s += `<circle cx="${f(100 + d * Math.cos(a))}" cy="${f(100 + d * Math.sin(a))}" r="${size}" fill="${color}"/>`;
    }
    return s;
  }

  // Short random strands (shredded lettuce, slaw, onions)
  function strands(seed, count, radius, colors, len, width, curve = 0) {
    const R = rng(seed);
    let s = '';
    for (let i = 0; i < count; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * radius;
      const x = 100 + d * Math.cos(a), y = 100 + d * Math.sin(a);
      const t = R() * Math.PI, dx = Math.cos(t) * len / 2, dy = Math.sin(t) * len / 2;
      const c = colors[i % colors.length];
      s += curve
        ? `<path d="M${f(x - dx)} ${f(y - dy)} Q${f(x + dy * curve)} ${f(y - dx * curve)} ${f(x + dx)} ${f(y + dy)}" stroke="${c}" stroke-width="${width}" fill="none" stroke-linecap="round"/>`
        : `<line x1="${f(x - dx)}" y1="${f(y - dy)}" x2="${f(x + dx)}" y2="${f(y + dy)}" stroke="${c}" stroke-width="${width}" stroke-linecap="round"/>`;
    }
    return s;
  }

  function squiggle(color, edge) {
    const d = 'M48 72 q12 -16 24 0 t24 0 t24 0 t24 0 M40 102 q12 -16 24 0 t24 0 t24 0 t24 0 t24 0 M48 132 q12 -16 24 0 t24 0 t24 0 t24 0';
    return `<path d="${d}" fill="none" stroke="${edge}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>` +
           `<path d="${d}" fill="none" stroke="${color}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  function at(points, draw) {
    return points.map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 67})">${draw(i)}</g>`).join('');
  }

  // ---------- Buns ----------
  const BUNS = {
    brioche_bun: { base: '#d27f2a', dark: '#9c5414', crumb: '#f7dca6', seeds: false, shine: .32 },
    potato_bun:  { base: '#ecc070', dark: '#b88a3a', crumb: '#fdf0cc', seeds: false, shine: .18 },
    sesame_bun:  { base: '#e0a24f', dark: '#ad7225', crumb: '#f6e4b8', seeds: true,  shine: .25 },
  };

  function sesameSeeds() {
    const R = rng(11);
    let s = '';
    for (let i = 0; i < 24; i++) {
      const a = R() * 6.283, d = Math.sqrt(R()) * 64;
      const x = f(100 + d * Math.cos(a)), y = f(100 + d * Math.sin(a));
      s += `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.4" fill="#fff6dc" stroke="#d9c08a" stroke-width=".8" transform="rotate(${Math.round(R() * 180)} ${x} ${y})"/>`;
    }
    return s;
  }

  const bunCut = b =>
    `<circle cx="100" cy="100" r="82" fill="${b.base}" stroke="${b.dark}" stroke-width="4"/>` +
    `<circle cx="100" cy="100" r="71" fill="${b.crumb}"/>` + dots(7, 34, 62, '#e8c584', 2.2);

  const bunCrown = b =>
    `<circle cx="100" cy="100" r="82" fill="${b.base}" stroke="${b.dark}" stroke-width="4"/>` +
    `<ellipse cx="76" cy="70" rx="34" ry="18" fill="#fff" opacity="${b.shine}" transform="rotate(-32 76 70)"/>` +
    (b.seeds ? sesameSeeds() : '');

  const cheeseSquare = (fill, stroke, extra = '') =>
    `<g transform="rotate(45 100 100)"><rect x="42" y="42" width="116" height="116" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="3"/>` +
    `<rect x="54" y="54" width="44" height="12" rx="6" fill="#fff" opacity=".28"/>${extra}</g>`;

  // ---------- Bird's-eye view ----------
  const TOP = {
    beef_patty: () =>
      `<path d="${wavy(76, 2.5, 11)}" fill="#6b3a1f" stroke="#3d1f0e" stroke-width="3"/>` +
      dots(3, 42, 64, '#4a2411', 2.6) + dots(5, 26, 60, '#8d5531', 2),

    grilled_chicken: () =>
      `<path d="M38 104 C34 64 84 46 126 54 C166 62 174 104 156 132 C136 160 62 158 38 104Z" fill="#e2b06a" stroke="#a96d31" stroke-width="3"/>` +
      [0, 1, 2, 3].map(i => `<line x1="${58 + i * 24}" y1="132" x2="${84 + i * 24}" y2="74" stroke="#7b4a1f" stroke-width="7" stroke-linecap="round" opacity=".7"/>`).join(''),

    crispy_chicken: () =>
      `<path d="${wavy(74, 6, 17, 0.5)}" fill="#d48a2a" stroke="#93520f" stroke-width="3"/>` +
      `<path d="${wavy(60, 4, 13, 1.2)}" fill="#e6a443"/>` +
      dots(21, 60, 64, '#f6c46a', 2.4) + dots(23, 40, 64, '#a8601a', 2.2),

    american: () => cheeseSquare('#f7b52c', '#d58c0b'),

    swiss: () => cheeseSquare('#f4df8a', '#cfb24a',
      [[78, 80, 11], [122, 74, 7], [112, 120, 13], [74, 126, 6], [140, 108, 5], [96, 100, 4]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e2c35c" stroke="#cfb24a"/>`).join('')),

    cheddar: () => cheeseSquare('#f08a1c', '#c0650a'),

    pepper_jack: () => cheeseSquare('#f6efd6', '#d0c49a',
      [[70, 80, '#d6402a'], [118, 70, '#3f9a3a'], [126, 120, '#d6402a'], [80, 128, '#3f9a3a'], [100, 100, '#d6402a'], [140, 92, '#3f9a3a']]
        .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${c}"/>`).join('')),

    // One strip per layer — layer rotation fans the strips out.
    bacon: () =>
      `<path d="M28 92 q18 -10 36 0 t36 0 t36 0 t36 0 v22 q-18 10 -36 0 t-36 0 t-36 0 t-36 0Z" fill="#b8432f" stroke="#7a2414" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M30 103 q18 -9 36 0 t36 0 t36 0 t34 0" fill="none" stroke="#f3c9b0" stroke-width="4" stroke-linecap="round"/>`,

    jalapenos: () => at([[100, 62], [138, 94], [122, 138], [76, 138], [62, 94]], () =>
      `<circle r="15" fill="#4f9a2c" stroke="#2f6a16" stroke-width="3"/><circle r="9" fill="#d7ecb0"/>` +
      `<circle cx="-3" cy="-2" r="1.8" fill="#fff8d8"/><circle cx="3" cy="2" r="1.8" fill="#fff8d8"/>`),

    provolone: () =>
      `<circle cx="100" cy="100" r="80" fill="#f7efd2" stroke="#d3c187" stroke-width="3"/>` +
      `<circle cx="100" cy="100" r="74" fill="none" stroke="#e8dcae" stroke-width="2"/>` +
      `<circle cx="80" cy="88" r="3" fill="#e6d8a4"/><circle cx="118" cy="112" r="2.5" fill="#e6d8a4"/><circle cx="110" cy="76" r="2" fill="#e6d8a4"/>`,

    // One chip per layer — the layer rotation spreads chips around the bun.
    pickles: () => at([[100, 58]], () =>
      `<circle r="20" fill="#7da33c" stroke="#4b6d1b" stroke-width="3"/><circle r="13" fill="#a9cc6c"/>` +
      `<circle cx="-4" cy="-3" r="1.9" fill="#e7f2c8"/><circle cx="4" cy="2" r="1.9" fill="#e7f2c8"/><circle cx="-1" cy="6" r="1.9" fill="#e7f2c8"/>`),

    red_onion: () =>
      `<circle cx="100" cy="100" r="52" fill="none" stroke="#8a3a86" stroke-width="8"/>` +
      `<circle cx="100" cy="100" r="52" fill="none" stroke="#f4e4f1" stroke-width="3"/>`,

    tomato: () =>
      `<circle cx="100" cy="100" r="58" fill="#d63a2a" stroke="#9e2116" stroke-width="3.5"/><circle cx="100" cy="100" r="47" fill="#f0614b"/>` +
      [0, 1, 2, 3, 4].map(k => {
        const a = k * 1.2566, x = f(100 + 26 * Math.cos(a)), y = f(100 + 26 * Math.sin(a));
        return `<ellipse cx="${x}" cy="${y}" rx="11" ry="7" fill="#f9b15e" transform="rotate(${k * 72} ${x} ${y})"/>`;
      }).join('') + `<circle cx="100" cy="100" r="9" fill="#e44a36"/>`,

    shredded_lettuce: () =>
      `<path d="${wavy(72, 6, 9)}" fill="#8fcf55" opacity=".35"/>` +
      strands(31, 90, 70, ['#5fa82e', '#8fd056', '#b6e486', '#6fb83a'], 18, 5),

    leaf_lettuce: () =>
      `<path d="${wavy(86, 7, 13)}" fill="#6fb83a" stroke="#3f7f1b" stroke-width="3"/>` +
      `<path d="${wavy(64, 5, 10, 1)}" fill="#93d35a"/>` +
      [0, 1, 2, 3, 4, 5].map(i => {
        const a = i * Math.PI / 3;
        return `<line x1="100" y1="100" x2="${f(100 + 70 * Math.cos(a))}" y2="${f(100 + 70 * Math.sin(a))}" stroke="#c7ee98" stroke-width="3" stroke-linecap="round"/>`;
      }).join(''),

    mushrooms: () => at([[100, 60], [140, 96], [122, 140], [74, 138], [60, 96], [100, 102]], () =>
      `<path d="M-6 2 L-5 16 L5 16 L6 2Z" fill="#c9a37a" stroke="#5e3b1d" stroke-width="2"/>` +
      `<path d="M-21 3 C-21 -17 21 -17 21 3 Z" fill="#7d5130" stroke="#4f3016" stroke-width="2"/>`),

    caramelized_onions: () =>
      `<path d="${wavy(66, 7, 8)}" fill="#c98a45" opacity=".35"/>` +
      strands(41, 45, 60, ['#a8611f', '#8a4a16', '#c7803a'], 30, 5, 0.6),

    coleslaw: () =>
      `<path d="${wavy(70, 6, 10)}" fill="#f4f1e2" stroke="#d6d0b4" stroke-width="3"/>` +
      strands(51, 60, 60, ['#9ccb5a', '#9b4f96', '#f08a24', '#c7e39c'], 14, 3.5),

    special_sauce: () => squiggle('#f7b0a0', '#c0644a'),
    garlic_aioli:  () => squiggle('#f8f2dc', '#c9bd93'),
    herb_mayo:     () => squiggle('#e6f0c8', '#8fa65a') + dots(61, 26, 58, '#5f8f2a', 1.8),
    honey_mustard: () => squiggle('#f0b429', '#a87400'),
    bbq_sauce:     () => squiggle('#6e2a14', '#3d1608'),
    spicy_mayo:    () => squiggle('#ee6a3a', '#a8401a') + dots(71, 22, 58, '#b5220f', 1.8),
  };

  // ---------- Side view ----------
  const cheeseSide = (y, fill, stroke) =>
    `<path d="M24 ${y} H216 V${y + 6} H200 l-6 12 l-6 -12 H128 l-5 9 l-5 -9 H54 l-6 13 l-6 -13 H24Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;

  const sauceSide = (y, color, edge) => {
    const d = `M36 ${y + 2.5} q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0`;
    return `<path d="${d}" fill="none" stroke="${edge}" stroke-width="6" stroke-linecap="round"/>` +
           `<path d="${d}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>` +
           `<ellipse cx="70" cy="${y + 6}" rx="3" ry="4" fill="${color}" stroke="${edge}"/>`;
  };

  const ruffle = (y, h, fill, stroke, step = 12) => {
    let d = '';
    for (let x = 18; x <= 222; x += step) d += (x === 18 ? 'M' : 'L') + x + ' ' + f(y + 3 + 3 * Math.sin(x / 9));
    for (let x = 222; x >= 18; x -= step) d += ' L' + x + ' ' + f(y + h - 1 + 3 * Math.sin(x / 7));
    return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>`;
  };

  const SIDE = {
    beef_patty: { h: 24, d: y =>
      `<rect x="34" y="${y}" width="172" height="24" rx="11" fill="#5f331b" stroke="#3a1c0c" stroke-width="2.5"/>` +
      `<path d="M46 ${y + 7} h10 M72 ${y + 16} h14 M110 ${y + 8} h12 M150 ${y + 16} h10 M180 ${y + 8} h8" stroke="#8b5532" stroke-width="3" stroke-linecap="round"/>` },
    grilled_chicken: { h: 18, d: y =>
      `<rect x="30" y="${y}" width="180" height="18" rx="9" fill="#dcaa62" stroke="#a46a2f" stroke-width="2.5"/>` +
      `<path d="M50 ${y + 3} l8 12 M80 ${y + 3} l8 12 M110 ${y + 3} l8 12 M140 ${y + 3} l8 12 M170 ${y + 3} l8 12" stroke="#7b4a1f" stroke-width="4" stroke-linecap="round" opacity=".75"/>` },
    crispy_chicken: { h: 28, d: y => {
      let d = `M26 ${y + 16}`;
      for (let x = 26; x <= 214; x += 14) d += ` Q${x + 7} ${y - 2 + (x % 28 ? 3 : 0)} ${x + 14} ${y + 4}`;
      d += ` Q222 ${y + 16} 210 ${y + 26} H34 Q20 ${y + 24} 26 ${y + 16}Z`;
      return `<path d="${d}" fill="#d48a2a" stroke="#93520f" stroke-width="2.5" stroke-linejoin="round"/>` +
             `<path d="M44 ${y + 12} h6 M76 ${y + 18} h8 M112 ${y + 11} h6 M148 ${y + 19} h8 M182 ${y + 12} h6" stroke="#f6c46a" stroke-width="3" stroke-linecap="round"/>`;
    } },
    american:  { h: 6, d: y => cheeseSide(y, '#f7b52c', '#d58c0b') },
    swiss:     { h: 6, d: y => cheeseSide(y, '#f4df8a', '#cfb24a') },
    provolone: { h: 6, d: y => cheeseSide(y, '#f7efd2', '#cdbb80') },
    cheddar:   { h: 6, d: y => cheeseSide(y, '#f08a1c', '#c0650a') },
    pepper_jack: { h: 6, d: y => cheeseSide(y, '#f6efd6', '#c9bb8a') +
      `<circle cx="70" cy="${y + 3}" r="1.6" fill="#d6402a"/><circle cx="130" cy="${y + 3}" r="1.6" fill="#3f9a3a"/><circle cx="180" cy="${y + 3}" r="1.6" fill="#d6402a"/>` },
    bacon: { h: 6, d: y =>
      `<path d="M30 ${y + 3} q14 -5 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#7a2414" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M30 ${y + 3} q14 -5 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#b8432f" stroke-width="5" stroke-linecap="round"/>` },
    jalapenos: { h: 4, d: y =>
      [64, 108, 152, 190].map(x => `<ellipse cx="${x}" cy="${y + 2}" rx="13" ry="3" fill="#4f9a2c" stroke="#2f6a16" stroke-width="1.5"/>`).join('') },
    pickles:   { h: 4, d: (y, i) => {
      const x = 62 + ((i * 53) % 116);
      return `<ellipse cx="${x}" cy="${y + 2}" rx="22" ry="3.5" fill="#7da33c" stroke="#4b6d1b" stroke-width="2"/>`;
    } },
    red_onion: { h: 6, d: y =>
      `<rect x="48" y="${y}" width="22" height="6" rx="3" fill="#f4e4f1" stroke="#8a3a86" stroke-width="2.5"/>` +
      `<rect x="170" y="${y}" width="22" height="6" rx="3" fill="#f4e4f1" stroke="#8a3a86" stroke-width="2.5"/>` },
    tomato: { h: 10, d: y =>
      `<rect x="42" y="${y}" width="156" height="10" rx="4" fill="#d63a2a" stroke="#9e2116" stroke-width="2"/>` +
      `<rect x="52" y="${y + 3}" width="136" height="4" rx="2" fill="#f0614b"/>` },
    shredded_lettuce: { h: 10, d: y => ruffle(y, 10, '#8fcf55', '#4f9a24', 6) },
    leaf_lettuce:     { h: 12, d: y => ruffle(y, 12, '#6fb83a', '#3f7f1b') },
    mushrooms: { h: 9, d: y =>
      [58, 94, 130, 166].map(x => `<path d="M${x - 17} ${y + 9} C${x - 17} ${y - 2} ${x + 17} ${y - 2} ${x + 17} ${y + 9}Z" fill="#7d5130" stroke="#4f3016" stroke-width="2"/>`).join('') },
    caramelized_onions: { h: 7, d: y =>
      `<path d="M40 ${y + 4} q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#8a4a16" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M40 ${y + 4} q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#c7803a" stroke-width="3" stroke-linecap="round"/>` },
    coleslaw: { h: 12, d: y =>
      ruffle(y, 12, '#f4f1e2', '#cfc8a8', 8) +
      `<path d="M50 ${y + 6} h6 M80 ${y + 7} h5 M120 ${y + 5} h6 M160 ${y + 7} h5" stroke="#9b4f96" stroke-width="2.5" stroke-linecap="round"/>` +
      `<path d="M64 ${y + 8} h5 M100 ${y + 6} h6 M140 ${y + 8} h5 M182 ${y + 6} h5" stroke="#f08a24" stroke-width="2.5" stroke-linecap="round"/>` },
    special_sauce: { h: 5, d: y => sauceSide(y, '#f7b0a0', '#c0644a') },
    garlic_aioli:  { h: 5, d: y => sauceSide(y, '#f8f2dc', '#c9bd93') },
    herb_mayo:     { h: 5, d: y => sauceSide(y, '#e6f0c8', '#8fa65a') },
    honey_mustard: { h: 5, d: y => sauceSide(y, '#f0b429', '#a87400') },
    bbq_sauce:     { h: 5, d: y => sauceSide(y, '#6e2a14', '#3d1608') },
    spicy_mayo:    { h: 5, d: y => sauceSide(y, '#ee6a3a', '#a8401a') },
  };

  const heel = (y, b) =>
    `<path d="M30 ${y} H210 V${y + 12} Q210 ${y + 26} 192 ${y + 26} H48 Q30 ${y + 26} 30 ${y + 12}Z" fill="${b.base}" stroke="${b.dark}" stroke-width="2.5"/>` +
    `<rect x="32" y="${y + 1}" width="176" height="5" fill="${b.crumb}"/>`;

  const crown = (y, b) =>
    `<path d="M26 ${y + 58} C26 ${y + 8} 70 ${y} 120 ${y} C170 ${y} 214 ${y + 8} 214 ${y + 58}Z" fill="${b.base}" stroke="${b.dark}" stroke-width="2.5"/>` +
    `<rect x="28" y="${y + 52}" width="184" height="5" fill="${b.crumb}"/>` +
    `<ellipse cx="88" cy="${y + 18}" rx="30" ry="8" fill="#fff" opacity="${b.shine}" transform="rotate(-12 88 ${y + 18})"/>` +
    (b.seeds ? [[70, 24], [100, 12], [135, 14], [160, 26], [115, 30], [186, 40], [54, 40], [88, 38], [145, 38]]
      .map(([x, dy]) => `<ellipse cx="${x}" cy="${y + dy}" rx="4" ry="2" fill="#fff6dc" stroke="#d9c08a" stroke-width=".7"/>`).join('') : '');

  // ---------- Fallback for ingredients without art ----------
  function colorFor(id) {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `hsl(${h} 60% 55%)`;
  }
  const genericTop = id =>
    `<circle cx="100" cy="100" r="62" fill="${colorFor(id)}" stroke="#0003" stroke-width="4"/>` +
    `<text x="100" y="114" text-anchor="middle" font-size="44" font-weight="700" fill="#fff">${id[0].toUpperCase()}</text>`;
  const genericSide = id => ({ h: 10, d: y => `<rect x="36" y="${y}" width="168" height="10" rx="5" fill="${colorFor(id)}" stroke="#0003" stroke-width="2"/>` });

  const topArt = id => BUNS[id] ? bunCrown(BUNS[id]) : (TOP[id] ? TOP[id]() : genericTop(id));
  const sideOf = id => SIDE[id] || genericSide(id);

  return {
    isBun: id => !!BUNS[id],

    // Picture for the drawer buttons
    icon(id) {
      // Single-piece layers (one pickle chip) are drawn off-center on the bun; center + enlarge for the drawer.
      const art = id === 'pickles'
        ? `<g transform="translate(100 100) scale(3.2) translate(-100 -58)">${topArt(id)}</g>`
        : topArt(id);
      return `<svg viewBox="0 0 200 200" aria-hidden="true">${art}</svg>`;
    },

    // Bird's-eye view of what's on the board (bottom -> top)
    top(ings, { dropLast = false, crownDrop = false } = {}) {
      let s = '';
      ings.forEach((id, i) => {
        const isBase = i === 0 && BUNS[id];
        const inner = isBase ? bunCut(BUNS[id]) : topArt(id);
        const rot = isBase ? 0 : (i * 47) % 360;
        const cls = dropLast && i === ings.length - 1 ? 'drop' : '';
        s += `<g class="${cls}"><g transform="rotate(${rot} 100 100)">${inner}</g></g>`;
      });
      if (crownDrop && BUNS[ings[0]]) s += `<g class="drop">${bunCrown(BUNS[ings[0]])}</g>`;
      return `<svg class="top-svg" viewBox="0 0 200 200" role="img" aria-label="Burger seen from above">${s}</svg>`;
    },

    // Side view of a stack (bottom -> top). closed adds the top bun.
    side(ings, closed = true) {
      const items = ings.map((id, i) => ({ id, i, kind: i === 0 && BUNS[id] ? 'heel' : 'layer' }));
      if (closed && ings.length && BUNS[ings[0]]) items.push({ id: ings[0], i: ings.length, kind: 'crown' });
      const hs = items.map(it => it.kind === 'heel' ? 26 : it.kind === 'crown' ? 58 : sideOf(it.id).h);
      const pad = 18;
      const H = Math.max(hs.reduce((a, b) => a + b, 0) + pad * 2, 60);
      let y = H - pad;
      let s = `<ellipse cx="120" cy="${H - pad + 2}" rx="104" ry="7" fill="#000" opacity=".13"/>`;
      items.forEach((it, k) => {
        y -= hs[k];
        if (it.kind === 'heel') s += heel(y, BUNS[it.id]);
        else if (it.kind === 'crown') s += crown(y, BUNS[it.id]);
        else s += sideOf(it.id).d(y, it.i);
      });
      return `<svg class="side-svg" viewBox="0 0 240 ${H}" role="img" aria-label="Burger side view">${s}</svg>`;
    },
  };
})();
