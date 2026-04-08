// game-state.js — Global game state and mutating actions

import { Hamster } from './hamster.js';

export const state = {
  energy: 0,
  hamsters: [],
  hamstersBought: 0,     // number purchased (excludes the starting one)
  automaterUnlocked: false,
  automaterOwned: false,
  automaterEnabled: false,
  nextId: 1,
};

// Called once at init to place the free starting hamster
export function addStartingHamster() {
  state.hamsters.push(new Hamster(state.nextId++));
}

// Player buys a hamster for 10 energy. Returns true on success.
export function buyHamster() {
  if (state.energy < 10) return false;
  state.energy -= 10;
  state.hamsters.push(new Hamster(state.nextId++));
  state.hamstersBought++;
  if (state.hamstersBought >= 4) {
    state.automaterUnlocked = true;
  }
  return true;
}

// Player buys the automater for 50 energy. Returns true on success.
export function buyAutomater() {
  if (!state.automaterUnlocked) return false;
  if (state.automaterOwned)     return false;
  if (state.energy < 50)        return false;
  state.energy -= 50;
  state.automaterOwned = true;
  return true;
}

export function toggleAutomater() {
  if (!state.automaterOwned) return;
  state.automaterEnabled = !state.automaterEnabled;
}

// Master tick — called once per second by the game loop
export function tick() {
  // Automater pokes every non-exhausted hamster before their individual tick.
  // This keeps working hamsters running (work_cooldown never reaches 0 while
  // automater is on), and wakes idle ones immediately.
  if (state.automaterEnabled) {
    for (const h of state.hamsters) {
      if (h.state !== 'EXHAUSTED') h.poke();
    }
  }

  for (const h of state.hamsters) {
    state.energy += h.tick();
  }
}
