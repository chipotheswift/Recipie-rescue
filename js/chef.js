// Chef Marco: the kitchen mentor who delivers feedback in a speech bubble.
// CHEF.render(msg, mode, k) -> HTML. msg = { type: 'info'|'good'|'bad', html } or null.
const CHEF = (() => {
  let lastKey = null; // only animate when the message actually changes

  function fallback(mode, k) {
    if (mode === 'quiz') return k.closed
      ? { type: 'good', html: 'Order up! Send it out.' }
      : { type: 'info', html: 'Follow the ticket. No hints in the quiz. You\'ve got this!' };
    if (k.closed) return { type: 'good', html: 'Looking good!' };
    return k.built.length
      ? { type: 'good', html: 'Keep going, you\'re doing great.' }
      : { type: 'info', html: 'Every build starts with the <b>bottom bun</b>.' };
  }

  // Face + arm change with mood.
  function face(mood) {
    const ink = '#3b2416';
    const eyes = mood === 'good'
      ? `<path d="M82 99 q6 -7 12 0 M106 99 q6 -7 12 0" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`
      : `<circle cx="88" cy="98" r="4" fill="${ink}"/><circle cx="112" cy="98" r="4" fill="${ink}"/>
         <circle cx="89.5" cy="96.5" r="1.3" fill="#fff"/><circle cx="113.5" cy="96.5" r="1.3" fill="#fff"/>`;
    const brows = mood === 'bad'
      ? `<path d="M80 86 l14 5 M120 86 l-14 5" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`
      : mood === 'good'
        ? `<path d="M80 86 q8 -6 15 -1 M120 86 q-8 -6 -15 -1" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`
        : `<path d="M81 88 q7 -3 14 0 M119 88 q-7 -3 -14 0" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;
    const mouth = mood === 'good'
      ? `<path d="M88 123 q12 16 24 0 z" fill="#a8322a" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`
      : mood === 'bad'
        ? `<ellipse cx="100" cy="127" rx="6" ry="5" fill="#a8322a" stroke="${ink}" stroke-width="2"/>`
        : `<path d="M91 124 q9 7 18 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    return brows + eyes + mouth;
  }

  function svg(mood) {
    const line = '#3b2f2a';
    const puff = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${line}" stroke-width="3"/>`;
    const puffFill = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r - 2.5}" fill="#fff"/>`;
    const puffs = [[70, 46, 21], [100, 30, 26], [130, 46, 21], [86, 36, 18], [114, 36, 18]];
    const stache = 'M100 116 C92 108 78 108 71 116 C68 120 62 119 61 113 C60 124 80 129 100 120 Z';
    return `
<svg class="chef-svg" viewBox="0 0 200 290" role="img" aria-label="Chef Marco">
  <defs>
    <pattern id="chefCheck" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#f4f4f4"/><rect width="4" height="4" fill="#2b2b2b"/><rect x="4" y="4" width="4" height="4" fill="#2b2b2b"/>
    </pattern>
  </defs>
  <!-- legs + shoes -->
  <rect x="68" y="236" width="28" height="38" fill="url(#chefCheck)" stroke="${line}" stroke-width="3"/>
  <rect x="104" y="236" width="28" height="38" fill="url(#chefCheck)" stroke="${line}" stroke-width="3"/>
  <ellipse cx="80" cy="278" rx="18" ry="8" fill="#222"/><ellipse cx="120" cy="278" rx="18" ry="8" fill="#222"/>
  <!-- left arm: hand on hip -->
  <path d="M64 150 Q38 182 70 204" fill="none" stroke="${line}" stroke-width="24" stroke-linecap="round"/>
  <path d="M64 150 Q38 182 70 204" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round"/>
  <!-- jacket (double-breasted) -->
  <path d="M58 146 Q100 128 142 146 L148 242 L52 242 Z" fill="#fff" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M84 138 L116 168 L116 242" fill="none" stroke="#d8d8d8" stroke-width="3"/>
  ${[166, 186, 206].map(y => `<circle cx="92" cy="${y}" r="3.6" fill="${line}"/><circle cx="128" cy="${y}" r="3.6" fill="${line}"/>`).join('')}
  <!-- apron -->
  <path d="M64 214 L136 214 L140 260 L60 260 Z" fill="#fafafa" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M60 214 H140" stroke="${line}" stroke-width="4"/>
  <circle cx="70" cy="207" r="9" fill="#f5c9a0" stroke="${line}" stroke-width="3"/>
  <!-- neckerchief (tricolore) -->
  <path d="M82 136 L118 136 L100 158 Z" fill="#d6332a" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M82 136 h12 l-4 6 z" fill="#2e9a4a"/><path d="M106 136 h12 l-8 6 z" fill="#2e9a4a"/>
  <!-- ears + head -->
  <circle cx="66" cy="103" r="8" fill="#f0b98d" stroke="${line}" stroke-width="3"/>
  <circle cx="134" cy="103" r="8" fill="#f0b98d" stroke="${line}" stroke-width="3"/>
  <ellipse cx="100" cy="104" rx="35" ry="36" fill="#f5c9a0" stroke="${line}" stroke-width="3"/>
  <circle cx="78" cy="113" r="6" fill="#f2907a" opacity=".55"/><circle cx="122" cy="113" r="6" fill="#f2907a" opacity=".55"/>
  ${face(mood)}
  <ellipse cx="100" cy="108" rx="7" ry="6" fill="#e9a77c" stroke="${line}" stroke-width="2"/>
  <path d="${stache}" fill="#3b2416"/><path d="${stache}" fill="#3b2416" transform="translate(200 0) scale(-1 1)"/>
  <!-- toque -->
  ${puffs.map(p => puff(...p)).join('')}${puffs.map(p => puffFill(...p)).join('')}
  <rect x="64" y="52" width="72" height="26" rx="5" fill="#fff" stroke="${line}" stroke-width="3"/>
  <path d="M80 56 v18 M100 56 v18 M120 56 v18" stroke="#e2e2e2" stroke-width="3"/>
  <!-- right arm holding a spatula -->
  <g class="chef-arm">
    <path d="M138 152 Q166 156 168 122" fill="none" stroke="${line}" stroke-width="24" stroke-linecap="round"/>
    <path d="M138 152 Q166 156 168 122" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round"/>
    <path d="M168 112 L170 66" stroke="#7a4a22" stroke-width="7" stroke-linecap="round"/>
    <path d="M169 70 L170 62" stroke="#9aa0a6" stroke-width="5"/>
    <rect x="154" y="26" width="32" height="38" rx="5" fill="#c9ced4" stroke="#555b62" stroke-width="3"/>
    <path d="M162 34 v22 M170 34 v22 M178 34 v22" stroke="#8e959c" stroke-width="3" stroke-linecap="round"/>
    <circle cx="168" cy="116" r="9" fill="#f5c9a0" stroke="${line}" stroke-width="3"/>
  </g>
</svg>`;
  }

  function render(msg, mode, k) {
    const m = msg || fallback(mode, k);
    const key = mode + '|' + m.type + '|' + m.html;
    const fresh = key !== lastKey;
    lastKey = key;
    return `
    <div class="chef mood-${m.type} ${fresh ? 'fresh' : ''}" aria-live="polite">
      <div class="chef-bubble">
        <div class="chef-text">${m.html}</div>
      </div>
      <div class="chef-figure">${svg(m.type)}<div class="chef-name">Chef Marco</div></div>
    </div>`;
  }

  return { render };
})();
