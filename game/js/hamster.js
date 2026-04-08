// hamster.js — Hamster class with state machine
// States: 'IDLE' | 'WORKING' | 'EXHAUSTED'

export class Hamster {
  constructor(id) {
    this.id = id;
    this.state = 'IDLE';
    // Start half-stocked so the player has a moment to learn
    this.food_stamina = 10;   // max 20 (feed resets to 20)
    this.water_stamina = 4;   // max  7 (hydrate resets to 7)
    this.work_cooldown = 0;
    this.overwork_cooldown = 0;
  }

  feed() {
    this.food_stamina = 20;
  }

  hydrate() {
    this.water_stamina = 7;
  }

  // Returns true if hamster starts working, false if it went EXHAUSTED
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

  // Called once per second. Returns energy generated (0 or 1).
  tick() {
    let energy = 0;

    if (this.state === 'WORKING') {
      this.work_cooldown   = Math.max(0, this.work_cooldown   - 1);
      this.food_stamina    = Math.max(0, this.food_stamina    - 1);
      this.water_stamina   = Math.max(0, this.water_stamina   - 1);
      energy = 1;

      // Exhaustion takes priority over normal cooldown expiry
      if (this.food_stamina <= 0 || this.water_stamina <= 0) {
        this.state = 'EXHAUSTED';
        this.overwork_cooldown = 10;
      } else if (this.work_cooldown <= 0) {
        this.state = 'IDLE';
      }

    } else if (this.state === 'EXHAUSTED') {
      this.overwork_cooldown = Math.max(0, this.overwork_cooldown - 1);
      if (this.overwork_cooldown <= 0) {
        this.state = 'IDLE';
      }
    }
    // IDLE: nothing ticks

    return energy;
  }
}
