// ui.js — Pure DOM rendering. No game logic here.

import { state } from './game-state.js';

// ─── Top-level render ────────────────────────────────────────────────────────

export function renderAll() {
  renderEnergy();
  renderShop();
  renderHamsters();
}

// ─── Energy display ──────────────────────────────────────────────────────────

function renderEnergy() {
  document.getElementById('energy-count').textContent = Math.floor(state.energy);
}

// ─── Shop buttons ────────────────────────────────────────────────────────────

function renderShop() {
  // Buy hamster
  document.getElementById('buy-hamster-btn').disabled = state.energy < 10;

  // Buy automater: visible only after 4 purchases, before ownership
  const buyAuto = document.getElementById('buy-automater-btn');
  if (state.automaterUnlocked && !state.automaterOwned) {
    buyAuto.classList.remove('hidden');
    buyAuto.disabled = state.energy < 50;
  } else {
    buyAuto.classList.add('hidden');
  }

  // Toggle: visible only once owned
  const toggleAuto = document.getElementById('toggle-automater-btn');
  if (state.automaterOwned) {
    toggleAuto.classList.remove('hidden');
    toggleAuto.textContent  = `AUTOMATER: ${state.automaterEnabled ? 'ON' : 'OFF'}`;
    toggleAuto.dataset.active = state.automaterEnabled;
  } else {
    toggleAuto.classList.add('hidden');
  }
}

// ─── Hamster grid ────────────────────────────────────────────────────────────

function renderHamsters() {
  const grid = document.getElementById('hamster-grid');
  for (const h of state.hamsters) {
    let card = document.getElementById(`hamster-${h.id}`);
    if (!card) {
      card = buildCard(h);
      grid.appendChild(card);
    }
    updateCard(card, h);
  }
}

// Build a card element once per hamster (DOM creation is expensive; keep it minimal)
function buildCard(h) {
  const card = document.createElement('div');
  card.className = 'hamster-card';
  card.id = `hamster-${h.id}`;
  card.innerHTML = `
    <div class="card-header">
      <span class="hamster-name">HAMSTER #${h.id}</span>
      <span class="state-badge" data-state="idle">IDLE</span>
    </div>
    <div class="cage">
      <div class="wheel"></div>
      <div class="hamster-emoji">🐹</div>
    </div>
    <div class="meters">
      <div class="meter-row">
        <span class="meter-icon" title="Food">🍎</span>
        <div class="meter-bar">
          <div class="meter-fill food-fill" style="width:50%"></div>
        </div>
      </div>
      <div class="meter-row">
        <span class="meter-icon" title="Water">💧</span>
        <div class="meter-bar">
          <div class="meter-fill water-fill" style="width:57%"></div>
        </div>
      </div>
    </div>
    <div class="hamster-actions">
      <button class="action-btn feed-btn"    data-id="${h.id}">FEED</button>
      <button class="action-btn hydrate-btn" data-id="${h.id}">H2O</button>
      <button class="action-btn poke-btn"    data-id="${h.id}">POKE</button>
    </div>
  `;
  return card;
}

// Update an existing card to reflect current hamster state
function updateCard(card, h) {
  const stateLower = h.state.toLowerCase();
  card.dataset.state = stateLower;

  // State badge
  const badge = card.querySelector('.state-badge');
  badge.dataset.state = stateLower;
  badge.textContent = h.state === 'EXHAUSTED'
    ? `TIRED (${h.overwork_cooldown}s)`
    : h.state;

  // Emoji
  const emoji = card.querySelector('.hamster-emoji');
  emoji.textContent = h.state === 'EXHAUSTED' ? '😵' : '🐹';

  // Food meter  (max 20)
  const foodPct = Math.max(0, (h.food_stamina / 20) * 100);
  const foodFill = card.querySelector('.food-fill');
  foodFill.style.width = `${foodPct}%`;
  foodFill.classList.toggle('low', foodPct < 25);

  // Water meter (max 7)
  const waterPct = Math.max(0, (h.water_stamina / 7) * 100);
  const waterFill = card.querySelector('.water-fill');
  waterFill.style.width = `${waterPct}%`;
  waterFill.classList.toggle('low', waterPct < 25);

  // Disable POKE when exhausted (can't wake a recovering hamster)
  card.querySelector('.poke-btn').disabled = h.state === 'EXHAUSTED';

  // +1⚡ pop when actively generating energy
  if (h.state === 'WORKING') spawnEnergyPop(card);
}

// Spawn a floating "+1⚡" label over the card — auto-removes via animationend
function spawnEnergyPop(card) {
  const pop = document.createElement('span');
  pop.className = 'energy-pop';
  pop.textContent = '+1⚡';
  card.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove(), { once: true });
}
