// main.js — Entry point: initialises game, wires events, runs the loop.

import {
  state,
  addStartingHamster,
  buyHamster,
  tick,
} from './game-state.js';

import { renderAll } from './ui.js';

// ─── Init ────────────────────────────────────────────────────────────────────

addStartingHamster();
renderAll();

// ─── Game loop (1 tick = 1 second) ───────────────────────────────────────────

setInterval(() => {
  tick();
  renderAll();
}, 1000);

// ─── Shop: buy hamster ───────────────────────────────────────────────────────

document.getElementById('buy-hamster-btn').addEventListener('click', () => {
  buyHamster();
  renderAll();
});

// ─── Hamster action buttons (event delegation on the grid) ───────────────────
// Automator buttons are created and wired directly in ui.js (renderAutomatorSlot).

document.getElementById('hamster-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;

  const id = parseInt(btn.dataset.id, 10);
  const h  = state.hamsters.find(h => h.id === id);
  if (!h) return;

  if      (btn.classList.contains('feed-btn'))    h.feed();
  else if (btn.classList.contains('hydrate-btn')) h.hydrate();
  else if (btn.classList.contains('poke-btn'))    h.poke();

  renderAll();
});
