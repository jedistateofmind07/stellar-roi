// Routine detail page

(async function () {
  const id = Yoga.getParam('id');
  const loading = document.getElementById('routine-loading');
  const article = document.getElementById('routine-article');
  const errorEl = document.getElementById('routine-error');

  const [poses, routines] = await Promise.all([Yoga.loadPoses(), Yoga.loadRoutines()]);
  const routine = routines.find(r => r.id === id);

  loading.hidden = true;

  if (!routine) {
    errorEl.hidden = false;
    return;
  }

  document.title = `${routine.name} — Angelica's Yoga`;

  document.getElementById('routine-type').textContent = routine.type;
  document.getElementById('routine-name').textContent = routine.name;

  const sanskritEl = document.getElementById('routine-sanskrit');
  if (routine.sanskrit_name) {
    sanskritEl.textContent = routine.sanskrit_name;
  } else {
    sanskritEl.hidden = true;
  }

  const totalSeconds = routine.poses.reduce((sum, p) => sum + (p.hold_seconds || 0), 0);
  const minLabel = routine.duration_minutes
    ? `${routine.duration_minutes} min`
    : Yoga.formatDuration(totalSeconds);

  document.getElementById('routine-duration').textContent = minLabel;
  document.getElementById('routine-level').textContent = routine.level;
  document.getElementById('routine-pose-count').textContent = routine.poses.length;
  document.getElementById('routine-description').textContent = routine.description;

  const flowList = document.getElementById('flow-list');
  flowList.innerHTML = routine.poses.map(step => {
    const pose = Yoga.poseById(step.pose_id);
    const name = pose ? pose.english_name : `(unknown: ${step.pose_id})`;
    const sanskrit = pose ? pose.sanskrit_name : '';
    const img = pose ? pose.image : '';
    const hold = Yoga.formatDuration(step.hold_seconds);
    const note = step.note ? `<p class="flow-note">${Yoga.escapeHtml(step.note)}</p>` : '';
    const href = pose ? `/pose?id=${encodeURIComponent(pose.id)}` : '#';
    return `
      <li>
        <a href="${href}" class="flow-row">
          <span class="flow-num" aria-hidden="true"></span>
          <img class="flow-thumb" src="${Yoga.escapeHtml(img)}" alt="" loading="lazy">
          <div class="flow-body">
            <p class="flow-name">${Yoga.escapeHtml(name)}${sanskrit ? ` <span style="color:var(--muted);font-style:italic;font-weight:400;font-size:13px;">· ${Yoga.escapeHtml(sanskrit)}</span>` : ''}</p>
            ${note}
          </div>
          <span class="flow-hold">${hold}</span>
        </a>
      </li>
    `;
  }).join('');

  article.hidden = false;
})();
