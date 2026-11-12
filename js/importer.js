// =============================================================
//  IMPORTER — turn a menu (photo, PDF or pasted text) into draft recipes.
//  Runs fully in the browser: Tesseract.js reads photos, pdf.js reads PDFs,
//  and simple rules build each item in the STANDARD ORDER below.
//  Libraries are only downloaded the first time an owner imports something.
//
//  Rule: only ingredients the menu actually names are used, plus the
//  basics every item needs (a bun and a protein). Nothing else is invented.
// =============================================================

const Importer = (() => {
  const TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // ---------- word → ingredient rules (order matters: specific first) ----------
  const RULES = [
    // buns
    [/brioche/, 'brioche_bun'], [/potato (bun|roll)/, 'potato_bun'], [/sesame/, 'sesame_bun'],
    // proteins
    [/(crispy|fried|breaded|buttermilk|southern) chicken|chicken tenders?/, 'crispy_chicken'],
    [/grilled chicken|chicken breast/, 'grilled_chicken'],
    [/bacon/, 'bacon'],
    // cheeses
    [/pepper ?jack/, 'pepper_jack'], [/american/, 'american'], [/swiss/, 'swiss'],
    [/provolone/, 'provolone'], [/cheddar/, 'cheddar'],
    // sauces
    [/spicy (mayo|aioli)|sriracha mayo|chipotle mayo/, 'spicy_mayo'],
    [/(special|house|secret|burger) sauce/, 'special_sauce'],
    [/aioli/, 'garlic_aioli'], [/honey mustard/, 'honey_mustard'],
    [/bbq|barbe(c|q)ue/, 'bbq_sauce'], [/mayo(nnaise)?/, 'herb_mayo'],
    // produce
    [/(caramelized|grilled|sauteed|sautéed) onions?/, 'caramelized_onions'],
    [/mushrooms?/, 'mushrooms'], [/jalape(n|ñ)os?/, 'jalapenos'],
    [/(red )?onions?/, 'red_onion'], [/pickles?/, 'pickles'], [/tomato(es)?/, 'tomato'],
    [/(leaf|green leaf|romaine|butter) lettuce|lettuce leaf/, 'leaf_lettuce'], [/lettuce/, 'shredded_lettuce'],
    [/cole ?slaw|slaw/, 'coleslaw'],
  ];

  // Standard build order, bottom to top (after the bun and bottom sauce).
  const PRODUCE_ORDER = ['mushrooms', 'caramelized_onions', 'jalapenos', 'red_onion', 'pickles', 'tomato', 'leaf_lettuce', 'shredded_lettuce', 'coleslaw'];
  const QTY = { pickles: 3, bacon: 2 };
  const SANDWICH = /burger|sandwich|melt|club|slider|\bsub\b|hoagie|chicken|patty|smash/;
  // Document headings that mention food words but are not menu items.
  const NOT_ITEM = /standards?|stations?|manual|\bpart\s*\d|section|chapter|training|reference|golden rule|welcome|\bmenu\b/i;
  const NUMBERED = /^#?\d{1,2}[.)]\s+/;

  function findIngredients(text) {
    let t = ' ' + text.toLowerCase() + ' ';
    const found = [];
    for (const [re, id] of RULES) {
      const g = new RegExp(re.source, 'g');
      let m;
      while ((m = g.exec(t))) {
        if (!found.includes(id)) found.push(id);
        t = t.slice(0, m.index) + ' '.repeat(m[0].length) + t.slice(m.index + m[0].length); // consume
      }
    }
    // Main protein: chicken words first, else a burger means beef.
    const lower = text.toLowerCase();
    if (!found.some(i => i === 'crispy_chicken' || i === 'grilled_chicken')) {
      if (/chicken/.test(lower)) found.push('grilled_chicken');
      else if (/beef|patty|patties|angus|smash|burger|melt|slider|wagyu/.test(lower)) found.push('beef_patty');
    }
    // Generic "cheese" with no type named → American.
    if (/cheese/.test(lower) && !found.some(i => INGREDIENTS[i]?.category === 'cheese')) found.push('american');
    // "Caramelized onions … soft onions": a bare "onions" there isn't a raw red onion.
    if (found.includes('caramelized_onions') && !/red onion|onion ring/.test(lower)) {
      const i = found.indexOf('red_onion');
      if (i >= 0) found.splice(i, 1);
    }
    return found;
  }

  // ---------- standard configuration ----------
  function standardSteps(found) {
    const by = cat => found.filter(i => INGREDIENTS[i]?.category === cat);
    const bun = by('bread')[0] || 'brioche_bun';
    const sauces = by('sauce');
    const main = found.find(i => ['beef_patty', 'grilled_chicken', 'crispy_chicken'].includes(i));
    const cheeses = by('cheese');
    const produce = PRODUCE_ORDER.filter(i => found.includes(i));
    const s = (ing, note, extra = {}) => ({ ing, qty: QTY[ing] || 1, note, ...extra });

    const steps = [s(bun, `Bottom ${INGREDIENTS[bun].name.toLowerCase()}, cut side up.`)];
    if (sauces[0]) steps.push(s(sauces[0], 'Sauce on the bottom bun flavors the first bite.'));
    if (main) steps.push(s(main, 'The hot protein goes on next.'));
    cheeses.forEach(c => steps.push(s(c, 'Cheese directly on the hot protein so it melts.')));
    if (found.includes('bacon')) steps.push(s('bacon', 'Bacon pressed into the melted cheese so it stays put.'));
    produce.forEach(p => steps.push(s(p, 'Toppings go on after the cheese.')));
    if (sauces.length) steps.push(s(sauces[1] || sauces[0], 'Sauce on the top bun, then close the bun.', { top: true }));
    return steps;
  }

  function standardMods(steps) {
    const ids = steps.map(s => s.ing);
    const mods = ids.filter(i => INGREDIENTS[i].category === 'produce').slice(0, 2).map(ing => ({ type: 'remove', ing }));
    const cheese = ids.find(i => INGREDIENTS[i].category === 'cheese');
    if (cheese) mods.push({ type: 'extra', ing: cheese });
    if (ids.includes('bacon')) mods.push({ type: 'extra', ing: 'bacon' });
    return mods;
  }

  // ---------- text → items ----------
  const PRICE = /(\$\s*\d{1,3}(?:[.,]\d{2})?|\b\d{1,3}[.,]\d{2})\s*$/;
  const tidy = s => s.replace(/[.·_…\-–—|]{2,}/g, ' ').replace(/\s+/g, ' ').replace(/^[\s•*·\-–—]+|[\s•*·\-–—:]+$/g, '').trim();
  const titleCase = s => s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  function parse(text) {
    let lines = text.split(/\r?\n/).map(tidy).filter(l => l.length >= 3);
    // A price alone on its own line belongs to the line above.
    lines = lines.reduce((out, l) => {
      if (/^\$?\s*\d{1,3}([.,]\d{2})?$/.test(l) && out.length) out[out.length - 1] += ' ' + l;
      else out.push(l);
      return out;
    }, []);

    const hasPrices = lines.some(l => PRICE.test(l));
    const blocks = [];
    let category = 'Imported', open = null; // open = the item new lines describe
    for (const l of lines) {
      const isPriced = PRICE.test(l);
      const words = l.split(' ').length;
      const isHeading = !isPriced && words <= 4 && (l === l.toUpperCase() || l.endsWith(':')) && /[A-Za-z]/.test(l);
      const isName = !NOT_ITEM.test(l) && (hasPrices
        ? isPriced
        : (SANDWICH.test(l.toLowerCase()) || NUMBERED.test(l)) && words <= 6 && !/[.!]$/.test(l));
      if (isName) {
        open = { name: titleCase(tidy(l.replace(PRICE, '').replace(NUMBERED, ''))), desc: '', category };
        blocks.push(open);
      } else if (isHeading) {
        category = titleCase(l.replace(/:$/, '').replace(/^part\s*\d+\s*/i, '')) || category;
        open = null; // a new heading ends the previous item's description
      } else if (open) open.desc += (open.desc ? ' ' : '') + l;
    }
    return blocks;
  }

  function build(text, existingNames = []) {
    const items = [], skipped = [];
    const taken = new Set(existingNames.map(n => n.toLowerCase()));
    for (const b of parse(text)) {
      if (!b.name || b.name.length < 3) continue;
      if (taken.has(b.name.toLowerCase())) { skipped.push({ name: b.name, reason: 'already on the menu' }); continue; }
      // The menu heading counts as context: "The Classic" under BURGERS is a burger.
      const all = b.name + ' ' + b.desc + (SANDWICH.test(b.category.toLowerCase()) ? ' ' + b.category : '');
      if (!SANDWICH.test(all.toLowerCase())) { skipped.push({ name: b.name, reason: 'not a burger or sandwich' }); continue; }
      const found = findIngredients(all);
      const steps = standardSteps(found);
      if (!steps.some(s => INGREDIENTS[s.ing].category === 'protein')) { skipped.push({ name: b.name, reason: 'no burger or chicken named' }); continue; }
      taken.add(b.name.toLowerCase());
      items.push({
        id: 'imp_' + slug(b.name) + '_' + Date.now().toString(36).slice(-4),
        name: b.name,
        station: b.category,
        difficulty: 'Imported',
        description: b.desc || 'Imported from the menu.',
        steps,
        mods: standardMods(steps),
        imported: true,
        edited: false,
        source: all,
      });
    }
    return { items, skipped };
  }

  // Rebuild an imported item's standard configuration from its source text.
  function restandard(r) {
    const steps = standardSteps(findIngredients(r.source));
    return { ...r, steps, mods: standardMods(steps), edited: false };
  }

  // ---------- readers ----------
  const loaded = {};
  function loadScript(src) {
    return loaded[src] || (loaded[src] = new Promise((res, rej) => {
      const el = document.createElement('script');
      el.src = src; el.onload = res;
      el.onerror = () => { delete loaded[src]; rej(new Error('Could not download the reader. Are you online?')); };
      document.head.appendChild(el);
    }));
  }

  // Grayscale + upscale small photos: cheap and helps OCR a lot.
  function prepImage(file) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(3, Math.max(1, 1800 / Math.max(img.width, img.height)));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        const x = c.getContext('2d');
        x.filter = 'grayscale(1) contrast(1.4)';
        x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        res(c);
      };
      img.onerror = () => rej(new Error('That image could not be opened.'));
      img.src = URL.createObjectURL(file);
    });
  }

  async function readImage(file, onProgress = () => {}) {
    onProgress('Downloading the photo reader (first time only)…');
    await loadScript(TESSERACT);
    const canvas = await prepImage(file);
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => { if (m.status === 'recognizing text') onProgress(`Reading the photo… ${Math.round(m.progress * 100)}%`); },
    });
    try { return (await worker.recognize(canvas)).data.text; }
    finally { await worker.terminate(); }
  }

  async function readPdf(file, onProgress = () => {}) {
    onProgress('Downloading the PDF reader (first time only)…');
    await loadScript(PDFJS);
    const lib = window['pdfjs-dist/build/pdf'];
    lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      onProgress(`Reading page ${p} of ${pdf.numPages}…`);
      const content = await (await pdf.getPage(p)).getTextContent();
      for (const it of content.items) text += it.str + (it.hasEOL ? '\n' : '');
      text += '\n';
    }
    return text;
  }

  async function readFile(file, onProgress) {
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return readPdf(file, onProgress);
    if (file.type.startsWith('image/')) return readImage(file, onProgress);
    throw new Error('Please choose a photo (JPG, PNG, WebP) or a PDF.');
  }

  return { build, restandard, readFile, findIngredients };
})();
