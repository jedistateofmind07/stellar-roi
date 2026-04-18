const SUPA_URL = 'https://tlbeilrkfhjevnlvfnxa.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYmVpbHJrZmhqZXZubHZmbnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTEyMjcsImV4cCI6MjA5MjAyNzIyN30.pD8fkK2Ju31VzA032_M8NZk5ASp4Z-tCdowgohW5-JE';
const { createClient } = window.supabase;
const db = createClient(SUPA_URL, SUPA_KEY);

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
let sChart = null, pChart = null;
let C = { projects: [], bids: [], lineItems: [], payments: [], expenses: [] };

function setConn(ok, msg) {
  const el = document.getElementById('conn-label');
  if (el) { el.textContent = msg; el.style.color = ok ? '#00c805' : '#ff5000'; }
}

function showFb(id, type, msg, dur = 3000) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'fb ' + type;
  el.textContent = msg;
  el.style.display = 'inline-flex';
  if (dur) setTimeout(() => el.style.display = 'none', dur);
}

async function load() {
  try {
    const [p, b, li, pay, exp] = await Promise.all([
      db.from('projects').select('*').order('created_at', { ascending: false }),
      db.from('bids').select('*').order('submitted_at', { ascending: false }),
      db.from('bid_line_items').select('*'),
      db.from('payments').select('*').order('paid_at', { ascending: false }),
      db.from('expenses').select('*').order('submitted_at', { ascending: false })
    ]);
    C = { projects: p.data || [], bids: b.data || [], lineItems: li.data || [], payments: pay.data || [], expenses: exp.data || [] };
    setConn(true, 'Stellar Cost/ROI Calculator — Live ✓');
    populateSelects();
    updateQBadge();
  } catch (e) {
    setConn(false, 'Connection error');
    console.error(e);
  }
}

function populateSelects() {
  const opts = C.projects.map(p => `<option value="${p.id}">${p.name} — ${[p.address, p.city].filter(Boolean).join(', ')}</option>`).join('');
  ['e-proj'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">— select —</option>' + opts;
    if (cur) el.value = cur;
  });
}

function updateQBadge() {
  const n = C.bids.filter(b => b.status === 'pending' || b.status === 'revision').length;
  const el = document.getElementById('qbadge');
  if (el) { el.textContent = n; el.style.display = n > 0 ? 'inline' : 'none'; }
}

function showTab(t) {
  document.querySelectorAll('.tab').forEach((el, i) => {
    ['dashboard', 'queue', 'bids', 'payments', 'expenses', 'projects'].forEach((tab, j) => {
      if (j === i) el.classList.toggle('active', tab === t);
    });
  });
  document.querySelectorAll('.panel').forEach(el => el.classList.remove('active'));
  const panel = document.getElementById('tab-' + t);
  if (panel) panel.classList.add('active');
  if (t === 'dashboard') renderDash();
  if (t === 'queue') renderQueue();
  if (t === 'bids') renderBids();
  if (t === 'payments') renderPayments();
  if (t === 'expenses') renderExpenses();
  if (t === 'projects') renderProjects();
}

function renderDash() {
  const bids = C.bids;
  const pending = bids.filter(b => b.status === 'pending' || b.status === 'revision');
  const approved = bids.filter(b => b.status === 'approved');
  const approvedVal = approved.reduce((s, b) => s + (b.grand_total || 0), 0);
  const paidVal = C.payments.reduce((s, p) => s + (p.amount || 0), 0);
  const pendingVal = pending.reduce((s, b) => s + (b.grand_total || 0), 0);
  const unpaid = approvedVal - paidVal;

  document.getElementById('dash-metrics').innerHTML = [
    { l: 'Projects', v: C.projects.length, c: '' },
    { l: 'Pending bids', v: pending.length, c: 'a' },
    { l: 'Approved bids', v: approved.length, c: 'g' },
    { l: 'Approved value', v: fmt(approvedVal), c: 'g' },
    { l: 'Total paid', v: fmt(paidVal), c: 'g' },
    { l: 'Outstanding', v: fmt(unpaid), c: unpaid > 0 ? 'r' : 'g' },
    { l: 'Pending value', v: fmt(pendingVal), c: 'a' }
  ].map(m => `<div class="metric"><div class="mlabel">${m.l}</div><div class="mval ${m.c}">${m.v}</div></div>`).join('');

  const banner = document.getElementById('dash-banner');
  if (pending.length) {
    banner.innerHTML = `<div style="background:var(--abg);border:1px solid var(--adim);border-radius:9px;padding:11px 15px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span style="font-size:13px;color:var(--amber);font-weight:600">${pending.length} bid${pending.length > 1 ? 's' : ''} awaiting review — ${fmt(pendingVal)} not in estimates</span>
      <button class="btn sm amber" onclick="showTab('queue')">Review queue</button>
    </div>`;
  } else banner.innerHTML = '';

  if (sChart) sChart.destroy();
  const sc = document.getElementById('statusChart');
  const statC = { pending: 0, approved: 0, revision: 0, rejected: 0 };
  bids.forEach(b => statC[b.status] = (statC[b.status] || 0) + 1);
  const nonz = Object.entries(statC).filter(([, v]) => v > 0);
  const cols = { pending: '#f5a623', approved: '#00c805', revision: '#4a9eff', rejected: '#ff5000' };
  if (nonz.length) {
    sChart = new Chart(sc, { type: 'doughnut', data: { labels: nonz.map(([k]) => k), datasets: [{ data: nonz.map(([, v]) => v), backgroundColor: nonz.map(([k]) => cols[k]), borderColor: '#141414', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8a8a8a', font: { size: 10 }, boxWidth: 9, padding: 7 } } } } });
  } else sc.parentElement.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:30px;text-align:center">No bids yet</div>';

  if (pChart) pChart.destroy();
  const pc = document.getElementById('projChart');
  const projMap = {};
  approved.forEach(b => { const p = C.projects.find(x => x.id === b.project_id); const n = p ? p.name : 'Unknown'; projMap[n] = (projMap[n] || 0) + (b.grand_total || 0); });
  const pNames = Object.keys(projMap);
  if (pNames.length) {
    pChart = new Chart(pc, { type: 'bar', data: { labels: pNames, datasets: [{ data: pNames.map(n => projMap[n]), backgroundColor: '#00c80533', borderColor: '#00c805', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8a8a8a', font: { size: 10 } }, grid: { color: '#1e1e1e' } }, y: { ticks: { color: '#8a8a8a', font: { size: 10 }, callback: v => '$' + v.toLocaleString() }, grid: { color: '#1e1e1e' } } } } });
  } else pc.parentElement.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:30px;text-align:center">No approved bids yet</div>';
}

function getBidLines(id) { return C.lineItems.filter(l => l.bid_id === id); }
function getBidPayments(id) { return C.payments.filter(p => p.bid_id === id); }

function renderBidDetail(b) {
  const lines = getBidLines(b.id);
  const labor = lines.filter(l => l.type === 'labor');
  const mats = lines.filter(l => l.type === 'material');
  const proj = C.projects.find(x => x.id === b.project_id);
  return `<div style="margin-bottom:10px">
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--muted)">
      <span>Project: <strong style="color:var(--text)">${proj ? proj.name : '—'}</strong></span>
      <span>Contact: <strong style="color:var(--text)">${b.contact_name || '—'}</strong></span>
      <span>Date: <strong style="color:var(--text)">${b.submitted_at ? b.submitted_at.slice(0, 10) : '—'}</strong></span>
      ${b.files && b.files.length ? `<span>Files: <strong style="color:var(--text)">${b.files.join(', ')}</strong></span>` : ''}
    </div>
    ${b.scope ? `<div style="font-size:12px;color:var(--muted);padding:8px 11px;background:var(--surface2);border-radius:7px;margin-bottom:10px">${b.scope}</div>` : ''}
    ${b.revision_note ? `<div style="font-size:11px;color:var(--blue);padding:6px 10px;background:var(--bbg);border-radius:7px;margin-bottom:10px">Revision note: "${b.revision_note}"</div>` : ''}
    ${labor.length ? `<table class="litbl"><tr><th>Labor</th><th class="r">Amount</th></tr>${labor.map(l => `<tr><td>${l.description || '—'}</td><td class="r">${fmt(l.amount)}</td></tr>`).join('')}<tr><td style="color:var(--muted)">Labor subtotal</td><td class="r" style="color:var(--green)">${fmt(b.labor_total)}</td></tr></table>` : ''}
    ${mats.length ? `<table class="litbl"><tr><th>Materials</th><th class="r">Amount</th></tr>${mats.map(m => `<tr><td>${m.description || '—'}</td><td class="r">${fmt(m.amount)}</td></tr>`).join('')}<tr><td style="color:var(--muted)">Materials subtotal</td><td class="r" style="color:var(--green)">${fmt(b.material_total)}</td></tr></table>` : ''}
    ${b.notes ? `<div style="font-size:11px;color:var(--muted);margin-top:6px">Notes: ${b.notes}</div>` : ''}
  </div>`;
}

function toggleBody(id) { const el = document.getElementById(id); if (el) el.classList.toggle('open'); }

function renderQueue() {
  const pending = C.bids.filter(b => b.status === 'pending' || b.status === 'revision');
  const list = document.getElementById('queue-list');
  if (!pending.length) { list.innerHTML = `<div class="card" style="text-align:center;padding:32px"><div style="font-size:22px;color:var(--green);margin-bottom:6px">✓</div><div style="font-size:14px;font-weight:600;color:var(--green)">Queue is clear</div><div style="font-size:12px;color:var(--muted);margin-top:3px">No bids waiting for review</div></div>`; return; }
  list.innerHTML = pending.map(b => `<div class="bid-card">
    <div class="bid-hdr" onclick="toggleBody('q-${b.id}')">
      <div style="flex:1"><div style="font-size:14px;font-weight:600">${b.job_title}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${b.company}</div></div>
      <div style="font-size:18px;font-weight:600;color:var(--amber);margin-right:8px">${fmt(b.grand_total)}</div>
      <span class="bstatus ${b.status === 'revision' ? 'sv' : 'sp'}">${b.status === 'revision' ? 'Revision' : 'Pending'}</span>
    </div>
    <div class="bid-body" id="q-${b.id}">
      ${renderBidDetail(b)}
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border);align-items:center">
        <button class="btn sm primary" onclick="acceptBid('${b.id}')">Accept — push to estimates</button>
        <button class="btn sm red" onclick="rejectBid('${b.id}')">Reject</button>
        <button class="btn sm blue" onclick="revisionBid('${b.id}')">Request revision</button>
        <span id="act-fb-${b.id}" style="display:none" class="fb"></span>
      </div>
    </div>
  </div>`).join('');
}

function renderBids() {
  const list = document.getElementById('bids-list');
  if (!C.bids.length) { list.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:16px 0">No bids yet.</div>`; return; }
  list.innerHTML = C.bids.map(b => {
    const pays = getBidPayments(b.id);
    const paid = pays.reduce((s, p) => s + (p.amount || 0), 0);
    const pct = b.grand_total > 0 ? Math.min(100, Math.round((paid / b.grand_total) * 100)) : 0;
    const sc = { pending: 'sp', approved: 'sa', rejected: 'sr', revision: 'sv' }[b.status] || 'sp';
    return `<div class="bid-card">
      <div class="bid-hdr" onclick="toggleBody('b-${b.id}')">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${b.job_title}</div>
          <div style="font-size:11px;color:var(--muted)">${b.company} · ${b.submitted_at ? b.submitted_at.slice(0, 10) : '—'}</div>
          ${b.status === 'approved' ? `<div class="prog"><div class="prog-fill" style="width:${pct}%"></div></div><div style="font-size:10px;color:var(--muted)">${fmt(paid)} paid · ${fmt(b.grand_total - paid)} remaining</div>` : ''}
        </div>
        <div style="text-align:right"><div style="font-size:17px;font-weight:600;color:${b.status === 'approved' ? 'var(--green)' : 'var(--amber)'}">${fmt(b.grand_total)}</div><span class="bstatus ${sc}">${b.status}</span></div>
      </div>
      <div class="bid-body" id="b-${b.id}">
        ${renderBidDetail(b)}
        ${b.status === 'approved' ? renderPaySection(b) : ''}
      </div>
    </div>`;
  }).join('');
}

function renderPaySection(b) {
  const pays = getBidPayments(b.id);
  const paid = pays.reduce((s, p) => s + (p.amount || 0), 0);
  return `<div style="padding-top:12px;border-top:1px solid var(--border)">
    <div class="stitle" style="margin-bottom:8px">Payments</div>
    ${pays.map(p => `<div class="pay-row"><span style="flex:1">${p.note || 'Payment'}</span><span style="color:var(--green)">${fmt(p.amount)}</span><span style="color:var(--muted)">${p.paid_by || '—'}</span><span style="color:var(--muted)">${p.paid_at || '—'}</span><button class="btn sm red" onclick="removePayment('${p.id}','${b.id}','b')">Remove</button></div>`).join('')}
    <div style="font-size:12px;font-weight:600;color:var(--green);padding:6px 0 10px">${fmt(paid)} / ${fmt(b.grand_total)} paid</div>
    <div style="display:grid;grid-template-columns:1fr 130px 130px 80px;gap:8px;align-items:end">
      <div class="fg"><label class="flabel">Note</label><input type="text" id="pn-b-${b.id}" placeholder="e.g. 50% upfront"></div>
      <div class="fg"><label class="flabel">Amount</label><div class="amt-wrap"><span class="sym">$</span><input type="number" id="pa-b-${b.id}"></div></div>
      <div class="fg"><label class="flabel">Paid by</label><input type="text" id="pb-b-${b.id}" placeholder="e.g. Robbie"></div>
      <button class="btn primary sm" style="margin-top:auto" onclick="addPayment('${b.id}','b')">Log</button>
    </div>
    <span id="pay-fb-${b.id}" style="display:none;margin-top:6px" class="fb"></span>
  </div>`;
}

function renderPayments() {
  const approved = C.bids.filter(b => b.status === 'approved');
  const list = document.getElementById('payments-list');
  if (!approved.length) { list.innerHTML = `<div style="font-size:13px;color:var(--muted)">No approved bids yet.</div>`; return; }
  list.innerHTML = approved.map(b => {
    const pays = getBidPayments(b.id);
    const paid = pays.reduce((s, p) => s + (p.amount || 0), 0);
    const rem = b.grand_total - paid;
    const pct = b.grand_total > 0 ? Math.min(100, Math.round((paid / b.grand_total) * 100)) : 0;
    const proj = C.projects.find(x => x.id === b.project_id);
    return `<div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div><div style="font-size:14px;font-weight:600">${b.job_title}</div><div style="font-size:11px;color:var(--muted)">${b.company} · ${proj ? proj.name : '—'}</div></div>
        <div style="text-align:right"><div style="font-size:15px;font-weight:600;color:${rem > 0 ? 'var(--amber)' : 'var(--green)'}">${fmt(rem)} remaining</div><div style="font-size:11px;color:var(--muted)">${fmt(paid)} of ${fmt(b.grand_total)} (${pct}%)</div></div>
      </div>
      <div class="prog" style="margin-bottom:10px"><div class="prog-fill" style="width:${pct}%;background:${pct >= 100 ? 'var(--green)' : 'var(--amber)'}"></div></div>
      ${pays.map(p => `<div class="pay-row"><span style="flex:1">${p.note || 'Payment'}</span><span style="color:var(--green)">${fmt(p.amount)}</span><span style="color:var(--muted)">${p.paid_by || '—'}</span><span style="color:var(--muted)">${p.paid_at || '—'}</span><button class="btn sm red" onclick="removePayment('${p.id}','${b.id}','p')">Remove</button></div>`).join('')}
      <div style="display:grid;grid-template-columns:1fr 130px 130px 80px;gap:8px;margin-top:12px;align-items:end">
        <div class="fg"><label class="flabel">Note</label><input type="text" id="pn-p-${b.id}" placeholder="e.g. Final payment"></div>
        <div class="fg"><label class="flabel">Amount</label><div class="amt-wrap"><span class="sym">$</span><input type="number" id="pa-p-${b.id}"></div></div>
        <div class="fg"><label class="flabel">Paid by</label><input type="text" id="pb-p-${b.id}" placeholder="e.g. Aasif"></div>
        <button class="btn primary sm" style="margin-top:auto" onclick="addPayment('${b.id}','p')">Log</button>
      </div>
      <span id="ppay-fb-${b.id}" style="display:none;margin-top:6px" class="fb"></span>
    </div>`;
  }).join('');
}

function renderExpenses() {
  const list = document.getElementById('exp-list');
  if (!C.expenses.length) { list.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:12px 0">No expenses yet.</div>`; return; }
  list.innerHTML = C.expenses.map(e => `<div class="exp-row">
    <span>${e.description}</span>
    <span style="color:var(--muted);font-size:11px">${e.category || '—'}</span>
    <span style="color:var(--green)">${fmt(e.amount)}</span>
    <span>${e.paid_by || '—'}</span>
    <span style="color:${e.reimbursed ? 'var(--green)' : 'var(--red)'}">${e.reimbursed ? 'Yes' : 'No'}</span>
    <span><span style="font-size:10px;padding:2px 7px;border-radius:7px;background:${e.status === 'approved' ? 'var(--gdim)' : 'var(--adim)'};color:${e.status === 'approved' ? 'var(--green)' : 'var(--amber)'}">${e.status}</span></span>
  </div>`).join('');
}

function renderProjects() {
  populateSelects();
  const list = document.getElementById('proj-list');
  if (!C.projects.length) { list.innerHTML = `<div style="font-size:12px;color:var(--muted)">No projects yet. Add one above.</div>`; return; }
  list.innerHTML = C.projects.map(p => `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
    <div style="flex:1">
      <div style="font-weight:600">${p.name}</div>
      <div style="font-size:11px;color:var(--muted)">${[p.address, p.city].filter(Boolean).join(', ')}</div>
      ${p.partners ? `<div style="font-size:11px;color:var(--muted)">Partners: ${p.partners}</div>` : ''}
    </div>
    <div style="font-size:11px;color:var(--muted)">${C.bids.filter(b => b.project_id === p.id).length} bids</div>
    <button class="btn sm red" onclick="removeProject('${p.id}')">Remove</button>
  </div>`).join('');
}

async function addProject() {
  const btn = document.getElementById('pj-btn');
  const name = document.getElementById('pj-name').value.trim();
  if (!name) { showFb('pj-fb', 'error', 'Project name required'); return; }
  btn.disabled = true; btn.textContent = 'Saving...';
  showFb('pj-fb', 'saving', 'Saving...', 0);
  const street = document.getElementById('pj-addr').value.trim();
  const unit = document.getElementById('pj-unit') ? document.getElementById('pj-unit').value.trim() : '';
  const city = document.getElementById('pj-city').value.trim();
  const state = document.getElementById('pj-state') ? document.getElementById('pj-state').value.trim() : '';
  const zip = document.getElementById('pj-zip') ? document.getElementById('pj-zip').value.trim() : '';
  const fullAddr = [street, unit].filter(Boolean).join(', ');
  const fullCity = [city, state, zip].filter(Boolean).join(', ');
  const { data, error } = await db.from('projects').insert({ name, address: fullAddr, city: fullCity, partners: document.getElementById('pj-partners').value.trim() }).select();
  if (error) { showFb('pj-fb', 'error', 'Error: ' + error.message); btn.disabled = false; btn.textContent = 'Save to Supabase'; return; }
  C.projects.unshift(data[0]);
  ['pj-name', 'pj-addr', 'pj-unit', 'pj-city', 'pj-state', 'pj-zip', 'pj-partners'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  showFb('pj-fb', 'saved', '✓ Saved to Supabase!');
  btn.disabled = false; btn.textContent = 'Save to Supabase';
  renderProjects();
}

async function removeProject(id) {
  if (!confirm('Remove this project?')) return;
  await db.from('projects').delete().eq('id', id);
  C.projects = C.projects.filter(p => p.id !== id);
  renderProjects();
}

async function addExpense() {
  const btn = document.getElementById('e-btn');
  const pid = document.getElementById('e-proj').value;
  const desc = document.getElementById('e-desc').value.trim();
  const amt = parseFloat(document.getElementById('e-amt').value) || 0;
  if (!pid || !desc || !amt) { showFb('e-fb', 'error', 'Project, description & amount required'); return; }
  btn.disabled = true; btn.textContent = 'Saving...';
  showFb('e-fb', 'saving', 'Saving...', 0);
  const { data, error } = await db.from('expenses').insert({ project_id: pid, description: desc, amount: amt, category: document.getElementById('e-cat').value, paid_by: document.getElementById('e-paidby').value, reimbursed: document.getElementById('e-reimb').value === 'true', status: 'approved' }).select();
  if (error) { showFb('e-fb', 'error', 'Error: ' + error.message); btn.disabled = false; btn.textContent = 'Add expense'; return; }
  C.expenses.unshift(data[0]);
  document.getElementById('e-desc').value = ''; document.getElementById('e-amt').value = '';
  showFb('e-fb', 'saved', '✓ Saved!');
  btn.disabled = false; btn.textContent = 'Add expense';
  renderExpenses();
}

async function acceptBid(id) {
  showFb('act-fb-' + id, 'saving', 'Accepting...', 0);
  const { error } = await db.from('bids').update({ status: 'approved' }).eq('id', id);
  if (error) { showFb('act-fb-' + id, 'error', 'Error: ' + error.message); return; }
  const b = C.bids.find(x => x.id === id); if (b) b.status = 'approved';
  updateQBadge(); renderQueue(); renderDash();
}

async function rejectBid(id) {
  if (!confirm('Reject this bid?')) return;
  await db.from('bids').update({ status: 'rejected' }).eq('id', id);
  const b = C.bids.find(x => x.id === id); if (b) b.status = 'rejected';
  updateQBadge(); renderQueue(); renderDash();
}

async function revisionBid(id) {
  const note = prompt('What needs to be revised?');
  if (!note) return;
  await db.from('bids').update({ status: 'revision', revision_note: note }).eq('id', id);
  const b = C.bids.find(x => x.id === id); if (b) { b.status = 'revision'; b.revision_note = note; }
  updateQBadge(); renderQueue(); renderDash();
}

async function addPayment(bidId, prefix) {
  const note = document.getElementById(`pn-${prefix}-${bidId}`)?.value || '';
  const amt = parseFloat(document.getElementById(`pa-${prefix}-${bidId}`)?.value) || 0;
  const paidBy = document.getElementById(`pb-${prefix}-${bidId}`)?.value || '';
  const fbId = (prefix === 'p' ? 'ppay' : 'pay') + '-fb-' + bidId;
  if (!amt) { showFb(fbId, 'error', 'Enter an amount'); return; }
  showFb(fbId, 'saving', 'Saving...', 0);
  const { data, error } = await db.from('payments').insert({ bid_id: bidId, note, amount: amt, paid_by: paidBy, paid_at: new Date().toISOString().slice(0, 10) }).select();
  if (error) { showFb(fbId, 'error', 'Error: ' + error.message); return; }
  C.payments.unshift(data[0]);
  const amtEl = document.getElementById(`pa-${prefix}-${bidId}`); if (amtEl) amtEl.value = '';
  showFb(fbId, 'saved', '✓ Logged!');
  renderBids(); renderPayments(); renderDash();
}

async function removePayment(payId, bidId, prefix) {
  await db.from('payments').delete().eq('id', payId);
  C.payments = C.payments.filter(p => p.id !== payId);
  renderBids(); renderPayments(); renderDash();
}

function exportXLS() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Name', 'Address', 'City', 'Partners'], ...C.projects.map(p => [p.name, p.address, p.city, p.partners])]), 'Projects');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Company', 'Job', 'Project', 'Labor', 'Materials', 'Total', 'Status', 'Date'], ...C.bids.map(b => { const p = C.projects.find(x => x.id === b.project_id); return [b.company, b.job_title, p ? p.name : '—', b.labor_total, b.material_total, b.grand_total, b.status, b.submitted_at?.slice(0, 10)]; })]), 'All Bids');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Bid', 'Type', 'Description', 'Amount'], ...C.lineItems.map(l => { const b = C.bids.find(x => x.id === l.bid_id); return [b ? b.job_title : '—', l.type, l.description, l.amount]; })]), 'Line Items');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Bid', 'Company', 'Note', 'Amount', 'Paid By', 'Date'], ...C.payments.map(p => { const b = C.bids.find(x => x.id === p.bid_id); return [b ? b.job_title : '—', b ? b.company : '—', p.note, p.amount, p.paid_by, p.paid_at]; })]), 'Payments');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Description', 'Category', 'Amount', 'Paid By', 'Reimbursed', 'Status'], ...C.expenses.map(e => [e.description, e.category, e.amount, e.paid_by, e.reimbursed ? 'Yes' : 'No', e.status])]), 'Expenses');
  XLSX.writeFile(wb, 'stellar-roi.xlsx');
}

load().then(() => renderDash());
