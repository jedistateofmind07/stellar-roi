// Pose detail page

(async function () {
  const id = Yoga.getParam('id');
  const loading = document.getElementById('pose-loading');
  const article = document.getElementById('pose-article');
  const errorEl = document.getElementById('pose-error');

  await Yoga.loadPoses();
  const pose = Yoga.poseById(id);

  loading.hidden = true;

  if (!pose) {
    errorEl.hidden = false;
    return;
  }

  document.title = `${pose.english_name} — Angelica's Yoga`;

  document.getElementById('pose-image').src = pose.image;
  document.getElementById('pose-image').alt = pose.english_name;
  document.getElementById('pose-english').textContent = pose.english_name;
  document.getElementById('pose-sanskrit').textContent = pose.sanskrit_name;

  const tagsEl = document.getElementById('pose-tags');
  tagsEl.innerHTML = `
    <span class="tag tag-difficulty">${Yoga.escapeHtml(pose.difficulty)}</span>
    ${(pose.categories || []).map(c => `<span class="tag">${Yoga.escapeHtml(c)}</span>`).join('')}
  `;

  document.getElementById('pose-instructions').innerHTML = (pose.instructions || [])
    .map(step => `<li>${Yoga.escapeHtml(step)}</li>`).join('');

  document.getElementById('pose-benefits').innerHTML = (pose.benefits || [])
    .map(b => `<li>${Yoga.escapeHtml(b)}</li>`).join('');

  document.getElementById('pose-contra').innerHTML = (pose.contraindications || [])
    .map(c => `<li>${Yoga.escapeHtml(c)}</li>`).join('');

  article.hidden = false;
})();
