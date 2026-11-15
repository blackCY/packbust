(function () {
  'use strict';

  const storageKey = 'packbust.v1';
  const rarities = [
    { key: 'common', name: 'Common', value: 1 },
    { key: 'uncommon', name: 'Uncommon', value: 2 },
    { key: 'rare', name: 'Rare', value: 5 },
    { key: 'holo', name: 'Holo', value: 15 },
    { key: 'secret', name: 'Secret', value: 40 }
  ];
  const packs = [
    { key: 'basic', name: 'Basic Pack', cost: 10, rates: [700, 200, 80, 18, 2] },
    { key: 'pro', name: 'Pro Pack', cost: 25, rates: [550, 280, 120, 40, 10] },
    { key: 'collector', name: 'Collector Pack', cost: 60, rates: [400, 300, 200, 80, 20] }
  ];
  const attributes = [
    {
      key: 'cinder', name: 'Cinder',
      icon: '<path d="M12 2 8 9l-5 4 4 7h10l4-7-5-4-4-7Z"/><path d="m12 11-3 5h6l-3-5Z"/>',
      names: ['Kiln Mote', 'Ash Hopper', 'Flint Finch', 'Copper Toad', 'Soot Hare', 'Wick Hound', 'Glaze Cobra', 'Singe Crane', 'Furnace Lynx', 'Brass Mantid', 'Coal Antler', 'Crown of Scoria', 'Glassback Roc', 'Vesper Kiln', 'The Red Meridian']
    },
    {
      key: 'brine', name: 'Brine',
      icon: '<path d="M3 8c3-4 6-4 9 0s6 4 9 0M3 13c3-4 6-4 9 0s6 4 9 0M3 18c3-4 6-4 9 0s6 4 9 0"/>',
      names: ['Salt Skipper', 'Foam Wren', 'Kelp Midge', 'Drift Claw', 'Tidal Newt', 'Reef Scribe', 'Pearl Grouse', 'Cove Lurker', 'Basin Ray', 'Tangle Whale', 'Rime Cuttle', 'Blueglass Leviathan', 'Mirror Shoal', 'Deepwater Loom', 'The Sunken Bell']
    },
    {
      key: 'tangle', name: 'Tangle',
      icon: '<path d="M12 21v-9m0 4C5 16 3 12 3 6c6 0 9 3 9 8m0 0c0-7 3-10 9-11 0 7-3 11-9 11Z"/>',
      names: ['Bristle Pip', 'Moss Cricket', 'Root Runner', 'Spore Finch', 'Fern Snail', 'Bramble Loper', 'Acorn Shrew', 'Mire Beetle', 'Thistle Elk', 'Canopy Viper', 'Orchid Keeper', 'Barkglass Stag', 'Ivy Colossus', 'Woven Grove', 'The Walking Orchard']
    },
    {
      key: 'glint', name: 'Glint',
      icon: '<path d="M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/><path d="M12 8v8M8 12h8"/>',
      names: ['Prism Tick', 'Chrome Minnow', 'Shiver Wasp', 'Dawn Plover', 'Flicker Moth', 'Quartz Fennec', 'Halo Jackal', 'Beryl Heron', 'Chime Pangolin', 'Spectrum Swan', 'Shardshell', 'Facet Chimera', 'Aurora Censer', 'Silver Apogee', 'The Seventh Prism']
    },
    {
      key: 'hush', name: 'Hush',
      icon: '<path d="M20 14a9 9 0 0 1-10-12 9 9 0 1 0 10 12Z"/><path d="m17 3 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/>',
      names: ['Dusk Gnat', 'Mute Kestrel', 'Veil Mole', 'Hollow Tern', 'Lapse Gecko', 'Shade Prowler', 'Echo Stilt', 'Umber Vole', 'Penumbral Kite', 'Quiet Aurochs', 'Black Lantern', 'Lunar Archivist', 'Velvet Eclipse', 'Midnight Index', 'The Last Silence']
    },
    {
      key: 'grit', name: 'Grit',
      icon: '<path d="M3 18 7 9l5 3 4-9 5 15-9 3-9-3Z"/><path d="m7 9 2 8 3 4m4-18 1 12 4 3M9 17l8-2"/>',
      names: ['Pebble Ram', 'Dust Nymph', 'Shale Lizard', 'Chalk Dove', 'Cairn Cricket', 'Ochre Jackrabbit', 'Scree Mantis', 'Dune Carver', 'Slate Badger', 'Crag Ibex', 'Fossil Warden', 'Marble Harrier', 'Monolith Bison', 'Basalt Atlas', 'The Hollow Mountain']
    }
  ];
  const cards = attributes.flatMap((attribute, family) => attribute.names.map((name, position) => {
    const rarity = position < 5 ? 0 : position < 9 ? 1 : position < 12 ? 2 : position < 14 ? 3 : 4;
    return { id: family * 15 + position + 1, name, attribute, rarity: rarities[rarity] };
  }));
  const pools = rarities.map(rarity => cards.filter(card => card.rarity === rarity));
  const mounts = new WeakMap();
  const subscribers = new Set();
  const events = window.document.createDocumentFragment();
  const initialState = { points: 60, counts: {}, last: null };
  let state = initialState;
  let memoryOnly = false;
  let lastSeed = -1;

  function validResult(seed, pack) {
    return Number.isSafeInteger(seed) && seed >= 0 && packs.some(entry => entry.key === pack);
  }

  function readState() {
    if (memoryOnly) return state;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return initialState;
      const saved = JSON.parse(raw);
      if (!saved || !Number.isSafeInteger(saved.points) || saved.points < 0) return state;

      const counts = {};
      for (const card of cards) {
        const count = saved.counts && saved.counts[card.id];
        if (Number.isSafeInteger(count) && count > 0) counts[card.id] = count;
      }
      const last = saved.last && validResult(saved.last.seed, saved.last.pack) ? saved.last : null;
      return { points: saved.points, counts, last };
    } catch {
      return state;
    }
  }

  function saveState(next) {
    state = next;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      memoryOnly = true;
      return false;
    }
    memoryOnly = false;
    return true;
  }

  function mulberry32(seed) {
    let bits = seed >>> 0;
    return function () {
      bits = (bits + 0x6d2b79f5) >>> 0;
      let result = Math.imul(bits ^ (bits >>> 15), bits | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function draw(seed, pack) {
    const random = mulberry32(seed);
    return Array.from({ length: 5 }, () => {
      let roll = Math.floor(random() * 1000);
      const tier = pack.rates.findIndex(rate => {
        roll -= rate;
        return roll < 0;
      });
      const pool = pools[tier];
      return pool[Math.floor(random() * pool.length)];
    });
  }

  function readShare() {
    const params = new URL(window.location.href).searchParams;
    const seedText = params.get('seed');
    const pack = params.get('pack');
    const seed = Number(seedText);
    return seedText !== null && /^\d+$/.test(seedText) && validResult(seed, pack) ? { seed, pack } : null;
  }

  function shareURL(result) {
    const url = new URL(window.location.href);
    url.searchParams.set('seed', result.seed);
    url.searchParams.set('pack', result.pack);
    return url.href;
  }

  const mark = '<svg class="pb-marker" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 1 2.8 7.9L23 12l-8.2 3.1L12 23l-2.8-7.9L1 12l8.2-3.1L12 1Zm0 7-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3Z"/></svg>';
  const pointIcon = '<svg class="pb-point-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 17 6v8l-7 4-7-4V6l7-4Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m11 5-4 6h3l-1 4 4-6h-3l1-4Z" fill="currentColor"/></svg>';
  const chevron = '<svg class="pb-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function packArt(pack) {
    const symbols = {
      basic: '<path d="m26 22 11 11-11 11-11-11 11-11Z"/><path d="M26 27v12m-6-6h12"/>',
      pro: '<path d="M26 21 16 33l10 12 10-12-10-12Zm0 6-5 6 5 6 5-6-5-6Z"/><path d="M10 33h5m22 0h5"/>',
      collector: '<path d="m26 20 3.6 9.4 9.4 3.6-9.4 3.6L26 46l-3.6-9.4L13 33l9.4-3.6L26 20Z"/><circle cx="26" cy="33" r="4"/>'
    };
    return `<svg class="pb-pack-art" viewBox="0 0 52 66" aria-hidden="true">
      <path class="pb-pack-foil" d="M6 4h40l-3 8 2 3v36l-2 4 3 7H6l3-7-2-4V15l2-3-3-8Z"/>
      <path d="M9 12h34M9 54h34M11 7h30M11 59h30M12 46l9-27m10 28 9-25"/>
      ${symbols[pack.key]}
    </svg>`;
  }

  function cardBack() {
    return `<div class="pb-card-back" aria-hidden="true">${mark}</div>`;
  }

  function cardFace(card) {
    const { attribute, rarity } = card;
    const number = String(card.id).padStart(3, '0');
    const x = 15 + (card.id * 17) % 63;
    const y = 13 + (card.id * 11) % 39;
    const angle = (card.id * 23) % 72 - 36;
    return `<div class="pb-card-face pb-attribute-${attribute.key} pb-rarity-${rarity.key}" data-pb-card="${number}" data-pb-rarity="${rarity.key}">
      <div class="pb-card-meta"><span>${number}</span><svg viewBox="0 0 24 24" aria-hidden="true">${attribute.icon}</svg></div>
      <svg class="pb-card-art" viewBox="0 0 100 70" aria-hidden="true">
        <circle cx="${x}" cy="${y}" r="${7 + card.id % 11}"/>
        <path d="M0 61 26 ${32 + card.id % 16} 46 57 73 ${25 + card.id % 14} 100 57M0 66h100"/>
        <ellipse cx="50" cy="34" rx="35" ry="13" transform="rotate(${angle} 50 34)"/>
        <g transform="translate(33 17) scale(1.42)">${attribute.icon}</g>
      </svg>
      <div class="pb-card-name">${card.name}</div>
      <div class="pb-card-rarity">${rarity.name}</div>
      <span class="pb-sr-only">Attribute ${attribute.name}</span>
    </div>`;
  }

  function onStorage(event) {
    if (event.key === storageKey || event.key === null) {
      state = readState();
      events.dispatchEvent(new Event('pb-state'));
    }
  }

  function mount(container) {
    if (!container || container.nodeType !== 1) return;
    if (mounts.has(container)) return mounts.get(container);

    state = readState();
    const doc = container.ownerDocument;
    const root = doc.createElement('section');
    root.className = 'pb-root';
    root.setAttribute('aria-label', 'PackBust');
    root.innerHTML = `
      <div class="pb-shell">
        <div class="pb-top">
          <div class="pb-brand">${mark}<span>PackBust</span></div>
          <div class="pb-balance" role="status">${pointIcon}<strong class="pb-points"></strong><span>pts</span></div>
        </div>
        <div class="pb-panels">
          <section class="pb-picker" aria-label="Packs">
            <h2 class="pb-heading">Choose a pack</h2>
            <div class="pb-packs">
              ${packs.map(pack => `<button type="button" class="pb-pack pb-pack-${pack.key}" data-pb-pack="${pack.key}" aria-pressed="false">
                ${packArt(pack)}<span class="pb-pack-copy"><strong>${pack.name}</strong><span>${pointIcon}${pack.cost} pts</span></span>
                <span class="pb-pack-check" aria-hidden="true">✓</span>
              </button>`).join('')}
            </div>
            <details class="pb-rates">
              <summary>Pull rates ${chevron}</summary>
              <table class="pb-rate-table">
                <thead><tr><th scope="col">Rarity</th><th scope="col">Basic</th><th scope="col">Pro</th><th scope="col">Collector</th></tr></thead>
                <tbody>${rarities.map((rarity, index) => `<tr><th scope="row" class="pb-text-${rarity.key}">${rarity.name}</th>${packs.map(pack => `<td>${pack.rates[index] / 10}%</td>`).join('')}</tr>`).join('')}</tbody>
              </table>
            </details>
          </section>
          <section class="pb-opening" aria-label="Pack opening">
            <div class="pb-stage-head">
              <h2 class="pb-heading pb-stage-title"></h2>
              <span class="pb-stage-count"></span>
            </div>
            <div class="pb-stage">
              <ol class="pb-tray" aria-label="Pack cards"></ol>
              <div class="pb-tear" aria-hidden="true"></div>
            </div>
            <div class="pb-actions">
              <button type="button" class="pb-button pb-primary"></button>
              <button type="button" class="pb-button pb-secondary pb-skip" hidden>Skip</button>
              <button type="button" class="pb-button pb-secondary pb-share" hidden>Copy share link</button>
            </div>
            <input class="pb-share-url" type="text" readonly aria-label="Share link" hidden>
            <p class="pb-feedback" role="status"></p>
          </section>
        </div>
        <section class="pb-collection" aria-label="Collection">
          <div class="pb-collection-head">
            <h2 class="pb-heading">Collection <span class="pb-progress"></span></h2>
            <button type="button" class="pb-button pb-secondary pb-recycle"></button>
          </div>
          <progress class="pb-progress-bar" max="90" value="0" aria-label="Collection progress"></progress>
          <ul class="pb-tally" aria-label="Unique cards by rarity"></ul>
          <details class="pb-binder">
            <summary>View collected cards ${chevron}</summary>
            <div class="pb-owned"></div>
          </details>
        </section>
      </div>`;
    container.append(root);

    const select = name => root.querySelector('.pb-' + name);
    const packButtons = Array.from(root.querySelectorAll('[data-pb-pack]'));
    const openButton = select('primary');
    const skipButton = select('skip');
    const shareButton = select('share');
    const recycleButton = select('recycle');
    const tray = select('tray');
    const tear = select('tear');
    const shareInput = select('share-url');
    const binder = select('binder');
    const feedback = select('feedback');
    const slots = Array.from({ length: 5 }, () => {
      const slot = doc.createElement('li');
      slot.className = 'pb-slot';
      tray.append(slot);
      return slot;
    });

    const replay = readShare();
    let result = replay || state.last;
    let selected = packs.find(pack => result && pack.key === result.pack) || packs[2];
    let replaying = Boolean(replay);
    let opening = null;
    let resultVersion = 0;
    let pending = false;
    let active = true;

    function drawBacks() {
      for (const slot of slots) {
        slot.classList.remove('pb-flip');
        slot.innerHTML = cardBack();
      }
    }

    function showCard(index, card, animate) {
      const slot = slots[index];
      slot.innerHTML = cardFace(card);
      slot.classList.toggle('pb-flip', animate);
    }

    function updateStage() {
      const shownPack = result ? packs.find(pack => pack.key === result.pack) : selected;
      select('stage-title').textContent = shownPack.name;
      select('stage-count').textContent = replaying ? 'Shared pack · 5 cards' : '5 cards';
    }

    function updateCollection() {
      const collected = cards.filter(card => state.counts[card.id]);
      const repeats = collected.reduce((sum, card) => sum + state.counts[card.id] - 1, 0);
      const refund = collected.reduce((sum, card) => sum + (state.counts[card.id] - 1) * card.rarity.value, 0);
      select('progress').textContent = `${collected.length}/${cards.length}`;
      select('progress-bar').value = collected.length;
      select('tally').innerHTML = rarities.map(rarity => {
        const count = collected.filter(card => card.rarity === rarity).length;
        return `<li class="pb-text-${rarity.key}"><span>${rarity.name}</span><strong>${count}</strong></li>`;
      }).join('');
      recycleButton.textContent = repeats ? `Recycle ${repeats} · +${refund} pts` : 'Recycle duplicates';
      recycleButton.disabled = pending || Boolean(opening) || repeats === 0;
      if (binder.open) {
        select('owned').innerHTML = collected.length ? `<ol class="pb-binder-grid">${collected.map(card =>
          `<li>${cardFace(card)}<span class="pb-quantity">${state.counts[card.id] - 1} duplicates</span></li>`
        ).join('')}</ol>` : '<p class="pb-empty">Your collection is empty.</p>';
      }
    }

    function updateControls() {
      select('points').textContent = state.points;
      for (const button of packButtons) {
        button.disabled = pending || Boolean(opening);
        button.setAttribute('aria-pressed', String(button.dataset.pbPack === selected.key));
      }
      openButton.disabled = pending || Boolean(opening) || state.points < selected.cost;
      openButton.textContent = opening ? 'Opening…' : state.points < selected.cost ? 'Not enough points' : `Open pack · ${selected.cost} pts`;
      skipButton.hidden = !opening;
      shareButton.disabled = pending;
      shareButton.hidden = Boolean(opening) || !result;
      updateCollection();
    }

    function runAction(action) {
      if (opening || pending) return;
      if (!window.navigator.locks) {
        action();
        return;
      }

      pending = true;
      updateControls();
      const perform = () => {
        pending = false;
        if (active) action();
      };
      // Share one read/modify/write lock across tabs when the browser supports it.
      window.navigator.locks.request(storageKey, perform).catch(() => {
        if (pending) perform();
      });
    }

    function finish(animated) {
      if (!opening) return;
      const focusSkip = doc.activeElement === skipButton;
      for (const timer of opening.timers) window.clearTimeout(timer);
      opening.cards.forEach((card, index) => {
        if (!animated || index >= opening.shown) showCard(index, card, false);
      });
      tear.classList.remove('pb-tearing');
      tear.innerHTML = '';
      opening = null;
      feedback.textContent = storageMessage('5 cards revealed.');
      updateControls();
      if (focusSkip) shareButton.focus();
    }

    let canSave = true;
    function storageMessage(message) {
      return canSave ? message : message + ' Progress is available for this session only.';
    }

    function startOpening() {
      if (opening) return;
      state = readState();
      if (state.points < selected.cost) {
        updateControls();
        return;
      }

      lastSeed = Math.max(Date.now(), lastSeed + 1);
      const next = { seed: lastSeed, pack: selected.key };
      const drawn = draw(next.seed, selected);
      const counts = { ...state.counts };
      for (const card of drawn) counts[card.id] = (counts[card.id] || 0) + 1;
      canSave = saveState({ points: state.points - selected.cost, counts, last: next });
      resultVersion += 1;
      result = next;
      replaying = false;
      shareInput.hidden = true;
      feedback.textContent = '';
      drawBacks();
      opening = { cards: drawn, timers: [], shown: 0 };
      updateStage();
      events.dispatchEvent(new Event('pb-state'));
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish(false);
        return;
      }

      const packSvg = packArt(selected);
      tear.className = `pb-tear pb-pack-${selected.key} pb-tearing`;
      tear.innerHTML = `<div class="pb-tear-top">${packSvg}</div><div class="pb-tear-bottom">${packSvg}</div>`;
      drawn.forEach((card, index) => {
        opening.timers.push(window.setTimeout(() => {
          showCard(index, card, true);
          opening.shown = index + 1;
        }, 480 + index * 220));
      });
      opening.timers.push(window.setTimeout(() => finish(true), 1850));
    }

    function recycle() {
      if (opening) return;
      state = readState();
      const counts = { ...state.counts };
      let refund = 0;
      let repeats = 0;
      for (const card of cards) {
        const extra = (counts[card.id] || 0) - 1;
        if (extra <= 0) continue;
        counts[card.id] = 1;
        refund += extra * card.rarity.value;
        repeats += extra;
      }
      if (!repeats) {
        updateControls();
        return;
      }
      canSave = saveState({ ...state, points: state.points + refund, counts });
      feedback.textContent = storageMessage(`Recycled ${repeats} ${repeats === 1 ? 'duplicate' : 'duplicates'} for ${refund} pts.`);
      events.dispatchEvent(new Event('pb-state'));
    }

    async function share() {
      if (!active || opening || pending || !result) return;
      const version = resultVersion;
      const url = shareURL(result);
      try {
        await window.navigator.clipboard.writeText(url);
        if (version === resultVersion) feedback.textContent = 'Share link copied.';
        return;
      } catch {
        if (version !== resultVersion) return;
        shareInput.value = url;
        shareInput.hidden = false;
        shareInput.focus();
        shareInput.select();
        let copied = false;
        try {
          copied = Boolean(doc.execCommand && doc.execCommand('copy'));
        } catch {
          // Keep the input selected for manual copying.
        }
        if (copied) {
          shareInput.hidden = true;
          shareButton.focus();
          feedback.textContent = 'Share link copied.';
        } else {
          feedback.textContent = 'Copy the selected link to share this pack.';
        }
      }
    }

    function unmount() {
      active = false;
      resultVersion += 1;
      if (opening) opening.timers.forEach(timer => window.clearTimeout(timer));
      events.removeEventListener('pb-state', updateControls);
      subscribers.delete(root);
      if (!subscribers.size) window.removeEventListener('storage', onStorage);
      mounts.delete(container);
      root.remove();
    }

    for (const button of packButtons) {
      button.addEventListener('click', () => {
        if (opening || pending || button.dataset.pbPack === selected.key) return;
        selected = packs.find(pack => pack.key === button.dataset.pbPack);
        resultVersion += 1;
        result = null;
        replaying = false;
        shareInput.hidden = true;
        feedback.textContent = '';
        drawBacks();
        updateStage();
        updateControls();
      });
    }
    openButton.addEventListener('click', () => runAction(startOpening));
    skipButton.addEventListener('click', () => finish(false));
    shareButton.addEventListener('click', share);
    recycleButton.addEventListener('click', () => runAction(recycle));
    binder.addEventListener('toggle', updateCollection);
    events.addEventListener('pb-state', updateControls);
    if (!subscribers.size) window.addEventListener('storage', onStorage);
    subscribers.add(root);
    mounts.set(container, unmount);

    if (result) draw(result.seed, selected).forEach((card, index) => showCard(index, card, false));
    else drawBacks();
    updateStage();
    updateControls();
    return unmount;
  }

  window.PackBust = { mount };

  function autoMount() {
    const container = document.getElementById('pb-app');
    if (container) mount(container);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount, { once: true });
  else autoMount();
}());
