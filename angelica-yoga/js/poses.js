// Poses list page: search + filter

(async function () {
  const grid = document.getElementById('pose-grid');
  const empty = document.getElementById('empty-state');
  const searchInput = document.getElementById('search');
  const diffChips = document.getElementById('difficulty-chips');
  const catChips = document.getElementById('category-chips');
  const countEl = document.getElementById('pose-count');
  const clearBtn = document.getElementById('clear-filters');

  const state = {
    query: '',
    difficulty: null,
    categories: new Set(),
  };

  const poses = await Yoga.loadPoses();

  // Build category chips from unique categories in the data
  const allCategories = new Set();
  poses.forEach(p => (p.categories || []).forEach(c => allCategories.add(c)));
  const orderedCats = [
    'Standing', 'Seated', 'Forward Bend', 'Backbend', 'Twist',
    'Inversion', 'Balance', 'Hip Opener', 'Restorative', 'Core',
  ].filter(c => allCategories.has(c));
  orderedCats.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.category = cat;
    b.textContent = cat;
    catChips.appendChild(b);
  });

  function render() {
    const q = state.query.trim().toLowerCase();
    const filtered = poses.filter(p => {
      if (q) {
        const hay = (p.english_name + ' ' + p.sanskrit_name).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (state.difficulty && p.difficulty !== state.difficulty) return false;
      if (state.categories.size > 0) {
        const has = (p.categories || []).some(c => state.categories.has(c));
        if (!has) return false;
      }
      return true;
    });

    countEl.textContent = `${filtered.length} pose${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    grid.innerHTML = filtered.map(p => `
      <a href="pose.html?id=${encodeURIComponent(p.id)}" class="pose-card" role="listitem">
        <img class="pose-card-img" src="${Yoga.escapeHtml(p.image)}" alt="${Yoga.escapeHtml(p.english_name)}" loading="lazy">
        <div class="pose-card-body">
          <p class="pose-card-en">${Yoga.escapeHtml(p.english_name)}</p>
          <p class="pose-card-sa">${Yoga.escapeHtml(p.sanskrit_name)}</p>
          <span class="pose-card-diff">${Yoga.escapeHtml(p.difficulty)}</span>
        </div>
      </a>
    `).join('');
  }

  // Search input
  searchInput.addEventListener('input', e => {
    state.query = e.target.value;
    render();
  });

  // Difficulty chips (single-select toggle)
  diffChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    const diff = btn.dataset.difficulty;
    if (state.difficulty === diff) {
      state.difficulty = null;
      btn.classList.remove('active');
    } else {
      state.difficulty = diff;
      diffChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    }
    render();
  });

  // Category chips (multi-select)
  catChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    const cat = btn.dataset.category;
    if (state.categories.has(cat)) {
      state.categories.delete(cat);
      btn.classList.remove('active');
    } else {
      state.categories.add(cat);
      btn.classList.add('active');
    }
    render();
  });

  // Clear filters
  clearBtn.addEventListener('click', () => {
    state.query = '';
    state.difficulty = null;
    state.categories.clear();
    searchInput.value = '';
    diffChips.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
    catChips.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
    render();
  });

  render();
})();
