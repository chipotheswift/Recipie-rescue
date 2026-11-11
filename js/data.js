// =============================================================
//  RESTAURANT DATA — edit this file to change the menu.
//  Source: "Line Station Training Manual — Burger & Sandwich Builds"
//
//  The ORDER of a recipe's steps IS the build order (bottom -> top).
//  Step 1 must be a bread/bun. The top bun is added by pressing
//  "Close the bun". A "sauced top bun" = the last sauce step (top:true).
// =============================================================

const RESTAURANT = {
  id: 'demo-burger-co',
  name: 'Demo Burger Co.',
  owner: 'Alex Rivera',
  goldenRule: 'Hot ingredients touch the cheese to melt it; wet/crisp produce is layered to protect the bun.',
};

// Cabinet drawers, listed top to bottom (bread sits closest to the board).
const CATEGORIES = [
  { id: 'sauce',   name: 'Sauces & Spreads', color: '#b8432f' },
  { id: 'produce', name: 'Produce & Toppings', color: '#4f8f2c' },
  { id: 'cheese',  name: 'Cheese',           color: '#d99a12' },
  { id: 'protein', name: 'Proteins',         color: '#7a3e1d' },
  { id: 'bread',   name: 'Breads & Buns',    color: '#c7843b' },
];

// Any ingredient without art in art.js gets a simple placeholder shape.
const INGREDIENTS = {
  brioche_bun:        { name: 'Brioche Bun',          category: 'bread' },
  potato_bun:         { name: 'Potato Bun',           category: 'bread' },
  sesame_bun:         { name: 'Sesame Bun',           category: 'bread' },
  beef_patty:         { name: 'Beef Patty (¼ lb)',    category: 'protein' },
  grilled_chicken:    { name: 'Grilled Chicken',      category: 'protein' },
  crispy_chicken:     { name: 'Crispy Fried Chicken', category: 'protein' },
  bacon:              { name: 'Bacon Strip',          category: 'protein' },
  american:           { name: 'American Cheese',      category: 'cheese' },
  swiss:              { name: 'Swiss Cheese',         category: 'cheese' },
  provolone:          { name: 'Provolone',            category: 'cheese' },
  cheddar:            { name: 'Cheddar',              category: 'cheese' },
  pepper_jack:        { name: 'Pepper Jack',          category: 'cheese' },
  pickles:            { name: 'Dill Pickle Chip',     category: 'produce' },
  jalapenos:          { name: 'Jalapeños',            category: 'produce' },
  red_onion:          { name: 'Red Onion Ring',       category: 'produce' },
  tomato:             { name: 'Tomato Slice',         category: 'produce' },
  shredded_lettuce:   { name: 'Shredded Lettuce',     category: 'produce' },
  leaf_lettuce:       { name: 'Leaf Lettuce',         category: 'produce' },
  mushrooms:          { name: 'Sautéed Mushrooms',    category: 'produce' },
  caramelized_onions: { name: 'Caramelized Onions',   category: 'produce' },
  coleslaw:           { name: 'Tangy Coleslaw',       category: 'produce' },
  special_sauce:      { name: 'Special Sauce',        category: 'sauce' },  // pink-orange, distinct from spicy mayo
  garlic_aioli:       { name: 'Garlic Aioli',         category: 'sauce' },
  herb_mayo:          { name: 'Herb Mayo',            category: 'sauce' },
  honey_mustard:      { name: 'Honey Mustard',        category: 'sauce' },
  bbq_sauce:          { name: 'BBQ Sauce',            category: 'sauce' },
  spicy_mayo:         { name: 'Spicy Mayo',           category: 'sauce' },
};

// steps: bottom -> top. qty = times that layer is placed.
// note = the "why", shown in the tutorial and in training feedback.
// top: true = sauce that goes on the top bun (placed last, then close).
// mods = customer changes a quiz ticket may ask for.
//   remove: drop every step of that ingredient   extra: +1 qty on its first step
//   add: insert a new step after `after`
const RECIPES = [
  {
    id: 'classic_cheeseburger',
    name: 'Classic Cheeseburger',
    station: 'Burger Station',
    difficulty: 'Beginner',
    description: 'Juicy beef patty, melted cheese, crisp produce and signature house sauce.',
    steps: [
      { ing: 'brioche_bun',      qty: 1, note: 'The foundation of the burger. Bottom bun, cut side up.' },
      { ing: 'special_sauce',    qty: 1, note: 'Sauce directly on the bread binds the bottom layers and adds instant flavor to the first bite.' },
      { ing: 'pickles',          qty: 3, note: 'Three chips laid flat against the sauced bun so they don\'t slide out when bitten.' },
      { ing: 'beef_patty',       qty: 1, note: 'The hot ¼ lb beef patty rests on the pickles.' },
      { ing: 'american',         qty: 1, note: 'American cheese goes directly on the patty so residual heat melts it.' },
      { ing: 'red_onion',        qty: 1, note: 'One thin ring. The melted cheese acts as glue and locks it in place.' },
      { ing: 'tomato',           qty: 1, note: 'One tomato slice.' },
      { ing: 'shredded_lettuce', qty: 1, note: 'Shredded lettuce on top of the tomato traps loose greens under the crown.' },
      { ing: 'special_sauce',    qty: 1, top: true, note: 'Sauce on the top bun crowns the burger, sealing in moisture from both sides.' },
    ],
    mods: [
      { type: 'remove', ing: 'red_onion' },
      { type: 'remove', ing: 'pickles' },
      { type: 'remove', ing: 'tomato' },
      { type: 'extra',  ing: 'american' },
    ],
  },
  {
    id: 'mushroom_swiss',
    name: 'Mushroom Swiss Burger',
    station: 'Burger Station',
    difficulty: 'Beginner',
    description: 'Rich and savory. Melted Swiss anchors the sautéed mushrooms so they don\'t slide out.',
    steps: [
      { ing: 'brioche_bun',        qty: 1, note: 'Bottom brioche bun, cut side up.' },
      { ing: 'garlic_aioli',       qty: 1, note: 'Aioli is a moisture barrier that protects the bottom bun and adds a flavorful base.' },
      { ing: 'beef_patty',         qty: 1, note: 'Hot grilled beef patty.' },
      { ing: 'swiss',              qty: 1, note: 'Swiss goes directly on the hot patty so it melts into a sticky blanket.' },
      { ing: 'mushrooms',          qty: 1, note: 'Mushrooms are slippery. Placing them on the melted cheese anchors them.' },
      { ing: 'caramelized_onions', qty: 1, note: 'Soft onions nest into the warm mushrooms, making one unified topping layer.' },
      { ing: 'garlic_aioli',       qty: 1, top: true, note: 'Aioli on the top bun seals and locks the warm toppings under the crown.' },
    ],
    mods: [
      { type: 'remove', ing: 'caramelized_onions' },
      { type: 'extra',  ing: 'mushrooms' },
      { type: 'extra',  ing: 'swiss' },
    ],
  },
  {
    id: 'grilled_chicken_sandwich',
    name: 'Grilled Chicken Sandwich',
    station: 'Chicken Station',
    difficulty: 'Intermediate',
    description: 'Marinated chicken with crisp greens and a bright herb spread, on a potato bun.',
    steps: [
      { ing: 'potato_bun',      qty: 1, note: 'This sandwich uses a POTATO bun. Bottom bun, cut side up.' },
      { ing: 'herb_mayo',       qty: 1, note: 'Mayo coats the bottom bread with fat and flavor before the cold produce.' },
      { ing: 'leaf_lettuce',    qty: 1, note: 'Folded leaf lettuce is a shield that keeps chicken juice and tomato liquid off the bun.' },
      { ing: 'tomato',          qty: 1, note: 'One tomato slice on the lettuce.' },
      { ing: 'grilled_chicken', qty: 1, note: 'Hot chicken on the tomato warms it and centers the weight of the sandwich.' },
      { ing: 'provolone',       qty: 1, note: 'Provolone goes on the hot chicken so it melts.' },
      { ing: 'herb_mayo',       qty: 1, top: true, note: 'Mayo on the top bun finishes the flavor and caps the sandwich.' },
    ],
    mods: [
      { type: 'remove', ing: 'tomato' },
      { type: 'remove', ing: 'provolone' },
      { type: 'extra',  ing: 'tomato' },
    ],
  },
  {
    id: 'crispy_chicken_sandwich',
    name: 'Crispy Chicken Sandwich',
    station: 'Chicken Station',
    difficulty: 'Intermediate',
    description: 'All about crunch. Wet ingredients go UNDER the chicken to keep the breading crispy.',
    steps: [
      { ing: 'brioche_bun',    qty: 1, note: 'Bottom brioche bun, cut side up.' },
      { ing: 'honey_mustard',  qty: 1, note: 'Mustard anchors the pickles, creating a stable, flat base.' },
      // Pickle count isn't specified in the manual — 3 assumed (confirm with owner).
      { ing: 'pickles',        qty: 3, note: 'Pickles sit on the mustard so they stay flat and put.' },
      { ing: 'coleslaw',       qty: 1, note: 'Drained slaw cushions the chicken and keeps cold wetness away from the top breading.' },
      { ing: 'crispy_chicken', qty: 1, note: 'Hot fried chicken sits near the top so steam vents and the crust stays crisp.' },
      { ing: 'honey_mustard',  qty: 1, top: true, note: 'A touch of mustard holds the top bun in place over the rounded chicken.' },
    ],
    mods: [
      { type: 'remove', ing: 'pickles' },
      { type: 'remove', ing: 'coleslaw' },
      { type: 'extra',  ing: 'pickles' },
    ],
  },

  // ----- Added items (not in the manual) — built from the same rules -----
  {
    id: 'bacon_bbq_burger',
    name: 'Bacon BBQ Burger',
    station: 'Burger Station',
    difficulty: 'Intermediate',
    description: 'Smoky BBQ, sharp cheddar and two strips of bacon on a sesame bun.',
    steps: [
      { ing: 'sesame_bun', qty: 1, note: 'This burger uses the SESAME bun. Bottom bun, cut side up.' },
      { ing: 'bbq_sauce',  qty: 1, note: 'BBQ on the bottom bun flavors the first bite and binds the base.' },
      { ing: 'beef_patty', qty: 1, note: 'Hot ¼ lb beef patty.' },
      { ing: 'cheddar',    qty: 1, note: 'Cheddar directly on the hot patty so it melts.' },
      { ing: 'bacon',      qty: 2, note: 'Two bacon strips, pressed into the melted cheese so they stay put.' },
      { ing: 'red_onion',  qty: 1, note: 'One thin red onion ring for crunch.' },
      { ing: 'bbq_sauce',  qty: 1, top: true, note: 'BBQ on the top bun seals everything in.' },
    ],
    mods: [
      { type: 'remove', ing: 'red_onion' },
      { type: 'extra',  ing: 'bacon' },
      { type: 'extra',  ing: 'cheddar' },
    ],
  },
  {
    id: 'spicy_crispy_chicken',
    name: 'Spicy Crispy Chicken',
    station: 'Chicken Station',
    difficulty: 'Advanced',
    description: 'Crispy chicken with pepper jack and jalapeños. Looks like the Crispy Chicken but is built differently.',
    steps: [
      { ing: 'potato_bun',     qty: 1, note: 'This one uses the POTATO bun, not brioche.' },
      { ing: 'spicy_mayo',     qty: 1, note: 'Spicy mayo coats the bottom bun before the cold produce.' },
      { ing: 'leaf_lettuce',   qty: 1, note: 'Leaf lettuce shields the bun from the chicken\'s steam.' },
      { ing: 'crispy_chicken', qty: 1, note: 'Hot fried chicken on the lettuce.' },
      { ing: 'pepper_jack',    qty: 1, note: 'Pepper jack on the hot chicken so it melts.' },
      { ing: 'jalapenos',      qty: 1, note: 'Jalapeños go on the melted cheese, which acts as glue.' },
      { ing: 'spicy_mayo',     qty: 1, top: true, note: 'Spicy mayo on the top bun caps the sandwich.' },
    ],
    mods: [
      { type: 'remove', ing: 'jalapenos' },
      { type: 'extra',  ing: 'jalapenos' },
      { type: 'extra',  ing: 'pepper_jack' },
    ],
  },
];

// Quiz settings (the owner can change these on the owner dashboard).
const DEFAULT_SETTINGS = {
  itemsPerTicket: 2,   // items on the quiz ticket
  passThreshold: 90,   // % needed to be "Ready"
  modChance: 0.6,      // chance each ticket item has a customer change
};

// Fake employees so the owner dashboard has something to show.
const ALL_IDS = RECIPES.map(r => r.id);
const DUMMY_EMPLOYEES = {
  'Jordan Lee': {
    tutorials: ALL_IDS, training: ALL_IDS,
    quizzes: [
      { date: '2026-11-03T15:10:00Z', score: 81, timeSec: 102, missed: ['red_onion', 'pickles'] },
      { date: '2026-11-07T16:22:00Z', score: 96, timeSec: 71,  missed: ['special_sauce'] },
    ],
  },
  'Sam Patel': {
    tutorials: ALL_IDS, training: ALL_IDS.slice(0, 3),
    quizzes: [
      { date: '2026-11-08T12:40:00Z', score: 72, timeSec: 134, missed: ['leaf_lettuce', 'provolone', 'herb_mayo'] },
    ],
  },
  'Casey Nguyen': { tutorials: ALL_IDS, training: ALL_IDS, quizzes: [] },
  'Taylor Kim':   { tutorials: ALL_IDS.slice(0, 2), training: ALL_IDS.slice(0, 1), quizzes: [] },
  'Morgan Diaz':  { tutorials: [], training: [], quizzes: [] },
};
