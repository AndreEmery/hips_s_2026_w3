// game-state.js — Global game state and mutating actions

import { Hamster } from './hamster.js';

// ─── Automator config (static metadata) ──────────────────────────────────────
// Exported so ui.js can read labels, prices, and drain rates without duplicating.
export const AUTOMATOR_CONFIG = {
  poke:    { emoji: '👆', name: 'POKE',         price:   40, drain:  1, unlockAt:  4 },
  hydrate: { emoji: '💧', name: 'HYDRATE',       price:  100, drain:  3, unlockAt:  8 },
  feed:    { emoji: '🍎', name: 'FEED',          price:  500, drain: 10, unlockAt: 20 },
  buy:     { emoji: '🐹', name: 'HAMSTER BUYER', price: 5000, drain: 20, unlockAt: null }, // unlocks when feed owned
};

// ─── State ────────────────────────────────────────────────────────────────────
export const state = {
  energy: 0,
  hamsters: [],
  hamstersBought: 0,   // excludes the free starting hamster
  nextId: 1,
  replaced: false,     // true once hamster-buyer automator is purchased

  // Runtime state for each automator (mirrors keys in AUTOMATOR_CONFIG)
  automators: {
    poke:    { owned: false, enabled: false },
    hydrate: { owned: false, enabled: false },
    feed:    { owned: false, enabled: false },
    buy:     { owned: false, enabled: false },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Next hamster purchase price: 10 * 1.07^(hamstersBought), rounded.
// n=0 → 10, n=1 → 11, n=4 → 14, n=20 → 39, n=50 → 294 …
export function nextHamsterPrice() {
  return Math.round(10 * Math.pow(1.07, state.hamstersBought));
}

// Whether a given automator is available for purchase.
export function isAutomatorUnlocked(key) {
  if (key === 'buy') return state.automators.feed.owned;
  return state.hamsters.length >= AUTOMATOR_CONFIG[key].unlockAt;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export function addStartingHamster() {
  state.hamsters.push(new Hamster(state.nextId++));
}

export function buyHamster() {
  const price = nextHamsterPrice();
  if (state.energy < price) return false;
  state.energy -= price;
  state.hamsters.push(new Hamster(state.nextId++));
  state.hamstersBought++;
  return true;
}

export function buyAutomator(key) {
  const cfg = AUTOMATOR_CONFIG[key];
  const aut = state.automators[key];
  if (!isAutomatorUnlocked(key)) return false;
  if (aut.owned)                  return false;
  if (state.energy < cfg.price)   return false;
  state.energy -= cfg.price;
  aut.owned = true;
  // Poke automator starts enabled automatically (spec requirement).
  // All others start disabled so the player can opt in.
  aut.enabled = (key === 'poke');
  if (key === 'buy') state.replaced = true;
  return true;
}

export function toggleAutomator(key) {
  const aut = state.automators[key];
  if (!aut.owned) return;
  aut.enabled = !aut.enabled;
}

// ─── Master tick (1 / second) ─────────────────────────────────────────────────
export function tick() {
  const auts = state.automators;

  // 1. Automator actions on hamsters
  if (auts.poke.owned && auts.poke.enabled) {
    for (const h of state.hamsters) {
      if (h.state !== 'EXHAUSTED') h.poke();
    }
  }

  if (auts.hydrate.owned && auts.hydrate.enabled) {
    for (const h of state.hamsters) h.hydrate();
  }

  if (auts.feed.owned && auts.feed.enabled) {
    for (const h of state.hamsters) h.feed();
  }

  // 2. Hamsters generate energy
  for (const h of state.hamsters) {
    state.energy += h.tick();
  }

  // 3. Hamster-buyer automator: purchase one hamster per tick if affordable
  if (auts.buy.owned && auts.buy.enabled) {
    const price = nextHamsterPrice();
    if (state.energy >= price) {
      state.energy -= price;
      state.hamsters.push(new Hamster(state.nextId++));
      state.hamstersBought++;
    }
  }

  // 4. Deduct operating costs for all running automators (clamp energy ≥ 0)
  let totalDrain = 0;
  for (const [key, aut] of Object.entries(auts)) {
    if (aut.owned && aut.enabled) totalDrain += AUTOMATOR_CONFIG[key].drain;
  }
  state.energy = Math.max(0, state.energy - totalDrain);
}
