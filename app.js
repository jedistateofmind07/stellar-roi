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
    C = { projects: p.data || [], bids: b.data || [], lineItems: li.data || [], payments: pay.data || [], expenses: exp.data || [], reimbExpenses: [] };
    await loadReimbExpenses();
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
  const en = (C.reimbExpenses || []).filter(e => e.status === 'pending').length;
  const eel = document.getElementById('eqbadge');
  if (eel) { eel.textContent = en; eel.style.display = en > 0 ? 'inline' : 'none'; }
}

function showTab(t) {
  document.querySelectorAll('.tab').forEach((el, i) => {
    ['dashboard', 'queue', 'bids', 'payments', 'expenses', 'expense-queue', 'reimbursements', 'people', 'projects'].forEach((tab, j) => {
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
  if (t === 'expense-queue') renderExpenseQueue();
  if (t === 'reimbursements') renderReimbExpenseList();
  if (t === 'projects') renderProjects();
  if (t === 'people') renderPeople();
}

function renderDash() {
  const bids = C.bids;
  const pending = bids.filter(b => b.status === 'pending' || b.status === 'revision');
  const approved = bids.filter(b => b.status === 'approved');
  const approvedVal = approved.reduce((s, b) => s + (b.grand_total || 0), 0);
  const paidVal = C.payments.reduce((s, p) => s + (p.amount || 0), 0);
  const pendingVal = pending.reduce((s, b) => s + (b.grand_total || 0), 0);
  const unpaid = approvedVal - paidVal;

  const reimbExp = C.reimbExpenses || [];
  const pendingExp = reimbExp.filter(e => e.status === 'pending');
  const approvedExp = reimbExp.filter(e => e.status === 'approved');
  const pendingExpVal = pendingExp.reduce((s,e) => s + (e.total_amount||0), 0);
  const approvedExpVal = approvedExp.reduce((s,e) => s + (e.total_amount||0), 0);
  const unreimbursed = approvedExp.filter(e => !e.reimbursed).reduce((s,e) => s + (e.total_amount||0), 0);

  document.getElementById('dash-metrics').innerHTML = [
    { l: t('metric.projects'), v: C.projects.length, c: '' },
    { l: t('metric.pending_bids'), v: pending.length, c: 'a' },
    { l: t('metric.approved_bids'), v: approved.length, c: 'g' },
    { l: t('metric.approved_value'), v: fmt(approvedVal), c: 'g' },
    { l: t('metric.pending_expenses'), v: pendingExp.length, c: pendingExp.length > 0 ? 'a' : '' },
    { l: t('metric.expense_actuals'), v: fmt(approvedExpVal), c: 'g' },
    { l: t('metric.unreimbursed'), v: fmt(unreimbursed), c: unreimbursed > 0 ? 'r' : 'g' }
  ].map(m => `<div class="metric"><div class="mlabel">${m.l}</div><div class="mval ${m.c}">${m.v}</div></div>`).join('');

  const banner = document.getElementById('dash-banner');
  const bannerParts = [];
  if (pending.length) bannerParts.push(`<div style="background:var(--abg);border:1px solid var(--adim);border-radius:9px;padding:11px 15px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px"><span style="font-size:13px;color:var(--amber);font-weight:600">${pending.length} bid${pending.length>1?'s':''} awaiting review — ${fmt(pendingVal)} not in estimates</span><button class="btn sm amber" onclick="showTab('queue')">Bid queue</button></div>`);
  if (pendingExp.length) bannerParts.push(`<div style="background:var(--adim);border:1px solid var(--amber);border-radius:9px;padding:11px 15px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px"><span style="font-size:13px;color:var(--amber);font-weight:600">${pendingExp.length} expense${pendingExp.length>1?'s':''} awaiting approval — ${fmt(pendingExpVal)} not in actuals</span><button class="btn sm amber" onclick="showTab('expense-queue')">Expense queue</button></div>`);
  banner.innerHTML = bannerParts.join('');

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
  list.innerHTML = C.projects.map(p => {
    const projBids = C.bids.filter(b => b.project_id === p.id);
    const projExps = (C.reimbExpenses||[]).filter(e => e.project_id === p.id && e.status === 'approved');
    const expTotal = projExps.reduce((s,e)=>s+(e.total_amount||0),0);
    const baseUrl = window.location.origin;
    const bidLink = baseUrl+'/bid?project='+p.id;
    const expLink = baseUrl+'/expense?project='+p.id;
    return `<div style="padding:12px 0;border-bottom:1px solid var(--border);font-size:13px">
      <div style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:8px" onclick="openProject('${p.id}')">
        <div style="flex:1">
          <div style="font-weight:600;color:var(--green)">${p.name} <span style="font-size:11px;color:var(--muted)">→ view dashboard</span></div>
          <div style="font-size:11px;color:var(--muted)">${[p.address, p.city].filter(Boolean).join(', ')}</div>
          ${p.partners ? `<div style="font-size:11px;color:var(--muted)">Partners: ${p.partners}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--muted)">${projBids.length} bids &nbsp;·&nbsp; ${fmt(expTotal)} expenses</div>
        </div>
        <button class="btn sm red" onclick="event.stopPropagation();removeProject('${p.id}')">Remove</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:11px;flex:1;min-width:200px;max-width:400px">
          <span style="color:var(--muted);white-space:nowrap">📋 Bid link:</span>
          <span style="color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">/bid?project=${p.id.slice(0,8)}...</span>
          <button onclick="copyProjLink('${bidLink}','bid-copied-${p.id}')" style="background:var(--green);color:#000;border:none;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">Copy</button>
          <span id="bid-copied-${p.id}" style="display:none;font-size:10px;color:var(--green)">✓ Copied!</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:11px;flex:1;min-width:200px;max-width:400px">
          <span style="color:var(--muted);white-space:nowrap">💵 Expense link:</span>
          <span style="color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">/expense?project=${p.id.slice(0,8)}...</span>
          <button onclick="copyProjLink('${expLink}','exp-copied-${p.id}')" style="background:var(--amber);color:#000;border:none;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">Copy</button>
          <span id="exp-copied-${p.id}" style="display:none;font-size:10px;color:var(--green)">✓ Copied!</span>
        </div>
      </div>
    </div>`;
  }).join('');
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


function renderPeople() {
  const el = document.getElementById('people-list');
  if (!el) return;

  // Collect all people from bids + expenses
  const people = {};

  // From bids
  C.bids.forEach(b => {
    const name = b.company || 'Unknown';
    if (!people[name]) people[name] = { bids: [], expenses: [], payments: [] };
    people[name].bids.push(b);
    const pays = C.payments.filter(p => p.bid_id === b.id);
    people[name].payments.push(...pays);
  });

  // From expenses
  (C.reimbExpenses || []).forEach(e => {
    const name = e.paid_by || 'Unknown';
    if (!people[name]) people[name] = { bids: [], expenses: [], payments: [] };
    people[name].expenses.push(e);
  });

  if (!Object.keys(people).length) {
    el.innerHTML = `<div style="font-size:13px;color:var(--muted)">No people or subcontractors yet.</div>`;
    return;
  }

  el.innerHTML = Object.entries(people).map(([name, data]) => {
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const approvedBids = data.bids.filter(b => b.status === 'approved');
    const bidValue = approvedBids.reduce((s, b) => s + (b.grand_total || 0), 0);
    const bidsPaid = data.payments.reduce((s, p) => s + (p.amount || 0), 0);
    const bidsOwed = bidValue - bidsPaid;
    const approvedExps = data.expenses.filter(e => e.status === 'approved');
    const expTotal = approvedExps.reduce((s, e) => s + (e.total_amount || 0), 0);
    const expOwed = approvedExps.filter(e => !e.reimbursed).reduce((s, e) => s + (e.total_amount || 0), 0);
    const totalOwed = bidsOwed + expOwed;

    return `<div class="bid-card" style="margin-bottom:12px">
      <div class="bid-hdr" onclick="toggleBody('person-${name.replace(/[^a-zA-Z0-9]/g,'')}')">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--gdim);color:var(--green);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0">${initials}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600">${name}</div>
          <div style="font-size:11px;color:var(--muted)">${data.bids.length} bid${data.bids.length!==1?'s':''} &nbsp;·&nbsp; ${data.expenses.length} expense${data.expenses.length!==1?'s':''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--muted)">Total outstanding</div>
          <div style="font-size:16px;font-weight:600;color:${totalOwed>0?'var(--red)':'var(--green)'}">${fmt(totalOwed)}</div>
        </div>
      </div>
      <div class="bid-body" id="person-${name.replace(/[^a-zA-Z0-9]/g,'')}">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:var(--surface2);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Bids</div>
            <div style="font-size:13px">${data.bids.length} total &nbsp;·&nbsp; ${approvedBids.length} approved</div>
            <div style="font-size:13px;color:var(--green)">${fmt(bidValue)} approved value</div>
            <div style="font-size:13px;color:var(--green)">${fmt(bidsPaid)} paid out</div>
            <div style="font-size:13px;color:${bidsOwed>0?'var(--red)':'var(--green)'}">
              ${fmt(bidsOwed)} outstanding
            </div>
          </div>
          <div style="background:var(--surface2);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Expenses</div>
            <div style="font-size:13px">${data.expenses.length} total &nbsp;·&nbsp; ${approvedExps.length} approved</div>
            <div style="font-size:13px;color:var(--green)">${fmt(expTotal)} total paid</div>
            <div style="font-size:13px;color:${expOwed>0?'var(--red)':'var(--green)'}">
              ${fmt(expOwed)} to reimburse
            </div>
          </div>
        </div>
        ${data.bids.length ? `<div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Bids</div>` +
          data.bids.map(b => {
            const pays = C.payments.filter(p => p.bid_id === b.id);
            const paid = pays.reduce((s,p)=>s+(p.amount||0),0);
            const sc = {pending:'sp',approved:'sa',rejected:'sr',revision:'sv'}[b.status]||'sp';
            const proj = C.projects.find(x=>x.id===b.project_id);
            return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px;flex-wrap:wrap">
              <div style="flex:1"><div style="font-weight:500">${b.job_title}</div><div style="color:var(--muted)">${proj?proj.name:'—'} &nbsp;·&nbsp; ${b.submitted_at?b.submitted_at.slice(0,10):'—'}</div></div>
              <div style="font-weight:600;color:var(--green)">${fmt(b.grand_total)}</div>
              ${b.status==='approved'?`<div style="color:var(--muted)">${fmt(paid)} paid</div>`:''}
              <span class="bstatus ${sc}">${b.status}</span>
            </div>`;
          }).join('') : ''}
        ${data.expenses.length ? `<div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:10px 0 6px">Expenses</div>` +
          data.expenses.map(e => {
            const items = Array.isArray(e.line_items)?e.line_items:[];
            const proj = C.projects.find(x=>x.id===e.project_id);
            const sc = e.status==='approved'?'sa':e.status==='rejected'?'sr':'sp';
            return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px;flex-wrap:wrap">
              <div style="flex:1"><div style="font-weight:500">${items.map(l=>l.desc).filter(Boolean).join(', ')||'Expense'}</div><div style="color:var(--muted)">${proj?proj.name:'—'} &nbsp;·&nbsp; ${e.submitted_at?e.submitted_at.slice(0,10):'—'}</div></div>
              <div style="font-weight:600;color:var(--green)">${fmt(e.total_amount)}</div>
              <span class="bstatus ${sc}">${e.status}</span>
              ${e.status==='approved'?`<span style="color:${e.reimbursed?'var(--green)':'var(--amber)'};">${e.reimbursed?'✓ Reimbursed':'Unpaid'}</span>`:''}
            </div>`;
          }).join('') : ''}
      </div>
    </div>`;
  }).join('');
}

function copyProjLink(url, feedbackId) {
  navigator.clipboard.writeText(url).then(() => {
    const el = document.getElementById(feedbackId);
    if(el){ el.style.display='inline'; setTimeout(()=>el.style.display='none', 2000); }
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = url; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const el = document.getElementById(feedbackId);
    if(el){ el.style.display='inline'; setTimeout(()=>el.style.display='none', 2000); }
  });
}

function openProject(id) {
  window.location.href = '/project?id=' + id;
}

async function removeProject(id) {
  const proj = C.projects.find(p => p.id === id);
  const name = proj ? proj.name : 'this project';
  const confirmed = confirm(
    '\u26A0\uFE0F WARNING: Delete "' + name + '"?\n\n' +
    'This will permanently delete:\n' +
    '\u2022 All bids and bid line items\n' +
    '\u2022 All expense submissions\n' +
    '\u2022 All payments logged\n' +
    '\u2022 The P&L data for this project\n\n' +
    'This CANNOT be undone.\n\nClick OK to confirm.'
  );
  if (!confirmed) return;
  const double = confirm('Final confirmation: permanently delete "' + name + '" and ALL its data?');
  if (!double) return;
  await db.from('project_pl').delete().eq('project_id', id).catch(()=>{});
  await db.from('reimbursement_expenses').delete().eq('project_id', id).catch(()=>{});
  const bidIds = C.bids.filter(b => b.project_id === id).map(b => b.id);
  if (bidIds.length) {
    await db.from('bid_line_items').delete().in('bid_id', bidIds).catch(()=>{});
    await db.from('payments').delete().in('bid_id', bidIds).catch(()=>{});
  }
  await db.from('bids').delete().eq('project_id', id).catch(()=>{});
  await db.from('projects').delete().eq('id', id);
  C.projects = C.projects.filter(p => p.id !== id);
  C.bids = C.bids.filter(b => b.project_id !== id);
  renderProjects();
  renderDash();
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

// ── LANGUAGE CHANGE LISTENER ────────────────────────────────────────────────
window.addEventListener('langchange', () => {
  if(typeof applyTranslations === 'function') applyTranslations();
  // Re-render all dynamic content with new language
  renderDash();
  // Re-render whichever tab is active
  const activePanel = document.querySelector('.panel.active');
  if(activePanel) {
    const id = activePanel.id.replace('tab-','');
    if(id==='queue') renderQueue();
    else if(id==='bids') renderAllBids();
    else if(id==='payments') renderPayments();
    else if(id==='expenses') renderExpenses();
    else if(id==='expense-queue') renderExpenseQueue();
    else if(id==='reimbursements') renderReimbExpenseList();
    else if(id==='people') renderPeople();
    else if(id==='projects') renderProjects();
  }
});

// ── FUNCTION 3: REIMBURSEMENT EXPENSES ──────────────────────────────────────

async function loadReimbExpenses() {
  const { data, error } = await db.from('reimbursement_expenses').select('*').order('submitted_at', { ascending: false });
  if (!error) C.reimbExpenses = data || [];
}

function updateExpQueueBadge() {
  const en = (C.reimbExpenses || []).filter(e => e.status === 'pending').length;
  const eel = document.getElementById('eqbadge');
  if (eel) { eel.textContent = en; eel.style.display = en > 0 ? 'inline' : 'none'; }
}

function renderExpenseQueue() {
  const pending = (C.reimbExpenses || []).filter(e => e.status === 'pending');
  const el = document.getElementById('reimb-queue-list');
  if (!el) return;
  if (!pending.length) {
    el.innerHTML = `<div class="card" style="text-align:center;padding:28px"><div style="font-size:22px;color:var(--green);margin-bottom:6px">✓</div><div style="font-size:14px;font-weight:600;color:var(--green)">Queue is clear</div><div style="font-size:12px;color:var(--muted);margin-top:3px">All expenses reviewed</div></div>`;
    return;
  }
  el.innerHTML = pending.map(e => {
    const proj = C.projects.find(p => p.id === e.project_id);
    const items = Array.isArray(e.line_items) ? e.line_items : [];
    return `<div class="bid-card" id="eq-card-${e.id}">
      <div class="bid-hdr" onclick="toggleBody('re-${e.id}')">
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600">${e.paid_by}</div>
          <div style="font-size:11px;color:var(--muted)">${proj ? proj.name : '—'} &nbsp;·&nbsp; ${e.submitted_at ? e.submitted_at.slice(0,10) : '—'}</div>
          ${e.files && e.files.length ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">📎 ${e.files.join(', ')}</div>` : ''}
        </div>
        <div style="font-size:18px;font-weight:600;color:var(--amber);margin-right:8px">${fmt(e.total_amount)}</div>
        <span class="bstatus sp">Pending</span>
      </div>
      <div class="bid-body open" id="re-${e.id}">
        <table class="litbl" style="margin-bottom:10px">
          <tr><th>Description</th><th class="r">Amount</th></tr>
          ${items.map(l => `<tr><td>${l.desc || '—'}</td><td class="r">${fmt(l.amt)}</td></tr>`).join('')}
          <tr><td style="color:var(--muted)">Total</td><td class="r" style="color:var(--green);font-weight:600">${fmt(e.total_amount)}</td></tr>
        </table>
        ${e.notes ? `<div style="font-size:12px;color:var(--muted);margin-bottom:12px;padding:8px 11px;background:var(--surface2);border-radius:7px">${e.notes}</div>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button class="btn sm primary" id="approve-btn-${e.id}" onclick="approveReimbExpense('${e.id}')">Approve — add to actuals</button>
          <button class="btn sm red" id="reject-btn-${e.id}" onclick="rejectReimbExpense('${e.id}')">Reject</button>
          <span id="re-fb-${e.id}" style="display:none" class="fb"></span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderReimbExpenseList() {
  const all = (C.reimbExpenses || []).filter(e => e.status === 'approved' || e.status === 'rejected');
  const approved = all.filter(e => e.status === 'approved');
  const el = document.getElementById('reimb-approved-list');
  if (!el) return;

  // ── BY PERSON ──
  const byPerson = {};
  approved.forEach(e => {
    if (!byPerson[e.paid_by]) byPerson[e.paid_by] = [];
    byPerson[e.paid_by].push(e);
  });

  const personHTML = Object.keys(byPerson).length ? Object.entries(byPerson).map(([person, exps]) => {
    const total = exps.reduce((s,e) => s+(e.total_amount||0), 0);
    const reimbursedTotal = exps.reduce((s,e) => s+(e.reimbursement_amount||0)+(e.reimbursed&&!e.reimbursement_amount?e.total_amount:0), 0);
    const owed = total - reimbursedTotal;
    const pct = total > 0 ? Math.min(100, Math.round((reimbursedTotal/total)*100)) : 0;
    const initials = person.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const safeId = person.replace(/[^a-zA-Z0-9]/g,'');
    return `<div class="bid-card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;user-select:none" onclick="toggleReimbPerson('${safeId}')">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--gdim);color:var(--green);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0">${initials}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600">${person}</div>
          <div style="font-size:11px;color:var(--muted)">${exps.length} expense${exps.length>1?'s':''} &nbsp;·&nbsp; ${fmt(total)} total</div>
          <div style="height:5px;background:var(--border);border-radius:3px;margin-top:7px;width:200px;max-width:100%">
            <div style="height:100%;border-radius:3px;background:${pct>=100?'var(--green)':'var(--amber)'};width:${pct}%;transition:width .3s"></div>
          </div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px">${fmt(reimbursedTotal)} reimbursed &nbsp;·&nbsp; ${pct}%</div>
        </div>
        <div style="text-align:right;margin-right:8px">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">Outstanding</div>
          <div style="font-size:18px;font-weight:600;color:${owed>0?'var(--red)':'var(--green)'}">${fmt(owed)}</div>
        </div>
        <span style="color:var(--muted);font-size:16px" id="reimb-chevron-${safeId}">▶</span>
      </div>
      <div id="reimb-person-${safeId}" style="display:none;border-top:1px solid var(--border)">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:var(--surface2)">
            <th style="text-align:left;padding:7px 14px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Item</th>
            <th style="text-align:left;padding:7px 8px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Project</th>
            <th style="text-align:left;padding:7px 8px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Date</th>
            <th style="text-align:right;padding:7px 8px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Cost</th>
            <th style="text-align:right;padding:7px 8px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Reimbursed</th>
            <th style="text-align:right;padding:7px 8px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Outstanding</th>
            <th style="padding:7px 8px;width:60px"></th>
          </tr></thead>
          <tbody id="reimb-tbody-${safeId}">
            ${exps.map(e => reimbRowHTML(e, safeId)).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }).join('') : `<div style="font-size:13px;color:var(--muted);margin-bottom:16px">No approved expenses yet.</div>`;

  // ── BY PROJECT ──
  const byProject = {};
  approved.forEach(e => {
    const proj = C.projects.find(p=>p.id===e.project_id);
    const name = proj ? proj.name : 'Unknown';
    if (!byProject[name]) byProject[name] = [];
    byProject[name].push(e);
  });

  const projHTML = Object.keys(byProject).length ? Object.entries(byProject).map(([projName, exps]) => {
    const total = exps.reduce((s,e)=>s+(e.total_amount||0),0);
    const reimbursedTotal = exps.reduce((s,e)=>s+(e.reimbursement_amount||0)+(e.reimbursed&&!e.reimbursement_amount?e.total_amount:0),0);
    const owed = total - reimbursedTotal;
    return `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${projName}</div><div style="font-size:11px;color:var(--muted)">${exps.length} expense${exps.length>1?'s':''}</div></div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:600;color:var(--green)">${fmt(total)} total</div>
        <div style="font-size:11px;color:${owed>0?'var(--red)':'var(--muted)'};">${fmt(owed)} outstanding</div>
      </div>
    </div>`;
  }).join('') : `<div style="font-size:13px;color:var(--muted)">No approved expenses yet.</div>`;

  // ── REJECTED LOG ──
  const rejected = all.filter(e => e.status === 'rejected');
  const rejHTML = rejected.length ? rejected.map(e => {
    const proj = C.projects.find(p=>p.id===e.project_id);
    const items = Array.isArray(e.line_items) ? e.line_items : [];
    return `<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap;opacity:.6">
      <div style="flex:1">
        <div style="font-size:12px;font-weight:500">${items.map(l=>l.desc).filter(Boolean).join(', ')||'Expense'}</div>
        <div style="font-size:11px;color:var(--muted)">${e.paid_by} &nbsp;·&nbsp; ${proj?proj.name:'—'} &nbsp;·&nbsp; ${e.submitted_at?e.submitted_at.slice(0,10):'—'}</div>
      </div>
      <div style="font-size:13px;font-weight:600;color:var(--red)">${fmt(e.total_amount)}</div>
      <span class="bstatus sr">Rejected</span>
    </div>`;
  }).join('') : `<div style="font-size:12px;color:var(--muted)">No rejected expenses.</div>`;

  el.innerHTML = `
    <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;display:flex;align-items:center;gap:7px">By person <span style="flex:1;height:1px;background:var(--border);display:inline-block"></span></div>
    ${personHTML}
    <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin:18px 0 10px;display:flex;align-items:center;gap:7px">By project <span style="flex:1;height:1px;background:var(--border);display:inline-block"></span></div>
    <div class="card">${projHTML}</div>
    <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin:18px 0 10px;display:flex;align-items:center;gap:7px">Rejected log <span style="flex:1;height:1px;background:var(--border);display:inline-block"></span></div>
    <div class="card">${rejHTML}</div>`;
}

function reimbRowHTML(e, safeId) {
  const proj = C.projects.find(p=>p.id===e.project_id);
  const items = Array.isArray(e.line_items)?e.line_items:[];
  const itemName = items.map(l=>l.desc).filter(Boolean).join(', ')||'Expense';
  const reimbAmt = e.reimbursement_amount||(e.reimbursed?e.total_amount:0);
  const outstanding = (e.total_amount||0) - reimbAmt;
  return `<tr id="reimb-row-${e.id}">
    <td style="padding:9px 14px;font-size:13px;font-weight:500">${itemName}</td>
    <td style="padding:9px 8px;font-size:12px;color:var(--muted)">${proj?proj.name:'—'}</td>
    <td style="padding:9px 8px;font-size:12px;color:var(--muted)">${e.submitted_at?e.submitted_at.slice(0,10):'—'}</td>
    <td style="padding:9px 8px;text-align:right;font-weight:600;color:var(--green)">${fmt(e.total_amount)}</td>
    <td style="padding:9px 8px;text-align:right;font-weight:500;color:${reimbAmt>0?'var(--green)':'var(--amber)'}">${fmt(reimbAmt)}</td>
    <td style="padding:9px 8px;text-align:right;font-weight:500;color:${outstanding>0?'var(--red)':'var(--green)'}">${fmt(outstanding)}</td>
    <td style="padding:9px 8px;text-align:right;white-space:nowrap">
      <button onclick="editReimbRow('${e.id}','${safeId}')" style="background:none;border:none;cursor:pointer;padding:3px 5px;border-radius:5px;font-size:14px;opacity:.7" title="Edit">✏️</button>
    </td>
  </tr>`;
}

function editReimbRow(id, safeId) {
  const e = C.reimbExpenses.find(x=>x.id===id);
  if(!e) return;
  const items = Array.isArray(e.line_items)?e.line_items:[];
  const itemName = items.map(l=>l.desc).filter(Boolean).join(', ')||'Expense';
  const reimbAmt = e.reimbursement_amount||(e.reimbursed?e.total_amount:0);
  const tr = document.getElementById('reimb-row-'+id);
  if(!tr) return;
  tr.style.background = '#1a2a1a';
  tr.innerHTML = `
    <td style="padding:8px 14px"><input style="width:120px;padding:5px 8px;background:var(--surface);border:1px solid var(--green);border-radius:6px;color:#fff;font-size:12px;font-family:inherit;outline:none" id="rr-desc-${id}" value="${itemName}"></td>
    <td style="padding:8px 8px;font-size:12px;color:var(--muted)">${C.projects.find(p=>p.id===e.project_id)?.name||'—'}</td>
    <td style="padding:8px 8px;font-size:12px;color:var(--muted)">${e.submitted_at?e.submitted_at.slice(0,10):'—'}</td>
    <td style="padding:8px 8px;text-align:right;font-weight:600;color:var(--green)">${fmt(e.total_amount)}</td>
    <td style="padding:8px 8px;text-align:right">
      <div style="position:relative;display:inline-block">
        <span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:11px">$</span>
        <input type="number" step="0.01" id="rr-reimb-${id}" value="${reimbAmt}" placeholder="0.00" 
          style="width:90px;padding:5px 8px 5px 18px;background:var(--surface);border:1px solid var(--green);border-radius:6px;color:#fff;font-size:12px;font-family:inherit;outline:none;text-align:right">
      </div>
      <div style="font-size:9px;color:var(--muted);margin-top:2px">of ${fmt(e.total_amount)}</div>
    </td>
    <td style="padding:8px 8px;text-align:right;font-size:12px;color:var(--muted)">auto</td>
    <td style="padding:8px 8px;white-space:nowrap;text-align:right">
      <button onclick="saveReimbRow('${id}','${safeId}')" style="background:none;border:none;cursor:pointer;font-size:16px;padding:2px 4px" title="Save">💾</button>
      <button onclick="renderReimbExpenseList()" style="background:none;border:none;cursor:pointer;font-size:14px;padding:2px 4px;color:var(--red)" title="Cancel">✕</button>
    </td>`;
}

async function saveReimbRow(id, safeId) {
  const desc = document.getElementById('rr-desc-'+id)?.value.trim()||'';
  const reimbAmt = parseFloat(document.getElementById('rr-reimb-'+id)?.value)||0;
  const e = C.reimbExpenses.find(x=>x.id===id);
  if(!e) return;
  const reimbursed = reimbAmt > 0;
  const items = Array.isArray(e.line_items)?e.line_items:[];
  const newItems = items.length ? [{...items[0], desc}] : [{desc, amt:e.total_amount}];
  const{error}=await db.from('reimbursement_expenses').update({
    line_items: newItems,
    reimbursement_amount: reimbAmt,
    reimbursed,
    reimbursed_at: reimbursed ? new Date().toISOString() : null
  }).eq('id', id);
  if(error){alert('Error: '+error.message);return;}
  e.line_items = newItems;
  e.reimbursement_amount = reimbAmt;
  e.reimbursed = reimbursed;
  // Re-expand the person section after save
  renderReimbExpenseList();
  setTimeout(()=>{
    const body = document.getElementById('reimb-person-'+safeId);
    const chev = document.getElementById('reimb-chevron-'+safeId);
    if(body){body.style.display='table';if(chev)chev.textContent='▼';}
  }, 50);
}

function toggleReimbPerson(safeId) {
  const body = document.getElementById('reimb-person-'+safeId);
  const chev = document.getElementById('reimb-chevron-'+safeId);
  if(!body) return;
  const open = body.style.display === 'table';
  body.style.display = open ? 'none' : 'table';
  if(chev) chev.textContent = open ? '▶' : '▼';
}


async function approveReimbExpense(id) {
  const approveBtn = document.getElementById('approve-btn-'+id);
  const rejectBtn = document.getElementById('reject-btn-'+id);
  const fb = document.getElementById('re-fb-'+id);
  if (approveBtn) { approveBtn.disabled=true; approveBtn.textContent='Approving...'; }
  if (rejectBtn) rejectBtn.disabled=true;
  if (fb) { fb.className='fb saving'; fb.textContent='Saving...'; fb.style.display='inline-flex'; }

  const { error } = await db.from('reimbursement_expenses').update({ status: 'approved' }).eq('id', id);
  if (error) {
    if (fb) { fb.className='fb error'; fb.textContent='Error: '+error.message; }
    if (approveBtn) { approveBtn.disabled=false; approveBtn.textContent='Approve — add to actuals'; }
    if (rejectBtn) rejectBtn.disabled=false;
    return;
  }
  const e = C.reimbExpenses.find(x => x.id === id);
  if (e) e.status = 'approved';
  updateExpQueueBadge();
  renderExpenseQueue();
  renderReimbExpenseList();
  renderDash();
}

async function rejectReimbExpense(id) {
  if (!confirm('Reject this expense? It will be kept in the log as rejected.')) return;
  const approveBtn = document.getElementById('approve-btn-'+id);
  const rejectBtn = document.getElementById('reject-btn-'+id);
  if (approveBtn) approveBtn.disabled=true;
  if (rejectBtn) { rejectBtn.disabled=true; rejectBtn.textContent='Rejecting...'; }

  const { error } = await db.from('reimbursement_expenses').update({ status: 'rejected' }).eq('id', id);
  if (error) {
    alert('Error: '+error.message);
    if (approveBtn) approveBtn.disabled=false;
    if (rejectBtn) { rejectBtn.disabled=false; rejectBtn.textContent='Reject'; }
    return;
  }
  const e = C.reimbExpenses.find(x => x.id === id);
  if (e) e.status = 'rejected';
  updateExpQueueBadge();
  renderExpenseQueue();
  renderReimbExpenseList();
  renderDash();
}

async function toggleReimbursed(id, val) {
  const { error } = await db.from('reimbursement_expenses').update({
    reimbursed: val,
    reimbursed_at: val ? new Date().toISOString() : null
  }).eq('id', id);
  if (!error) {
    const e = C.reimbExpenses.find(x => x.id === id);
    if (e) { e.reimbursed = val; e.reimbursed_at = val ? new Date().toISOString() : null; }
    renderReimbExpenseList();
    renderDash();
  }
}
