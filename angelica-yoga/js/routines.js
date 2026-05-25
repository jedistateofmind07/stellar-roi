// Routines list page

(async function () {
  const routines = await Yoga.loadRoutines();
  const seqGrid = document.getElementById('sequences-grid');
  const classGrid = document.getElementById('classes-grid');

  function card(r) {
    const sanskrit = r.sanskrit_name
      ? `<p class="routine-card-sa">${Yoga.escapeHtml(r.sanskrit_name)}</p>`
      : '';
    return `
      <a href="routine.html?id=${encodeURIComponent(r.id)}" class="routine-card" role="listitem">
        <h3 class="routine-card-name">${Yoga.escapeHtml(r.name)}</h3>
        ${sanskrit}
        <div class="routine-card-meta">
          <span><strong>${r.duration_minutes}</strong> min</span>
          <span><strong>${r.level}</strong></span>
          <span><strong>${r.poses.length}</strong> poses</span>
        </div>
      </a>
    `;
  }

  const sequences = routines.filter(r => r.type === 'Sequence');
  const classes = routines.filter(r => r.type === 'Class');

  seqGrid.innerHTML = sequences.map(card).join('');
  classGrid.innerHTML = classes.map(card).join('');
})();
