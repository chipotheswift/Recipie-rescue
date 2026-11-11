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
      if (!e[kind].includes(recipeId)) e[kind].push(recipeId);
      save();
    },

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

    reset() { data = blank(); save(); },
  };
})();
