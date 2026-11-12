// =============================================================
//  STORE — fake accounts & results, saved in this browser only.
//  V2 swaps this file for a real backend (e.g. Supabase).
// =============================================================

const Store = (() => {
  const KEY = 'restaurant-trainer-v1';
  const blank = () => ({ employees: {}, settings: {} });

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || blank(); }
    catch { return blank(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode: keep in memory */ }
  }

  let data = load();

  function ensure(name) {
    if (!data.employees[name]) {
      const seed = DUMMY_EMPLOYEES[name];
      data.employees[name] = seed
        ? JSON.parse(JSON.stringify(seed))
        : { tutorials: [], training: [], quizzes: [] };
      save();
    }
    return data.employees[name];
  }

  return {
    settings: () => ({ ...DEFAULT_SETTINGS, ...data.settings }),
    setSettings(s) { data.settings = { ...data.settings, ...s }; save(); },

    employee: name => ensure(name),

    markDone(name, kind, recipeId) {
      const e = ensure(name);
      const list = (e[kind] = e[kind] || []); // older records may lack a list (e.g. flashcards)
      if (!list.includes(recipeId)) list.push(recipeId);
      save();
    },

    // Certificate: earned by passing the quiz. Never taken away by a later fail.
    setCert(name, cert) { ensure(name).cert = cert; save(); },

    addQuiz(name, record) {
      ensure(name).quizzes.push(record);
      save();
    },

    // Demo employees + anyone who signed in on this browser.
    all() {
      const out = JSON.parse(JSON.stringify(DUMMY_EMPLOYEES));
      Object.assign(out, JSON.parse(JSON.stringify(data.employees)));
      return out;
    },

    // Menu items imported by the owner (photo / PDF / pasted text).
    imported: () => JSON.parse(JSON.stringify(data.imported || [])),
    setImported(list) { data.imported = list; save(); },

    reset() { data = blank(); save(); },
  };
})();
