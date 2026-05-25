// Shared helpers across pages

const Yoga = {
  async loadPoses() {
    if (this._poses) return this._poses;
    const res = await fetch('data/poses.json');
    this._poses = await res.json();
    this._poseById = new Map(this._poses.map(p => [p.id, p]));
    return this._poses;
  },

  async loadRoutines() {
    if (this._routines) return this._routines;
    const res = await fetch('data/routines.json');
    this._routines = await res.json();
    return this._routines;
  },

  poseById(id) {
    return this._poseById ? this._poseById.get(id) : null;
  },

  formatDuration(totalSeconds) {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return s === 0 ? `${m} min` : `${m}m ${s}s`;
  },

  getParam(name) {
    return new URLSearchParams(location.search).get(name);
  },

  escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
};
