// ui.js — Pure DOM rendering. No game logic here.

import {
  state,
  AUTOMATOR_CONFIG,
  nextHamsterPrice,
  isAutomatorUnlocked,
  buyAutomator,
  toggleAutomator,
} from './game-state.js';

// ─── Top-level render ────────────────────────────────────────────────────────

export function renderAll() {
  renderEnergy();
  renderShop();
  renderHamsters();
  renderReplacedBanner();
}

// ─── Energy display ──────────────────────────────────────────────────────────

function renderEnergy() {
  document.getElementById('energy-count').textContent = Math.floor(state.energy);
}

// ─── Shop ────────────────────────────────────────────────────────────────────

function renderShop() {
  // Buy hamster — update price label dynamically
  const price = nextHamsterPrice();
  const buyBtn = document.getElementById('buy-hamster-btn');
  buyBtn.disabled = state.energy < price;
  buyBtn.innerHTML = `HIRE HAMSTER<br><span style="color:#ffd700">[ ${price}⚡ ]</span>`;

  // Automator buttons — created on first unlock, updated every render
  for (const key of Object.keys(AUTOMATOR_CONFIG)) {
    renderAutomatorSlot(key);
  }
}

// Renders (or creates) one automator buy/toggle button.
function renderAutomatorSlot(key) {
  const cfg = AUTOMATOR_CONFIG[key];
  const aut = state.automators[key];
  const container = document.getElementById('automator-shop');
  const unlocked = isAutomatorUnlocked(key);
  let btn = document.getElementById(`auto-btn-${key}`);

  if (!unlocked) {
    if (btn) btn.classList.add('hidden');
    return;
  }

  // Create button once
  if (!btn) {
    btn = document.createElement('button');
    btn.id = `auto-btn-${key}`;
    btn.classList.add('auto-btn');
    container.appendChild(btn);
    btn.addEventListener('click', () => {
      if (!aut.owned) buyAutomator(key);
      else            toggleAutomator(key);
      renderAll();
    });
  }

  btn.classList.remove('hidden');

  if (!aut.owned) {
    // Purchase state
    btn.dataset.active = 'false';
    btn.disabled = state.energy < cfg.price;
    btn.innerHTML =
      `${cfg.emoji} ${cfg.name} AUTOMATOR<br>` +
      `<span style="color:#ffd700">[ ${cfg.price}⚡ ]</span>` +
      `<span class="drain-hint"> -${cfg.drain}⚡/s</span>`;
  } else {
    // Toggle state
    btn.disabled = false;
    btn.dataset.active = aut.enabled;
    btn.innerHTML =
      `${cfg.emoji} ${cfg.name}: ${aut.enabled ? 'ON' : 'OFF'}` +
      `<span class="drain-hint"> -${cfg.drain}⚡/s</span>`;
  }
}

// ─── "You have been replaced" banner ─────────────────────────────────────────

function renderReplacedBanner() {
  const banner = document.getElementById('replaced-banner');
  if (state.replaced) banner.classList.remove('hidden');
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

function updateCard(card, h) {
  const stateLower = h.state.toLowerCase();
  card.dataset.state = stateLower;

  const badge = card.querySelector('.state-badge');
  badge.dataset.state = stateLower;
  badge.textContent = h.state === 'EXHAUSTED'
    ? `TIRED (${h.overwork_cooldown}s)`
    : h.state;

  const emoji = card.querySelector('.hamster-emoji');
  emoji.textContent = h.state === 'EXHAUSTED' ? '😵' : '🐹';

  // Food meter (max 20)
  const foodPct = Math.max(0, (h.food_stamina / 20) * 100);
  const foodFill = card.querySelector('.food-fill');
  foodFill.style.width = `${foodPct}%`;
  foodFill.classList.toggle('low', foodPct < 25);

  // Water meter (max 7)
  const waterPct = Math.max(0, (h.water_stamina / 7) * 100);
  const waterFill = card.querySelector('.water-fill');
  waterFill.style.width = `${waterPct}%`;
  waterFill.classList.toggle('low', waterPct < 25);

  card.querySelector('.poke-btn').disabled = h.state === 'EXHAUSTED';

  if (h.state === 'WORKING') spawnEnergyPop(card);
}

function spawnEnergyPop(card) {
  const pop = document.createElement('span');
  pop.className = 'energy-pop';
  pop.textContent = '+1⚡';
  card.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove(), { once: true });
}
