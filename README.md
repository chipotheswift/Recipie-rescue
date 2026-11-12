# Recipe Rescue

*Learn it. Practice it. Prove it.*

Browser game that teaches new line cooks to build menu items: **Tutorial → Training → Quiz → Certificate**, plus an owner dashboard that shows who is certified and ready to work. (Owner side uses demo data for now.)

Brand lives in `APP` in `js/data.js` (name, tagline, year); the logo is an SVG lifebuoy with a burger, defined in `js/app.js` (`LOGO_RING`) and as the tab icon in `index.html`. "Demo Burger Co." is the *restaurant* using Recipe Rescue (`RESTAURANT`).

## Run it
Double-click `index.html`. No install, no build step, no server.
(Plain HTML + CSS + JavaScript. Progress is saved in the browser's localStorage.)

## Files
| File | What it is |
|---|---|
| `js/data.js` | **The menu.** Ingredients, drawers, recipes, quiz settings, demo employees. Edit this to change food. |
| `js/art.js` | All ingredient drawings (SVG shapes): bird's-eye view + side view. |
| `js/chef.js` | Chef Marco (SVG): the mentor on the right who gives feedback in a speech bubble; face and spatula change with the mood. |
| `js/importer.js` | Menu import: reads a photo (Tesseract.js) or PDF (pdf.js) in the browser, then rules turn it into recipes in the standard build order. Libraries download only on first use. |
| `js/store.js` | Fake accounts/results (localStorage). Swap for a real backend in V2. |
| `js/app.js` | Screens + game logic (tutorial, training feedback, quiz, scoring, owner page). |
| `css/style.css` | Look and feel, drawer and layer animations. |

## Game rules (as decided)
- Bird's-eye view while building; **Close the bun** flips to a side view.
- Drawers stacked vertically, open **upward**, one open at a time. Click to place (no drag).
- Every step is **one ingredient**; order must match the recipe exactly.
- Tutorial: *Next step* does it for you (or click the glowing item). Back = undo.
- Training: wrong picks are rejected with the reason; 2-level hints; undo allowed.
- Quiz: 1 ticket, 2 items (owner can change), timed, no hints, **no undo**, results only at the end.
- Scoring (placeholder): layer-by-layer match vs. expected stack, averaged across items. Pass mark defaults to 90%; the owner can set anything from 0 to 100% and that setting is final.
- Flashcards: per item or whole menu (shuffled). One card per step ("After X, what goes on next?" → answer + why) plus a "full build" card. *Still learning* sends the card to the back of the deck. Generated from `RECIPES`, so they can't drift from the game.
- Certificate: passing the quiz at the pass mark (90%) earns one: printable / Save as PDF, with name, restaurant, score, time, date, owner signature line and certificate number. The owner sees **🎓 Certified · Ready to work**. A certificate is kept for good: a later failed quiz or new menu items do **not** remove it.
- Owner dashboard: per employee tutorials, training, quiz attempts, latest score/time, status, certificate (with link), flashcard decks finished, most-missed ingredients, items not yet trained.
- Menu import (owner page): photo, PDF or pasted text. Each burger/sandwich goes live immediately in a **standard build order** (bun → bottom sauce → protein → cheese → bacon → toppings → top sauce), using only ingredients the menu names plus a bun and protein. Marked *Auto-generated* until the owner reorders or removes a step (*Adjusted by owner*; *Reset to standard* undoes it). Ingredients not in the ingredient bank (e.g. ranch) are left out. Items already on the menu are skipped. Works offline after the first import; nothing is uploaded.

## Menu: changes from the Kitchen Training Manual
The manual was used as a guideline. What changed and why:

| # | Change | Why |
|---|---|---|
| 1 | **Combined steps split into single steps** (e.g. "Bottom Bun + Special Sauce", "Beef Patty & Cheese", "Tomato & Lettuce", "Bun, Honey Mustard, Pickles"). | Each click = one step, so tutorial, training feedback and grading all line up 1:1. |
| 2 | **"Sauced Top Bun" = a top-bun sauce step, then Close the bun.** | Keeps the order exact without a separate "sauced bun" ingredient. The sauce step is labeled *(top bun)*. |
| 3 | **Grilled Chicken: Provolone is a required step** after the chicken (manual says "(& Provolone)"). | Ambiguous in the manual; required makes it testable. Can be removed by a "NO PROVOLONE" ticket. |
| 4 | **Crispy Chicken: 3 pickle chips.** | Manual gives no count; matched the Classic's 3. **Confirm with owner.** |
| 5 | **Shredded Lettuce and Leaf Lettuce are separate ingredients.** | Manual uses both on different items; picking the wrong one is a realistic mistake to train. |
| 6 | **Sesame Bun added** to the bread drawer. | Gives the bread drawer a third option; used by the new Bacon BBQ Burger. |
| 7 | **Added: Bacon BBQ Burger** (sesame, BBQ, beef, cheddar, bacon ×2, red onion, BBQ top). | Same rules as the manual (cheese on hot patty, toppings glued by cheese, sauce both sides). Adds bacon, cheddar, BBQ. |
| 8 | **Added: Spicy Crispy Chicken** (potato bun, spicy mayo, leaf lettuce, crispy chicken, pepper jack, jalapeños, spicy mayo top). | Deliberately *similar* to the Crispy Chicken but built differently: tests real recipe knowledge, not guessing. |
| 9 | **Quiz ticket changes** (NO / EXTRA) defined per item. | Lets the quiz check modifications vs. mistakes. Owner-editable later. |

Menu items, ingredients, art and ticket changes all live in `js/data.js` / `js/art.js`, so swapping items is a data edit, not a code change.

## Known limits / next steps
- Scoring is positional: one missing layer shifts the rest and costs more than it should. Fine as a placeholder.
- Owner page is read-only and uses demo data; registration, menu editing and real accounts are V2.
- Phones and tablets: checked in Chrome's device emulation (360×780 phone, 768×1024 tablet), not yet on a real device. Phone kitchen order: header → recipe steps as numbered chips (or the ticket) → Chef Marco beside his bubble → board → actions → cabinet. Tablet: ticket/recipe beside the chef, cabinet beside the board. Touch screens get 44px+ tap targets. Desktop layout is unchanged.

## Versions (snapshots)
Every change is saved as a git commit, and each milestone gets a tag (`v0.3-chef`, …).

| Want to… | Command |
|---|---|
| See all snapshots | `git log --oneline --decorate` |
| Try an old version (look only) | `git switch --detach v0.3-chef`, then `git switch main` to come back |
| Undo one change, keep everything after it | `git revert <commit>` |
| Grab one file from an old version | `git restore --source v0.3-chef js/chef.js` |
| Go fully back to a version | `git reset --hard v0.3-chef` (later work stays reachable through its tag) |

| Tag | What it contains |
|---|---|
| `v0.3-chef` | Full game + Chef Marco feedback mentor, plain-English messages. First snapshot (earlier steps were built before versioning). |
| `v0.4-flashcards` | Adds flashcards (per item or whole menu, keyboard shortcuts, retry queue). |
| `v0.5-menu-import` | Owner menu import from photo/PDF/text, standard build order, owner reorder + reset. |
| `v0.6-recipe-rescue` | Renamed to Recipe Rescue (logo, tab icon/title, app bar, footer). Quiz pass earns a printable certificate; owner sees Certified · Ready to work; flashcard decks tracked. |
| `v0.6.1-cert-stays` | Certificates stay valid when new menu items are added (no re-certify). |
| `v0.6.2-pass-mark` | Owner pass mark can be any value 0–100% (was locked to 50–100). |
| `v0.7-mobile` | Phone and tablet layouts: compact kitchen (board and next action on the first screen), tablet two-column kitchen, 44px touch targets, no sideways scrolling at 360px. |
