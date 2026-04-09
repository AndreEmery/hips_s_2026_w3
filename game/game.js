// game.js — All game code bundled into a single file (no ES modules needed).
// Load as a regular <script> so the game works when opened directly as a file.

// ═══════════════════════════════════════════════════════════════
// HAMSTER CLASS
// ═══════════════════════════════════════════════════════════════

class Hamster {
  constructor(id) {
    this.id = id;
    this.state = 'IDLE';
    this.food_stamina = 10;
    this.water_stamina = 4;
    this.work_cooldown = 0;
    this.overwork_cooldown = 0;
  }

  feed()    { this.food_stamina  = 20; }
  hydrate() { this.water_stamina = 7;  }

  poke() {
    if (this.state === 'EXHAUSTED') return false;
    if (this.food_stamina > 0 && this.water_stamina > 0) {
      this.state = 'WORKING';
      this.work_cooldown = 2;
      return true;
    } else {
      this.state = 'EXHAUSTED';
      this.overwork_cooldown = 10;
      return false;
    }
  }

  tick() {
    let energy = 0;
    if (this.state === 'WORKING') {
      this.work_cooldown   = Math.max(0, this.work_cooldown   - 1);
      this.food_stamina    = Math.max(0, this.food_stamina    - 1);
      this.water_stamina   = Math.max(0, this.water_stamina   - 1);
      energy = 1;

      if (this.food_stamina <= 0 || this.water_stamina <= 0) {
        this.state = 'EXHAUSTED';
        this.overwork_cooldown = 10;
      } else if (this.work_cooldown <= 0) {
        this.state = 'IDLE';
      }
    } else if (this.state === 'EXHAUSTED') {
      this.overwork_cooldown = Math.max(0, this.overwork_cooldown - 1);
      if (this.overwork_cooldown <= 0) this.state = 'IDLE';
    }
    return energy;
  }
}

// ═══════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════

const AUTOMATOR_CONFIG = {
  poke:    { emoji: '👆', name: 'POKE',         price:   20, drain:  1, unlockAt:  3 },
  hydrate: { emoji: '💧', name: 'HYDRATE',       price:  50, drain:  2, unlockAt:  6 },
  feed:    { emoji: '🍎', name: 'FEED',          price:  100, drain: 5, unlockAt: 10 },
  buy:     { emoji: '🐹', name: 'HAMSTER BUYER', price: 300, drain: 10, unlockAt: null },
};

const state = {
  energy: 0,
  hamsters: [],
  hamstersBought: 0,
  nextId: 1,
  replaced: false,
  automators: {
    poke:    { owned: false, enabled: false },
    hydrate: { owned: false, enabled: false },
    feed:    { owned: false, enabled: false },
    buy:     { owned: false, enabled: false },
  },
};

function nextHamsterPrice() {
  return Math.round(10 * Math.pow(1.04, state.hamstersBought));
}

function isAutomatorUnlocked(key) {
  if (key === 'buy') return state.automators.feed.owned;
  return state.hamsters.length >= AUTOMATOR_CONFIG[key].unlockAt;
}

function addStartingHamster() {
  state.hamsters.push(new Hamster(state.nextId++));
}

function buyHamster() {
  const price = nextHamsterPrice();
  if (state.energy < price) return false;
  state.energy -= price;
  state.hamsters.push(new Hamster(state.nextId++));
  state.hamstersBought++;
  return true;
}

function buyAutomator(key) {
  const cfg = AUTOMATOR_CONFIG[key];
  const aut = state.automators[key];
  if (!isAutomatorUnlocked(key)) return false;
  if (aut.owned)                  return false;
  if (state.energy < cfg.price)   return false;
  state.energy -= cfg.price;
  aut.owned   = true;
  aut.enabled = (key === 'poke'); // poke automator starts enabled automatically
  if (key === 'buy') state.replaced = true;
  return true;
}

function toggleAutomator(key) {
  const aut = state.automators[key];
  if (!aut.owned) return;
  aut.enabled = !aut.enabled;
}

function tick() {
  const auts = state.automators;

  if (auts.poke.owned    && auts.poke.enabled)    { for (const h of state.hamsters) { if (h.state !== 'EXHAUSTED') h.poke(); } }
  if (auts.hydrate.owned && auts.hydrate.enabled) { for (const h of state.hamsters) h.hydrate(); }
  if (auts.feed.owned    && auts.feed.enabled)    { for (const h of state.hamsters) h.feed(); }

  for (const h of state.hamsters) state.energy += h.tick();

  if (auts.buy.owned && auts.buy.enabled) {
    const price = nextHamsterPrice();
    if (state.energy >= price) {
      state.energy -= price;
      state.hamsters.push(new Hamster(state.nextId++));
      state.hamstersBought++;
    }
  }

  let totalDrain = 0;
  for (const [key, aut] of Object.entries(auts)) {
    if (aut.owned && aut.enabled) totalDrain += AUTOMATOR_CONFIG[key].drain;
  }
  state.energy = Math.max(0, state.energy - totalDrain);
}

// ═══════════════════════════════════════════════════════════════
// UI / RENDERING
// ═══════════════════════════════════════════════════════════════

function renderAll() {
  renderEnergy();
  renderShop();
  renderHamsters();
  renderReplacedBanner();
}

function renderEnergy() {
  document.getElementById('energy-count').textContent = Math.floor(state.energy);
}

function renderShop() {
  const price  = nextHamsterPrice();
  const buyBtn = document.getElementById('buy-hamster-btn');
  buyBtn.disabled  = state.energy < price;
  buyBtn.innerHTML = `HIRE HAMSTER<br><span style="color:#ffd700">[ ${price}⚡ ]</span>`;

  for (const key of Object.keys(AUTOMATOR_CONFIG)) renderAutomatorSlot(key);
}

function renderAutomatorSlot(key) {
  const cfg       = AUTOMATOR_CONFIG[key];
  const aut       = state.automators[key];
  const container = document.getElementById('automator-shop');
  const unlocked  = isAutomatorUnlocked(key);
  let   btn       = document.getElementById(`auto-btn-${key}`);

  if (!unlocked) { if (btn) btn.classList.add('hidden'); return; }

  if (!btn) {
    btn = document.createElement('button');
    btn.id = `auto-btn-${key}`;
    btn.classList.add('auto-btn');
    container.appendChild(btn);
    btn.addEventListener('click', () => {
      if (!state.automators[key].owned) buyAutomator(key);
      else                              toggleAutomator(key);
      renderAll();
    });
  }

  btn.classList.remove('hidden');

  if (!aut.owned) {
    btn.dataset.active = 'false';
    btn.disabled       = state.energy < cfg.price;
    btn.innerHTML =
      `${cfg.emoji} ${cfg.name} AUTOMATOR<br>` +
      `<span style="color:#ffd700">[ ${cfg.price}⚡ ]</span>` +
      `<span class="drain-hint"> -${cfg.drain}⚡/s</span>`;
  } else {
    btn.disabled       = false;
    btn.dataset.active = aut.enabled;
    btn.innerHTML =
      `${cfg.emoji} ${cfg.name}: ${aut.enabled ? 'ON' : 'OFF'}` +
      `<span class="drain-hint"> -${cfg.drain}⚡/s</span>`;
  }
  console.log(
  key,
  'hamsters.length =', state.hamsters.length,
  'unlockAt =', AUTOMATOR_CONFIG[key].unlockAt,
  'unlocked =', isAutomatorUnlocked(key)
);
}

function renderReplacedBanner() {
  if (state.replaced) document.getElementById('replaced-banner').classList.remove('hidden');
}

function renderHamsters() {
  const grid = document.getElementById('hamster-grid');
  for (const h of state.hamsters) {
    let card = document.getElementById(`hamster-${h.id}`);
    if (!card) { card = buildCard(h); grid.appendChild(card); }
    updateCard(card, h);
  }
}

function buildCard(h) {
  const card = document.createElement('div');
  card.className = 'hamster-card';
  card.id        = `hamster-${h.id}`;
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
        <div class="meter-bar"><div class="meter-fill food-fill" style="width:50%"></div></div>
      </div>
      <div class="meter-row">
        <span class="meter-icon" title="Water">💧</span>
        <div class="meter-bar"><div class="meter-fill water-fill" style="width:57%"></div></div>
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
  badge.textContent   = h.state === 'EXHAUSTED' ? `TIRED (${h.overwork_cooldown}s)` : h.state;

  card.querySelector('.hamster-emoji').textContent = h.state === 'EXHAUSTED' ? '😵' : '🐹';

  const foodPct  = Math.max(0, (h.food_stamina  / 20) * 100);
  const waterPct = Math.max(0, (h.water_stamina /  7) * 100);
  const foodFill  = card.querySelector('.food-fill');
  const waterFill = card.querySelector('.water-fill');
  foodFill.style.width  = `${foodPct}%`;
  waterFill.style.width = `${waterPct}%`;
  foodFill.classList.toggle('low',  foodPct  < 25);
  waterFill.classList.toggle('low', waterPct < 25);

  card.querySelector('.poke-btn').disabled = h.state === 'EXHAUSTED';

  if (h.state === 'WORKING') {
    const pop = document.createElement('span');
    pop.className   = 'energy-pop';
    pop.textContent = '+1⚡';
    card.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove(), { once: true });
  }
}

// ═══════════════════════════════════════════════════════════════
// INIT & GAME LOOP
// ═══════════════════════════════════════════════════════════════

addStartingHamster();
renderAll();

setInterval(() => { tick(); renderAll(); }, 1000);

document.getElementById('buy-hamster-btn').addEventListener('click', () => {
  buyHamster(); renderAll();
});

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
