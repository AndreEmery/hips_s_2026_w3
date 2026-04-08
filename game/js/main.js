// main.js — Entry point: initialises game, wires events, runs the loop.

import {
  state,
  addStartingHamster,
  buyHamster,
  buyAutomater,
  toggleAutomater,
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

// ─── Shop buttons ────────────────────────────────────────────────────────────

document.getElementById('buy-hamster-btn').addEventListener('click', () => {
  buyHamster();
  renderAll();
});

document.getElementById('buy-automater-btn').addEventListener('click', () => {
  buyAutomater();
  renderAll();
});

document.getElementById('toggle-automater-btn').addEventListener('click', () => {
  toggleAutomater();
  renderAll();
});

// ─── Hamster action buttons (event delegation on the grid) ───────────────────
//
// All three action buttons carry data-id so a single listener handles everything.

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
