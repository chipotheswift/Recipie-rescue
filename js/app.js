// =============================================================
//  APP — screens and game logic. Plain JS, no framework.
//  Screens: home · login · hub · kitchen · results · owner · flashcards
//  Kitchen modes: tutorial · training · quiz (same kitchen, different help)
// =============================================================

(() => {
  const $app = document.getElementById('app');

  const S = {
    screen: 'home',
    emp: null,        // current employee name
    k: null,          // kitchen state
    result: null,     // last quiz result
    ownerOpen: null,  // expanded employee row on owner page
    fc: null,         // flashcard session
    imp: { status: '', error: false, busy: false, last: null }, // menu import
    timer: null,
  };

  // Imported menu items live in the Store; mirror them into RECIPES so
  // tutorial, training, quiz and flashcards all pick them up automatically.
  function syncImported() {
    for (let i = RECIPES.length - 1; i >= 0; i--) if (RECIPES[i].imported) RECIPES.splice(i, 1);
    RECIPES.push(...Store.imported());
  }
  syncImported();

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ing = id => INGREDIENTS[id] || { name: id, category: '?' };
  const ingName = id => ing(id).name;
  const catName = id => (CATEGORIES.find(c => c.id === id) || { name: id }).name;
  const recipe = id => RECIPES.find(r => r.id === id);
  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function layerLabel(l) {
    let s = ingName(l.ing);
    if (l.top) s += ' (top bun)';
    if (l.of > 1) s += ` ${l.n}/${l.of}`;
    return s;
  }

  // ---------- recipe engine ----------
  function applyMods(steps, mods) {
    let st = steps.map(s => ({ ...s, qty: s.qty || 1 }));
    for (const m of mods) {
      if (m.type === 'remove') st = st.filter(s => s.ing !== m.ing);
      else if (m.type === 'extra') { const s = st.find(s => s.ing === m.ing); if (s) s.qty += 1; }
      else if (m.type === 'add') {
        const i = st.findIndex(s => s.ing === m.after);
        st.splice(i + 1, 0, { ing: m.ing, qty: m.qty || 1, note: 'Added at the customer\'s request.' });
      }
    }
    return st;
  }

  function expand(steps) {
    const out = [];
    steps.forEach(s => { for (let n = 1; n <= s.qty; n++) out.push({ ing: s.ing, n, of: s.qty, top: !!s.top, note: s.note }); });
    return out;
  }

  const modText = m => ({ remove: 'NO ', extra: 'EXTRA ', add: 'ADD ' }[m.type] + ingName(m.ing).toUpperCase());

  function makeItem(recipeId, mods = []) {
    const layers = expand(applyMods(recipe(recipeId).steps, mods));
    return { recipeId, mods, layers, expected: layers.map(l => l.ing) };
  }

  // Simplest scoring: layer-by-layer match. Exact match = 100%.
  function grade(expected, built) {
    const n = Math.max(expected.length, built.length);
    const rows = [];
    let ok = 0;
    for (let i = 0; i < n; i++) {
      const match = expected[i] === built[i];
      if (match) ok++;
      rows.push({ e: expected[i], b: built[i], match });
    }
    return { score: n ? Math.round((ok / n) * 100) : 0, rows };
  }

  // ---------- kitchen ----------
  function startKitchen(mode, recipeId) {
    const settings = Store.settings();
    let items;
    if (mode === 'quiz') {
      // Shuffle so a ticket gets different menu items (repeats only if items > menu size)
      const deck = [...RECIPES].sort(() => Math.random() - 0.5);
      items = Array.from({ length: settings.itemsPerTicket }, (_, i) => {
        const r = deck[i % deck.length];
        const mods = Math.random() < settings.modChance && r.mods.length ? [pick(r.mods)] : [];
        return makeItem(r.id, mods);
      });
    } else {
      items = [makeItem(recipeId)];
    }
    S.k = {
      mode, items, idx: 0,
      built: [], closed: false, closing: false,
      open: null, drawerAnim: false, justPlaced: false, justClosed: false,
      hint: 0, mistakes: 0, msg: null, busy: false, peek: false,
      builds: [], start: Date.now(),
      ticketNo: 100 + Math.floor(Math.random() * 900),
    };
    if (mode === 'tutorial') say('info', 'Press <b>Next step</b> and watch, or click the glowing drawer and ingredient yourself.');
    if (mode === 'training') say('info', 'Build it from memory. Wrong picks get corrected and explained. Stuck? Press <b>Hint</b>.');
    if (mode === 'quiz') {
      say('info', 'Read the ticket. No hints, no corrections. Close the bun on each item when it\'s done.');
      S.timer = setInterval(() => {
        const el = document.getElementById('timer');
        if (el) el.textContent = fmtTime(Math.round((Date.now() - S.k.start) / 1000));
      }, 1000);
    }
    go('kitchen');
  }

  function stopTimer() { clearInterval(S.timer); S.timer = null; }
  const cur = () => S.k.items[S.k.idx];
  const nextLayer = () => cur().layers[S.k.built.length];
  function say(type, html) { S.k.msg = { type, html }; }

  function place(id) {
    const k = S.k;
    k.built.push(id);
    k.justPlaced = true;
    k.hint = 0;
  }

  function clickIngredient(id) {
    const k = S.k;
    if (k.closed || k.closing || k.busy) return;
    const isBread = ing(id).category === 'bread';

    // Kitchen rules (all modes)
    if (k.built.length === 0 && !isBread) { say('info', 'Start with the bottom bun. Open <b>Breads & Buns</b> first.'); return render(); }
    if (k.built.length > 0 && isBread) { say('info', 'The bun is already down. Press <b>Close the bun</b> to put the top on.'); return render(); }

    if (k.mode === 'quiz') { place(id); k.msg = null; return render(); }

    const want = nextLayer();

    if (k.mode === 'tutorial') {
      if (want && id === want.ing) { place(id); tutorialMsg(); }
      else say('info', 'Follow along: click the <b>glowing</b> ingredient, or press <b>Next step</b>.');
      return render();
    }

    // training
    if (!want) {
      k.mistakes++;
      say('bad', `Nothing else goes on the ${esc(recipe(cur().recipeId).name)}. Press <b>Close the bun</b>.`);
      return render();
    }
    if (id === want.ing) {
      place(id);
      say('good', `✓ <b>${esc(layerLabel(want))}</b>. ${esc(want.note || '')}`);
    } else {
      k.mistakes++;
      say('bad', wrongFeedback(id, want));
    }
    render();
  }

  function wrongFeedback(id, want) {
    const got = ing(id), w = ing(want.ing), r = recipe(cur().recipeId);
    const why = want.note ? ` <i>${esc(want.note)}</i>` : '';
    if (cur().expected.slice(S.k.built.length).includes(id))
      return `${esc(got.name)} does go on this one, just <b>not yet</b>. Next is <b>${esc(w.name)}</b>.${why}`;
    if (got.category === w.category)
      return `Not quite. The ${esc(r.name)} uses <b>${esc(w.name)}</b>, not ${esc(got.name)}.${why}`;
    return `${esc(got.name)} isn't next. The next layer is <b>${esc(w.name)}</b> from the <b>${esc(catName(w.category))}</b> drawer.${why}`;
  }

  function tutorialMsg() {
    const k = S.k, want = nextLayer();
    if (want) say('info', `<b>Step ${k.built.length + 1}:</b> ${esc(layerLabel(want))}. ${esc(want.note || '')}`);
    else say('info', '<b>Last step:</b> Close the bun to put the top on.');
  }

  function closeBun() {
    const k = S.k;
    if (k.closed || k.closing || k.busy || !k.built.length) return;
    if (k.mode !== 'quiz' && nextLayer()) {
      if (k.mode === 'training') {
        k.mistakes++;
        say('bad', `Not done yet. Still to go: <b>${esc(layerLabel(nextLayer()))}</b>.`);
      } else tutorialMsg();
      return render();
    }
    k.closing = true;
    k.busy = true;
    render();
    setTimeout(() => {
      k.closing = false; k.busy = false; k.closed = true; k.justClosed = true;
      const r = recipe(cur().recipeId);
      if (k.mode === 'tutorial') {
        Store.markDone(S.emp, 'tutorials', r.id);
        say('good', `🎉 That's a ${esc(r.name)}! Now try building it yourself in <b>Training</b>.`);
      } else if (k.mode === 'training') {
        Store.markDone(S.emp, 'training', r.id);
        say('good', k.mistakes === 0
          ? `🎉 Perfect ${esc(r.name)} with zero mistakes!`
          : `✓ ${esc(r.name)} done, with ${k.mistakes} mistake${k.mistakes > 1 ? 's' : ''} along the way. Go again for a clean run.`);
      } else {
        k.msg = null;
      }
      render();
    }, 650);
  }

  function undo() {
    const k = S.k;
    if (k.mode === 'quiz' || k.busy) return;
    if (k.closed) k.closed = false;
    else k.built.pop();
    if (k.mode === 'tutorial') tutorialMsg(); else k.msg = null;
    render();
  }

  function tutorialNext() {
    const k = S.k;
    if (k.busy || k.closed) return;
    const want = nextLayer();
    if (!want) return closeBun();
    const cat = ing(want.ing).category;
    k.busy = true;
    if (k.open !== cat) { k.open = cat; k.drawerAnim = true; }
    say('info', `<b>Step ${k.built.length + 1}:</b> ${esc(layerLabel(want))}. ${esc(want.note || '')}`);
    render();
    setTimeout(() => {
      place(want.ing);
      k.busy = false;
      tutorialMsg();
      render();
    }, k.drawerAnim ? 750 : 450);
  }

  function hint() {
    const k = S.k, want = nextLayer();
    if (!want) { say('info', 'Everything is on. Press <b>Close the bun</b>.'); return render(); }
    k.hint = Math.min(k.hint + 1, 2);
    if (k.hint === 1) say('info', `💡 Look in the <b>${esc(catName(ing(want.ing).category))}</b> drawer.`);
    else say('info', `💡 It's the <b>${esc(layerLabel(want))}</b>. ${esc(want.note || '')}`);
    render();
  }

  function nextItem() {
    const k = S.k;
    k.builds.push([...k.built]);
    k.idx++;
    Object.assign(k, { built: [], closed: false, open: null, msg: null });
    render();
  }

  function submitQuiz() {
    const k = S.k;
    k.builds.push([...k.built]);
    stopTimer();
    const timeSec = Math.round((Date.now() - k.start) / 1000);
    const items = k.items.map((it, i) => ({ ...it, built: k.builds[i], ...grade(it.expected, k.builds[i]) }));
    const score = Math.round(items.reduce((a, it) => a + it.score, 0) / items.length);
    const missed = [...new Set(items.flatMap(it => it.rows.filter(r => !r.match && r.e).map(r => r.e)))];
    Store.addQuiz(S.emp, { date: new Date().toISOString(), score, timeSec, missed });
    S.result = { score, timeSec, items, ticketNo: k.ticketNo };
    go('results');
  }

  // ---------- status ----------
  function statusOf(e) {
    const thr = Store.settings().passThreshold;
    const last = e.quizzes[e.quizzes.length - 1];
    if (last) return last.score >= thr ? ['Ready', 'ready'] : ['Needs practice', 'warn'];
    if (!e.tutorials.length && !e.training.length) return ['Not started', 'muted'];
    if (e.training.length >= RECIPES.length) return ['Quiz pending', 'info'];
    return ['In training', 'info'];
  }

  // =============================================================
  //  VIEWS
  // =============================================================
  function vHome() {
    return `
    <main class="home">
      <div class="hero">
        <div class="hero-burger">${ART.side(RECIPES[0].steps.flatMap(s => Array(s.qty || 1).fill(s.ing)), true)}</div>
        <h1>Restaurant Trainer</h1>
        <p class="tag">Learn the recipe. Practice the recipe. Prove you can make the recipe.</p>
      </div>
      <div class="role-cards">
        <button class="role-card" data-act="go" data-arg="login">
          <span class="role-emoji">🧑‍🍳</span>
          <b>I'm an employee</b>
          <span>Tutorials, practice and the line-ready quiz</span>
        </button>
        <button class="role-card" data-act="go" data-arg="owner">
          <span class="role-emoji">📋</span>
          <b>I'm the owner</b>
          <span>See who's ready for the line</span>
        </button>
      </div>
      <p class="fine">Demo build: accounts are simulated and saved in this browser only.</p>
    </main>`;
  }

  function vLogin() {
    const names = Object.keys(Store.all());
    return `
    <main class="narrow">
      <button class="link" data-act="go" data-arg="home">← Home</button>
      <h1>Employee sign-in</h1>
      <form id="login-form" class="card form">
        <label>Restaurant
          <select name="restaurant"><option>${esc(RESTAURANT.name)}</option></select>
        </label>
        <label>Your name
          <input name="name" required maxlength="40" placeholder="e.g. Jamie Smith" autocomplete="off">
        </label>
        <button class="btn primary big" type="submit">Start →</button>
      </form>
      <p class="muted">Or continue as:</p>
      <div class="chips">${names.map(n => `<button class="chip" data-act="login" data-arg="${esc(n)}">${esc(n)}</button>`).join('')}</div>
    </main>`;
  }

  function vHub() {
    const e = Store.employee(S.emp);
    const [st, cls] = statusOf(e);
    const last = e.quizzes[e.quizzes.length - 1];
    const set = Store.settings();
    return `
    <main class="wide">
      <header class="topbar">
        <div><div class="eyebrow">${esc(RESTAURANT.name)}</div><h1>Hi, ${esc(S.emp)} 👋</h1></div>
        <div class="row">
          <span class="pill ${cls}">${st}</span>
          <button class="btn ghost" data-act="go" data-arg="login">Switch user</button>
          <button class="btn ghost" data-act="go" data-arg="home">Home</button>
        </div>
      </header>

      <section class="progress card">
        <div><b>${e.tutorials.length}/${RECIPES.length}</b><span>Tutorials</span></div>
        <div><b>${e.training.length}/${RECIPES.length}</b><span>Trained</span></div>
        <div><b>${last ? last.score + '%' : '—'}</b><span>Last quiz</span></div>
        <div><b>${e.quizzes.length}</b><span>Quiz attempts</span></div>
      </section>

      <section class="quiz-cta card">
        <div>
          <h2>🎫 Line-ready quiz</h2>
          <p>1 ticket · ${set.itemsPerTicket} item${set.itemsPerTicket > 1 ? 's' : ''} · timed · no hints · pass mark ${set.passThreshold}%</p>
        </div>
        <button class="btn primary big" data-act="quiz">Start quiz</button>
      </section>

      <section class="card fc-cta">
        <div>
          <h2>🃏 Flashcards</h2>
          <p>Quick recall: what goes on next, and why. Built from the same recipes as the game.</p>
        </div>
        <div class="chips">
          <button class="chip strong" data-act="fc-start" data-arg="all">Whole menu (shuffled)</button>
          ${RECIPES.map(r => `<button class="chip" data-act="fc-start" data-arg="${r.id}">${esc(r.name)}</button>`).join('')}
        </div>
      </section>

      <div class="golden"><b>Line cook golden rule:</b> ${esc(RESTAURANT.goldenRule)}</div>

      <h2 class="section-h">Menu</h2>
      <section class="menu-grid">
        ${RECIPES.map(r => {
          const tut = e.tutorials.includes(r.id), tr = e.training.includes(r.id);
          return `
          <article class="menu-card card">
            <div class="menu-art">${ART.side(makeItem(r.id).expected, true)}</div>
            <div class="menu-body">
              <div class="eyebrow">${esc(r.station)} · ${esc(r.difficulty)}</div>
              <h3>${esc(r.name)}</h3>
              <p>${esc(r.description)}</p>
              <div class="badges">
                <span class="badge ${tut ? 'on' : ''}">${tut ? '✓' : '○'} Tutorial</span>
                <span class="badge ${tr ? 'on' : ''}">${tr ? '✓' : '○'} Training</span>
              </div>
              <div class="row">
                <button class="btn" data-act="tutorial" data-arg="${r.id}">▶ Tutorial</button>
                <button class="btn primary" data-act="training" data-arg="${r.id}">Train</button>
              </div>
            </div>
          </article>`;
        }).join('')}
      </section>
    </main>`;
  }

  function vKitchen() {
    const k = S.k, item = cur(), r = recipe(item.recipeId);
    const want = k.mode !== 'quiz' ? nextLayer() : null;
    const showDrawerHint = want && !k.closed && (k.mode === 'tutorial' || k.hint >= 1);
    const showItemHint = want && !k.closed && (k.mode === 'tutorial' || k.hint >= 2);
    const glowCat = showDrawerHint ? ing(want.ing).category : null;
    const glowIng = showItemHint ? want.ing : null;
    const glowClose = k.mode !== 'quiz' && !want && !k.closed && k.built.length > 0;
    const modeName = { tutorial: 'Tutorial', training: 'Training', quiz: 'Quiz' }[k.mode];

    // Cabinet: drawers stacked vertically, open UPWARD (body above the front)
    const cabinet = CATEGORIES.map(c => {
      const open = k.open === c.id;
      const items = Object.keys(INGREDIENTS).filter(id => ing(id).category === c.id);
      return `
      <div class="drawer ${open && !k.drawerAnim ? 'open' : ''} ${glowCat === c.id && !open ? 'glow' : ''}" data-cat="${c.id}" style="--dc:${c.color}">
        <div class="drawer-body"><div class="drawer-clip"><div class="drawer-tray">
          ${items.map(id => `<button class="ing ${glowIng === id ? 'glow' : ''}" data-act="ing" data-arg="${id}" ${k.closed ? 'disabled' : ''}>
            ${ART.icon(id)}<span>${esc(ingName(id))}</span></button>`).join('')}
        </div></div></div>
        <button class="drawer-front" data-act="drawer" data-arg="${c.id}" aria-expanded="${open}">
          <span class="knob"></span><span>${esc(c.name)}</span><span class="chev">${open ? '▼' : '▲'}</span>
        </button>
      </div>`;
    }).join('');

    // Board: overhead while building, side view once closed
    let board;
    if (k.closed) board = `<div class="side-view ${k.justClosed ? 'flip-in' : ''}">${ART.side(k.built, true)}</div>`;
    else if (!k.built.length) board = `<div class="board-empty">Pick a bun to start ↙</div>`;
    else board = ART.top(k.built, { dropLast: k.justPlaced, crownDrop: k.closing });

    const stack = k.built.length ? `
      <ol class="stack">${k.built.map((id, i) => `<li><span>${i + 1}</span>${esc(ingName(id))}</li>`).reverse().join('')}</ol>` : '';

    // Action buttons
    let actions = '';
    if (k.mode === 'tutorial') {
      actions = k.closed
        ? `<button class="btn" data-act="undo">↶ Back</button>
           <button class="btn primary" data-act="training" data-arg="${r.id}">Practice it →</button>
           <button class="btn ghost" data-act="go" data-arg="hub">Menu</button>`
        : `<button class="btn" data-act="undo" ${k.built.length ? '' : 'disabled'}>↶ Back</button>
           <button class="btn primary ${want ? 'glow-soft' : ''}" data-act="next">${want ? 'Next step ▶' : 'Close the bun ▶'}</button>`;
    } else if (k.mode === 'training') {
      actions = k.closed
        ? `<button class="btn" data-act="training" data-arg="${r.id}">↻ Train again</button>
           <button class="btn primary" data-act="go" data-arg="hub">Back to menu</button>`
        : `<button class="btn" data-act="undo" ${k.built.length ? '' : 'disabled'}>↶ Undo</button>
           <button class="btn" data-act="hint">💡 Hint</button>
           <button class="btn primary ${glowClose ? 'glow' : ''}" data-act="close" ${k.built.length ? '' : 'disabled'}>Close the bun</button>`;
    } else {
      const last = k.idx === k.items.length - 1;
      actions = k.closed
        ? (last ? `<button class="btn primary big" data-act="submit">Submit order ✓</button>`
                : `<button class="btn primary big" data-act="next-item">Next item →</button>`)
        : `<button class="btn primary" data-act="close" ${k.built.length ? '' : 'disabled'}>Close the bun</button>`;
    }

    // Side panel
    let panel = '';
    if (k.mode === 'quiz') {
      panel = `
      <div class="ticket">
        <div class="ticket-h">ORDER #${k.ticketNo}</div>
        <div class="ticket-sub">${esc(RESTAURANT.name)} · DINE IN</div>
        <div class="ticket-rule"></div>
        ${k.items.map((it, i) => `
          <div class="t-item ${i === k.idx ? 'current' : ''} ${i < k.idx ? 'done' : ''}">
            <div class="t-name">1 × ${esc(recipe(it.recipeId).name.toUpperCase())}</div>
            ${it.mods.map(m => `<div class="t-mod">** ${esc(modText(m))} **</div>`).join('')}
            ${i < k.idx ? '<div class="t-done">✓ UP</div>' : ''}
          </div>`).join('')}
        <div class="ticket-rule"></div>
        <div class="ticket-foot">Item ${k.idx + 1} of ${k.items.length}</div>
      </div>`;
    } else if (k.mode === 'tutorial') {
      panel = `
      <div class="card recipe-card">
        <div class="eyebrow">How to make</div>
        <h2>${esc(r.name)}</h2>
        <ol class="steps">
          ${item.layers.map((l, i) => `<li class="${i < k.built.length ? 'done' : i === k.built.length && !k.closed ? 'current' : ''}">${esc(layerLabel(l))}</li>`).join('')}
          <li class="${k.closed ? 'done' : !want ? 'current' : ''}">Close the bun</li>
        </ol>
      </div>`;
    } else {
      panel = `
      <div class="card recipe-card">
        <div class="eyebrow">Training: build from memory</div>
        <h2>${esc(r.name)}</h2>
        <p class="muted">Mistakes so far: <b>${k.mistakes}</b></p>
        <button class="btn ghost small" data-act="peek">${k.peek ? 'Hide' : 'Peek at'} recipe</button>
        ${k.peek ? `<ol class="steps">${item.layers.map((l, i) => `<li class="${i < k.built.length ? 'done' : ''}">${esc(layerLabel(l))}</li>`).join('')}<li>Close the bun</li></ol>` : ''}
      </div>`;
    }

    const chef = CHEF.render(k.msg, k.mode, k);

    return `
    <main class="kitchen mode-${k.mode}">
      <header class="k-top">
        <button class="btn ghost" data-act="exit">✕ Exit</button>
        <div class="k-title"><span class="pill ${k.mode}">${modeName}</span> ${k.mode === 'quiz' ? '' : esc(r.name)}</div>
        ${k.mode === 'quiz' ? `<div class="timer">⏱ <span id="timer">${fmtTime(Math.round((Date.now() - k.start) / 1000))}</span></div>` : '<div></div>'}
      </header>
      <section class="cabinet" aria-label="Ingredient cabinet">${cabinet}</section>
      <section class="station">
        <div class="board ${k.closed ? 'is-closed' : ''}">${board}</div>
        ${k.closed ? '' : stack}
        <div class="actions">${actions}</div>
      </section>
      <aside class="panel">${panel}${chef}</aside>
    </main>`;
  }

  function vResults() {
    const R = S.result, thr = Store.settings().passThreshold, pass = R.score >= thr;
    return `
    <main class="wide">
      <header class="topbar">
        <div><div class="eyebrow">Order #${R.ticketNo} · Results</div><h1>${pass ? 'Line ready! 🎉' : 'Keep practicing 💪'}</h1></div>
        <button class="btn primary" data-act="go" data-arg="hub">Back to menu</button>
      </header>
      <section class="score-row">
        <div class="score-big ${pass ? 'pass' : 'fail'}"><b>${R.score}%</b><span>${pass ? 'PASS' : `Pass mark ${thr}%`}</span></div>
        <div class="score-big"><b>${fmtTime(R.timeSec)}</b><span>Total time</span></div>
      </section>
      ${R.items.map((it, i) => `
        <section class="card result-item">
          <div class="result-head">
            <h2>${i + 1}. ${esc(recipe(it.recipeId).name)} ${it.mods.map(m => `<span class="mod-tag">${esc(modText(m))}</span>`).join('')}</h2>
            <span class="pill ${it.score === 100 ? 'ready' : 'warn'}">${it.score}%</span>
          </div>
          <div class="compare">
            <figure><div class="cmp-art">${ART.side(it.expected, true)}</div><figcaption>Expected</figcaption></figure>
            <figure><div class="cmp-art">${it.built.length ? ART.side(it.built, true) : ''}</div><figcaption>You made</figcaption></figure>
            <table class="layers">
              <thead><tr><th>#</th><th>Expected</th><th>You placed</th><th></th></tr></thead>
              <tbody>${it.rows.map((row, j) => `
                <tr class="${row.match ? 'ok' : 'bad'}"><td>${j + 1}</td><td>${row.e ? esc(ingName(row.e)) : '<i>nothing</i>'}</td>
                <td>${row.b ? esc(ingName(row.b)) : '<i>missing</i>'}</td><td>${row.match ? '✓' : '✗'}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </section>`).join('')}
      <div class="row center"><button class="btn primary big" data-act="quiz">Retake quiz</button></div>
    </main>`;
  }

  function vOwner() {
    const all = Store.all(), set = Store.settings();
    const names = Object.keys(all);
    const statuses = names.map(n => statusOf(all[n])[0]);
    const lastScores = names.map(n => all[n].quizzes.slice(-1)[0]).filter(Boolean).map(q => q.score);
    const avg = lastScores.length ? Math.round(lastScores.reduce((a, b) => a + b, 0) / lastScores.length) : '—';

    const rows = names.map(n => {
      const e = all[n], [st, cls] = statusOf(e), last = e.quizzes.slice(-1)[0];
      const open = S.ownerOpen === n;
      const missedCount = {};
      e.quizzes.forEach(q => (q.missed || []).forEach(m => { missedCount[m] = (missedCount[m] || 0) + 1; }));
      const missed = Object.entries(missedCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
      return `
      <tr class="emp-row ${open ? 'open' : ''}" data-act="owner-row" data-arg="${esc(n)}">
        <td><b>${esc(n)}</b></td>
        <td>${e.tutorials.length}/${RECIPES.length}</td>
        <td>${e.training.length}/${RECIPES.length}</td>
        <td>${e.quizzes.length}</td>
        <td>${last ? last.score + '%' : '—'}</td>
        <td>${last ? fmtTime(last.timeSec) : '—'}</td>
        <td><span class="pill ${cls}">${st}</span></td>
      </tr>
      ${open ? `<tr class="emp-detail"><td colspan="7">
        <div class="detail-grid">
          <div><h4>Quiz history</h4>${e.quizzes.length ? `<ul>${e.quizzes.map(q => `<li>${fmtDate(q.date)}: <b>${q.score}%</b> in ${fmtTime(q.timeSec)}</li>`).join('')}</ul>` : '<p class="muted">No attempts yet.</p>'}</div>
          <div><h4>Most missed</h4>${missed.length ? `<ul>${missed.map(([id, c]) => `<li>${esc(ingName(id))} ×${c}</li>`).join('')}</ul>` : '<p class="muted">Nothing yet.</p>'}</div>
          <div><h4>Not yet trained</h4>${(() => { const t = RECIPES.filter(r => !e.training.includes(r.id)); return t.length ? `<ul>${t.map(r => `<li>${esc(r.name)}</li>`).join('')}</ul>` : '<p class="muted">All items trained ✓</p>'; })()}</div>
        </div></td></tr>` : ''}`;
    }).join('');

    return `
    <main class="wide">
      <header class="topbar">
        <div><div class="eyebrow">Owner dashboard · ${esc(RESTAURANT.owner)}</div><h1>${esc(RESTAURANT.name)}</h1></div>
        <button class="btn ghost" data-act="go" data-arg="home">Home</button>
      </header>

      <section class="progress card">
        <div><b>${names.length}</b><span>Employees</span></div>
        <div><b>${statuses.filter(s => s === 'Ready').length}</b><span>Line ready</span></div>
        <div><b>${statuses.filter(s => s === 'Needs practice').length}</b><span>Need practice</span></div>
        <div><b>${avg}${avg === '—' ? '' : '%'}</b><span>Avg latest quiz</span></div>
      </section>

      <h2 class="section-h">Employees</h2>
      <div class="card table-wrap">
        <table class="emp-table">
          <thead><tr><th>Name</th><th>Tutorials</th><th>Trained</th><th>Attempts</th><th>Latest</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="muted small">Click a row for details. Status uses the latest quiz score vs. the pass mark.</p>

      <h2 class="section-h">Quiz settings</h2>
      <form id="settings-form" class="card form inline">
        <label>Items per ticket <input type="number" name="itemsPerTicket" min="1" max="5" value="${set.itemsPerTicket}"></label>
        <label>Pass mark (%) <input type="number" name="passThreshold" min="50" max="100" value="${set.passThreshold}"></label>
        <button class="btn primary" type="submit">Save</button>
        <span id="saved" class="muted"></span>
      </form>

      <h2 class="section-h">Import a menu</h2>
      <section class="card import-card">
        <p>Upload a <b>photo</b> or <b>PDF</b> of a menu, or paste its text. Each burger or sandwich is added with a
          <b>standard build order</b> right away. It only uses ingredients the menu names, plus a bun and a protein.
          Change the order below if your kitchen builds it differently.</p>
        <div class="import-grid">
          <label class="drop">
            <input type="file" id="imp-file" accept="image/*,application/pdf" ${S.imp.busy ? 'disabled' : ''}>
            <span class="drop-icon">📷</span>
            <b>Choose a photo or PDF</b>
            <span class="muted small">Read on this device. Nothing is uploaded.</span>
          </label>
          <form id="import-form" class="form">
            <label>Or paste menu text
              <textarea name="text" rows="5" placeholder="BURGERS&#10;Smokehouse Burger  $12.99&#10;Cheddar, bacon, BBQ sauce, onion on a brioche bun"></textarea>
            </label>
            <button class="btn" type="submit" ${S.imp.busy ? 'disabled' : ''}>Import text</button>
          </form>
        </div>
        <p id="imp-status" class="imp-status ${S.imp.error ? 'bad' : ''}" aria-live="polite">${esc(S.imp.status)}</p>
        ${S.imp.last && S.imp.last.skipped.length ? `<details class="muted small"><summary>Skipped ${S.imp.last.skipped.length} line${S.imp.last.skipped.length > 1 ? 's' : ''}</summary>
          <ul>${S.imp.last.skipped.map(s => `<li>${esc(s.name)}: ${esc(s.reason)}</li>`).join('')}</ul></details>` : ''}
      </section>

      <h2 class="section-h">Menu <span class="muted small">(imported items can be reordered)</span></h2>
      <section class="owner-menu">
        ${RECIPES.map(r => `
          <article class="card owner-recipe ${r.imported ? 'is-imported' : ''}">
            <div class="menu-art small">${ART.side(makeItem(r.id).expected, true)}</div>
            <div>
              <h3>${esc(r.name)}</h3>
              ${r.imported ? `<div class="row tight">
                  <span class="badge ${r.edited ? 'on' : 'auto'}">${r.edited ? '✓ Adjusted by owner' : '⚙ Auto-generated'}</span>
                  <span class="muted small">${esc(r.station)}</span></div>
                <ol class="steps compact edit">${r.steps.map((s, i) => {
                  const fixed = i === 0 || s.top;
                  const canUp = !fixed && i > 1, canDown = !fixed && i + 1 < r.steps.length && !r.steps[i + 1].top;
                  return `<li><span>${esc(stepLabel(s))}</span>
                    <span class="step-btns">
                      <button class="mini" data-act="imp-move" data-arg="${r.id}|${i}|-1" ${canUp ? '' : 'disabled'} aria-label="Move up">↑</button>
                      <button class="mini" data-act="imp-move" data-arg="${r.id}|${i}|1" ${canDown ? '' : 'disabled'} aria-label="Move down">↓</button>
                      <button class="mini" data-act="imp-drop" data-arg="${r.id}|${i}" ${i === 0 ? 'disabled' : ''} aria-label="Remove step">✕</button>
                    </span></li>`;
                }).join('')}<li>Close the bun</li></ol>
                <div class="row tight">
                  ${r.edited ? `<button class="btn ghost small" data-act="imp-reset" data-arg="${r.id}">↺ Reset to standard</button>` : ''}
                  <button class="btn ghost small" data-act="imp-remove" data-arg="${r.id}">Remove item</button>
                </div>`
              : `<ol class="steps compact">${expand(r.steps.map(s => ({ ...s, qty: s.qty || 1 }))).map(l => `<li>${esc(layerLabel(l))}</li>`).join('')}<li>Close the bun</li></ol>`}
              <div class="muted small">Ticket changes: ${r.mods.length ? r.mods.map(m => esc(modText(m))).join(' · ') : 'none'}</div>
            </div>
          </article>`).join('')}
      </section>
      <div class="row center"><button class="btn ghost small" data-act="reset">Reset demo data</button></div>
    </main>`;
  }

  // ---------- menu import ----------
  function saveImported(list) { Store.setImported(list); syncImported(); }

  // Any owner change marks the item "Adjusted by owner" and drops ticket
  // changes that point at a removed ingredient.
  function editImported(id, fn) {
    const list = Store.imported(), r = list.find(x => x.id === id);
    if (!r) return;
    fn(r);
    r.edited = true;
    r.mods = r.mods.filter(m => r.steps.some(s => s.ing === m.ing));
    saveImported(list);
    render();
  }

  function setImpStatus(msg, error = false) {
    S.imp.status = msg; S.imp.error = error;
    const el = document.getElementById('imp-status');
    if (el) { el.textContent = msg; el.classList.toggle('bad', error); }
  }

  async function runImport(getText) {
    if (S.imp.busy) return;
    S.imp.busy = true; S.imp.last = null;
    setImpStatus('Starting…');
    render();
    try {
      const text = await getText(msg => setImpStatus(msg));
      const res = Importer.build(text, RECIPES.map(r => r.name));
      saveImported([...Store.imported(), ...res.items]);
      S.imp.last = res;
      const n = res.items.length;
      const dupes = res.skipped.filter(s => s.reason === 'already on the menu').length;
      setImpStatus(n
        ? `Added ${n} item${n > 1 ? 's' : ''}: ${res.items.map(r => r.name).join(', ')}. They're live for employees now.`
        : dupes
          ? `Found ${dupes} item${dupes > 1 ? 's' : ''}, but ${dupes > 1 ? 'they are' : 'it is'} already on the menu. Nothing new to add.`
          : 'No burgers or sandwiches found. Try a clearer photo, or paste the text.', !n && !dupes);
    } catch (err) {
      setImpStatus(err.message || 'Something went wrong reading that file.', true);
    } finally {
      S.imp.busy = false;
      if (S.screen === 'owner') render();
    }
  }

  // =============================================================
  //  FLASHCARDS — generated from RECIPES, so they always match the game
  // =============================================================
  const stepLabel = s => ingName(s.ing) + (s.top ? ' (top bun)' : '') + ((s.qty || 1) > 1 ? ` ×${s.qty}` : '');

  function recipeCards(r) {
    const n = r.steps.length;
    const cards = r.steps.map((s, i) => ({
      recipe: r.name,
      tag: `Step ${i + 1} of ${n}`,
      q: i === 0
        ? `What goes down first on the <b>${esc(r.name)}</b>?`
        : `After <b>${esc(stepLabel(r.steps[i - 1]))}</b>, what goes on next?`,
      ing: s.ing,
      a: stepLabel(s),
      why: s.note || '',
    }));
    cards.push({
      recipe: r.name,
      tag: 'Full build',
      q: `Name all ${n} steps of the <b>${esc(r.name)}</b>, bottom to top.`,
      list: r.steps.map(stepLabel),
    });
    return cards;
  }

  function startFlashcards(deck) {
    let cards, title;
    if (deck === 'all') {
      cards = RECIPES.flatMap(recipeCards).sort(() => Math.random() - 0.5);
      title = 'Whole menu';
    } else {
      const r = recipe(deck);
      cards = recipeCards(r);
      title = r.name;
    }
    S.fc = { deck, title, queue: cards, total: cards.length, firstTry: 0, seen: new Set(), flipped: false };
    go('flashcards');
  }

  function fcFlip() {
    const f = S.fc;
    if (!f || !f.queue.length) return;
    f.flipped = !f.flipped;
    $app.querySelector('.fc')?.classList.toggle('flipped', f.flipped);
    $app.querySelectorAll('.fc-grade').forEach(b => { b.disabled = !f.flipped; });
  }

  function fcGrade(knew) {
    const f = S.fc;
    if (!f || !f.flipped) return;
    const card = f.queue.shift();
    if (knew) { if (!f.seen.has(card)) f.firstTry++; }
    else f.queue.push(card); // still learning: comes back at the end
    f.seen.add(card);
    f.flipped = false;
    render();
  }

  function vFlashcards() {
    const f = S.fc;
    const done = f.total - f.queue.length;
    const header = `
      <header class="topbar">
        <div><div class="eyebrow">Flashcards</div><h1>${esc(f.title)}</h1></div>
        <button class="btn ghost" data-act="go" data-arg="hub">✕ Done</button>
      </header>
      <div class="fc-progress"><span style="width:${(done / f.total) * 100}%"></span></div>`;

    if (!f.queue.length) {
      return `
      <main class="narrow fc-page">
        ${header}
        <section class="card fc-summary">
          <div class="fc-big">${f.firstTry}/${f.total}</div>
          <p>cards known on the first try.</p>
          <div class="row">
            <button class="btn primary" data-act="fc-start" data-arg="${esc(f.deck)}">↻ Study again</button>
            ${f.deck !== 'all' ? `<button class="btn" data-act="training" data-arg="${esc(f.deck)}">Practice it in Training →</button>` : ''}
          </div>
        </section>
      </main>`;
    }

    const c = f.queue[0];
    const back = c.list
      ? `<ol class="steps compact">${c.list.map(l => `<li>${esc(l)}</li>`).join('')}</ol>`
      : `<div class="fc-ans">
           <div class="fc-icon">${ART.icon(c.ing)}</div>
           <div><div class="fc-name">${esc(c.a)}</div>${c.why ? `<p class="fc-why">${esc(c.why)}</p>` : ''}</div>
         </div>`;
    return `
    <main class="narrow fc-page">
      ${header}
      <p class="muted fc-count">${f.queue.length} card${f.queue.length > 1 ? 's' : ''} left</p>
      <button class="fc ${f.flipped ? 'flipped' : ''}" data-act="fc-flip" aria-label="Flip card">
        <div class="fc-inner">
          <div class="fc-face fc-front">
            <div class="eyebrow">${esc(c.recipe)} · ${esc(c.tag)}</div>
            <div class="fc-q">${c.q}</div>
            <div class="fc-tip">Tap to flip</div>
          </div>
          <div class="fc-face fc-back">
            <div class="eyebrow">${esc(c.recipe)} · ${esc(c.tag)}</div>
            ${back}
          </div>
        </div>
      </button>
      <div class="row fc-actions">
        <button class="btn fc-grade" data-act="fc-grade" data-arg="0" ${f.flipped ? '' : 'disabled'}>↺ Still learning</button>
        <button class="btn primary fc-grade" data-act="fc-grade" data-arg="1" ${f.flipped ? '' : 'disabled'}>✓ Got it</button>
      </div>
      <p class="fine">Keys: <b>Space</b> flip · <b>←</b> still learning · <b>→</b> got it</p>
    </main>`;
  }

  document.addEventListener('keydown', e => {
    if (S.screen !== 'flashcards' || e.target.closest?.('input, select, textarea')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target.closest?.('button')) return; // a focused button already clicks on Space/Enter
      e.preventDefault(); fcFlip();
    }
    else if (e.key === 'ArrowRight') fcGrade(true);
    else if (e.key === 'ArrowLeft') fcGrade(false);
  });

  // =============================================================
  //  RENDER + EVENTS
  // =============================================================
  const VIEWS = { home: vHome, login: vLogin, hub: vHub, kitchen: vKitchen, results: vResults, owner: vOwner, flashcards: vFlashcards };

  function render() {
    $app.innerHTML = VIEWS[S.screen]();
    if (S.screen === 'kitchen') {
      const k = S.k;
      if (k.drawerAnim) {
        const el = $app.querySelector(`.drawer[data-cat="${k.open}"]`);
        requestAnimationFrame(() => requestAnimationFrame(() => el && el.classList.add('open')));
        k.drawerAnim = false;
      }
      k.justPlaced = false;
      k.justClosed = false;
    }
  }

  function go(screen) {
    if (screen !== 'kitchen') stopTimer();
    S.screen = screen;
    window.scrollTo(0, 0);
    render();
  }

  const ACTIONS = {
    go: arg => go(arg),
    login: name => { S.emp = name; Store.employee(name); go('hub'); },
    tutorial: id => startKitchen('tutorial', id),
    training: id => startKitchen('training', id),
    quiz: () => startKitchen('quiz'),
    drawer: cat => {
      const k = S.k;
      if (k.busy) return;
      if (k.open === cat) k.open = null;
      else { k.open = cat; k.drawerAnim = true; }
      render();
    },
    ing: id => clickIngredient(id),
    close: () => closeBun(),
    undo: () => undo(),
    next: () => tutorialNext(),
    hint: () => hint(),
    peek: () => { S.k.peek = !S.k.peek; render(); },
    'next-item': () => nextItem(),
    submit: () => submitQuiz(),
    exit: () => go('hub'),
    'fc-start': deck => startFlashcards(deck),
    'fc-flip': () => fcFlip(),
    'fc-grade': v => fcGrade(v === '1'),
    'owner-row': n => { S.ownerOpen = S.ownerOpen === n ? null : n; render(); },
    reset: () => { Store.reset(); syncImported(); S.ownerOpen = null; S.imp = { status: '', error: false, busy: false, last: null }; render(); },
    'imp-move': arg => {
      const [id, i, d] = arg.split('|'), a = +i, b = a + +d;
      editImported(id, r => { [r.steps[a], r.steps[b]] = [r.steps[b], r.steps[a]]; });
    },
    'imp-drop': arg => {
      const [id, i] = arg.split('|');
      editImported(id, r => { r.steps.splice(+i, 1); });
    },
    'imp-reset': id => {
      const list = Store.imported().map(r => r.id === id ? Importer.restandard(r) : r);
      saveImported(list); render();
    },
    'imp-remove': id => { saveImported(Store.imported().filter(r => r.id !== id)); render(); },
  };

  $app.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    ACTIONS[el.dataset.act]?.(el.dataset.arg);
  });

  $app.addEventListener('change', e => {
    if (e.target.id === 'imp-file' && e.target.files[0]) {
      const file = e.target.files[0];
      runImport(progress => Importer.readFile(file, progress));
    }
  });

  $app.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (e.target.id === 'login-form') {
      const name = String(fd.get('name')).trim();
      if (name) ACTIONS.login(name);
    }
    if (e.target.id === 'import-form') {
      const text = String(fd.get('text') || '').trim();
      if (text) runImport(async () => text);
    }
    if (e.target.id === 'settings-form') {
      const clamp = (v, lo, hi, d) => Math.min(hi, Math.max(lo, parseInt(v, 10) || d));
      Store.setSettings({
        itemsPerTicket: clamp(fd.get('itemsPerTicket'), 1, 5, 2),
        passThreshold: clamp(fd.get('passThreshold'), 50, 100, 90),
      });
      render();
      const s = document.getElementById('saved');
      if (s) s.textContent = 'Saved ✓';
    }
  });

  render();
})();
