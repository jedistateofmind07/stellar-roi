// ── Stellar Analytics ROI — Rental Module ───────────────────────────────────

let R = { tenants: [], payments: [], maintenance: [], announcements: [] };
let rentalLoaded = false;

// ── INIT ──────────────────────────────────────────────────────────────────────

async function initRental() {
  if (!rentalLoaded) {
    await loadRental();
    rentalLoaded = true;
  }
  const now = new Date();
  const mEl = document.getElementById('rr-month');
  const yEl = document.getElementById('rr-year');
  if (mEl && !mEl.dataset.init) {
    mEl.value = now.getMonth() + 1;
    mEl.dataset.init = '1';
  }
  if (yEl && !yEl.dataset.init) {
    yEl.value = now.getFullYear();
    yEl.dataset.init = '1';
  }
  showRentalTab('tenants');
}

async function loadRental() {
  try {
    const [ten, pay, maint, ann] = await Promise.all([
      db.from('tenants').select('*').order('created_at', { ascending: false }),
      db.from('rental_payments').select('*').order('paid_date', { ascending: false }),
      db.from('maintenance_requests').select('*').order('submitted_at', { ascending: false }),
      db.from('announcements').select('*').order('created_at', { ascending: false })
    ]);
    R.tenants      = ten.data   || [];
    R.payments     = pay.data   || [];
    R.maintenance  = maint.data || [];
    R.announcements = ann.data  || [];
  } catch (e) {
    console.error('Rental load error:', e);
  }
}

function showRentalTab(tab) {
  document.querySelectorAll('.rtab').forEach(el =>
    el.classList.toggle('active', el.dataset.tab === tab)
  );
  document.querySelectorAll('.rpanel').forEach(el => el.classList.remove('active'));
  const panel = document.getElementById('rtab-' + tab);
  if (panel) panel.classList.add('active');
  if (tab === 'tenants')       renderRTenants();
  if (tab === 'rent')          renderRent();
  if (tab === 'maintenance')   renderMaintenance();
  if (tab === 'announcements') renderAnnouncements();
}

// ── TENANTS ───────────────────────────────────────────────────────────────────

function populateRentalProj(selectId) {
  const el = document.getElementById(selectId);
  if (!el) return;
  const cur = el.value;
  el.innerHTML = '<option value="">— select property —</option>' +
    C.projects.map(p =>
      `<option value="${p.id}">${p.name}${p.address ? ' — ' + p.address : ''}</option>`
    ).join('');
  if (cur) el.value = cur;
}

function renderRTenants() {
  populateRentalProj('rt-proj');
  const list = document.getElementById('rt-list');
  if (!list) return;

  if (!R.tenants.length) {
    list.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:12px 0">No tenants yet — add one above.</div>`;
    return;
  }

  // Group by project
  const byProj = {};
  R.tenants.forEach(t => {
    const k = t.project_id || '__none__';
    if (!byProj[k]) byProj[k] = [];
    byProj[k].push(t);
  });

  list.innerHTML = Object.entries(byProj).map(([pid, tenants]) => {
    const proj = C.projects.find(p => p.id === pid);
    return `
      <div class="sdiv">${proj ? proj.name : 'No property assigned'}</div>
      ${tenants.map(renderTenantCard).join('')}
    `;
  }).join('');
}

function renderTenantCard(t) {
  const sc     = { invited: 'sv', active: 'sa', inactive: 'sr' }[t.status] || 'sp';
  const init   = t.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const invUrl = `${window.location.origin}/tenant?email=${encodeURIComponent(t.email)}`;

  return `<div class="bid-card" style="margin-bottom:10px">
    <div class="bid-hdr" onclick="toggleBody('rt-${t.id}')">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--bdim);color:var(--blue);
        display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0">${init}</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600">${t.name}</div>
        <div style="font-size:11px;color:var(--muted)">${t.unit ? 'Unit ' + t.unit + ' · ' : ''}${t.email}</div>
      </div>
      <div style="text-align:right;margin-right:10px">
        <div style="font-size:15px;font-weight:600;color:var(--blue)">$${Number(t.rent_amount).toLocaleString()}/mo</div>
        <div style="font-size:10px;color:var(--muted)">Due day ${t.due_day}</div>
      </div>
      <span class="bstatus ${sc}">${t.status}</span>
    </div>
    <div class="bid-body" id="rt-${t.id}">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;font-size:12px">
        <div><span style="color:var(--muted)">Phone: </span>${t.phone || '—'}</div>
        <div><span style="color:var(--muted)">Lease start: </span>${t.lease_start || '—'}</div>
        <div><span style="color:var(--muted)">Lease end: </span>${t.lease_end || '—'}</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--bdim);border-radius:8px;padding:8px 12px;
        margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px">
        <span style="color:var(--muted);white-space:nowrap">🔗 Tenant portal:</span>
        <span style="color:var(--muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">/tenant?email=${t.email}</span>
        <button onclick="copyTenantInvite('${invUrl}','inv-${t.id}')"
          style="background:var(--blue);color:#000;border:none;border-radius:6px;padding:3px 10px;
          font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">Copy link</button>
        <span id="inv-${t.id}" style="display:none;font-size:10px;color:var(--green)">✓ Copied!</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${t.status === 'invited'   ? `<button class="btn sm primary" onclick="setTenantStatus('${t.id}','active')">Mark active</button>` : ''}
        ${t.status === 'active'    ? `<button class="btn sm" onclick="setTenantStatus('${t.id}','inactive')">Mark inactive</button>` : ''}
        ${t.status === 'inactive'  ? `<button class="btn sm primary" onclick="setTenantStatus('${t.id}','active')">Reactivate</button>` : ''}
        <button class="btn sm red" onclick="removeTenant('${t.id}')">Remove tenant</button>
      </div>
    </div>
  </div>`;
}

async function addTenant() {
  const btn   = document.getElementById('rt-btn');
  const name  = document.getElementById('rt-name').value.trim();
  const email = document.getElementById('rt-email').value.trim();
  const projId = document.getElementById('rt-proj').value;
  const rentAmt = parseFloat(document.getElementById('rt-rent').value) || 0;
  const dueDay  = parseInt(document.getElementById('rt-due').value)   || 1;

  if (!name || !email || !projId || !rentAmt) {
    showFb('rt-fb', 'error', 'Name, email, property & rent are required');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving...';
  showFb('rt-fb', 'saving', 'Saving...', 0);

  const { data, error } = await db.from('tenants').insert({
    project_id:  projId,
    name, email,
    phone:       document.getElementById('rt-phone').value.trim(),
    unit:        document.getElementById('rt-unit').value.trim(),
    rent_amount: rentAmt,
    due_day:     dueDay,
    lease_start: document.getElementById('rt-ls').value || null,
    lease_end:   document.getElementById('rt-le').value || null,
    status:      'invited'
  }).select();

  if (error) {
    showFb('rt-fb', 'error', 'Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Add tenant';
    return;
  }

  R.tenants.unshift(data[0]);
  ['rt-name','rt-email','rt-phone','rt-unit','rt-rent','rt-ls','rt-le'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('rt-due').value = '1';
  document.getElementById('rt-proj').value = '';
  showFb('rt-fb', 'saved', '✓ Tenant added!');
  btn.disabled = false;
  btn.textContent = 'Add tenant';
  renderRTenants();
}

async function setTenantStatus(id, status) {
  await db.from('tenants').update({ status }).eq('id', id);
  const t = R.tenants.find(x => x.id === id);
  if (t) t.status = status;
  renderRTenants();
}

async function removeTenant(id) {
  if (!confirm('Remove this tenant and all their payment + maintenance history?')) return;
  await db.from('rental_payments').delete().eq('tenant_id', id);
  await db.from('maintenance_requests').delete().eq('tenant_id', id);
  await db.from('tenants').delete().eq('id', id);
  R.tenants     = R.tenants.filter(t => t.id !== id);
  R.payments    = R.payments.filter(p => p.tenant_id !== id);
  R.maintenance = R.maintenance.filter(m => m.tenant_id !== id);
  renderRTenants();
}

function copyTenantInvite(url, fbId) {
  navigator.clipboard.writeText(url).then(() => {
    const el = document.getElementById(fbId);
    if (el) { el.style.display = 'inline'; setTimeout(() => el.style.display = 'none', 2500); }
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const el = document.getElementById(fbId);
    if (el) { el.style.display = 'inline'; setTimeout(() => el.style.display = 'none', 2500); }
  });
}

// ── RENT ──────────────────────────────────────────────────────────────────────

function renderRent() {
  const now  = new Date();
  const mEl  = document.getElementById('rr-month');
  const yEl  = document.getElementById('rr-year');
  if (!mEl || !yEl) return;

  const month = parseInt(mEl.value) || (now.getMonth() + 1);
  const year  = parseInt(yEl.value) || now.getFullYear();
  const list  = document.getElementById('rr-list');
  if (!list) return;

  const activeTenants = R.tenants.filter(t => t.status !== 'inactive');

  if (!activeTenants.length) {
    list.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:12px 0">
      No active tenants yet — add tenants in the Tenants tab first.</div>`;
    document.getElementById('rr-summary').innerHTML = '';
    return;
  }

  const today = now.getDate();
  const isPast    = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  const rows = activeTenants.map(t => {
    const proj  = C.projects.find(p => p.id === t.project_id);
    const paid  = R.payments.find(p =>
      p.tenant_id === t.id && p.period_month === month && p.period_year === year
    );
    const overdue = !paid && (isPast || (isCurrent && today > t.due_day));
    const label = paid ? 'Paid' : overdue ? 'Overdue' : 'Upcoming';
    const col   = paid ? 'var(--green)' : overdue ? 'var(--red)' : 'var(--amber)';
    const bg    = paid ? 'var(--gdim)'  : overdue ? 'var(--rdim)' : 'var(--adim)';

    return `<div style="display:grid;grid-template-columns:1.6fr 1fr 70px 90px 120px 80px;
      gap:8px;padding:10px 0;font-size:12px;align-items:center;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:600">${t.name}</div>
        ${t.unit ? `<div style="font-size:10px;color:var(--muted)">Unit ${t.unit}</div>` : ''}
      </div>
      <div style="color:var(--muted);font-size:11px;overflow:hidden;text-overflow:ellipsis">
        ${proj ? proj.name : '—'}
      </div>
      <div style="color:var(--muted)">Day ${t.due_day}</div>
      <div style="font-weight:600;color:var(--blue)">$${Number(t.rent_amount).toLocaleString()}</div>
      <div>
        <span style="font-size:10px;padding:3px 9px;border-radius:8px;font-weight:600;background:${bg};color:${col}">
          ${label}
        </span>
        ${paid ? `<div style="font-size:10px;color:var(--muted);margin-top:3px">${paid.method} · ${paid.paid_date}</div>` : ''}
      </div>
      <div>
        ${!paid
          ? `<button class="btn sm blue" onclick="openLogPayment('${t.id}','${t.name.replace(/'/g, "\\'")}',${t.rent_amount},${month},${year})">Log</button>`
          : `<button class="btn sm red" onclick="removeRentPayment('${paid.id}')">Undo</button>`
        }
      </div>
    </div>`;
  }).join('');

  // Summary metrics
  const totalExp   = activeTenants.reduce((s, t) => s + (t.rent_amount || 0), 0);
  const paidRows   = activeTenants.filter(t =>
    R.payments.find(p => p.tenant_id === t.id && p.period_month === month && p.period_year === year)
  );
  const totalColl  = paidRows.reduce((s, t) => {
    const p = R.payments.find(x => x.tenant_id === t.id && x.period_month === month && x.period_year === year);
    return s + (p?.amount || 0);
  }, 0);
  const outstanding = totalExp - totalColl;

  document.getElementById('rr-summary').innerHTML = [
    { l: 'Expected',   v: '$' + Number(totalExp).toLocaleString(),    c: 'b' },
    { l: 'Collected',  v: '$' + Number(totalColl).toLocaleString(),   c: 'g' },
    { l: 'Outstanding',v: '$' + Number(outstanding).toLocaleString(), c: outstanding > 0 ? 'r' : 'g' },
    { l: 'Tenants paid',v: paidRows.length + ' / ' + activeTenants.length,
      c: paidRows.length === activeTenants.length ? 'g' : 'a' }
  ].map(m =>
    `<div class="metric"><div class="mlabel">${m.l}</div><div class="mval ${m.c}">${m.v}</div></div>`
  ).join('');

  list.innerHTML = `
    <div style="display:grid;grid-template-columns:1.6fr 1fr 70px 90px 120px 80px;gap:8px;padding:7px 0;
      font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--border2)">
      <span>Tenant</span><span>Property</span><span>Due</span><span>Rent</span><span>Status</span><span></span>
    </div>
    ${rows}`;
}

function openLogPayment(tenantId, tenantName, rentAmt, month, year) {
  document.getElementById('lp-tid').value   = tenantId;
  document.getElementById('lp-month').value = month;
  document.getElementById('lp-year').value  = year;
  document.getElementById('lp-amt').value   = rentAmt;
  document.getElementById('lp-date').value  = new Date().toISOString().slice(0, 10);
  document.getElementById('lp-notes').value = '';
  document.getElementById('lp-title').textContent = 'Log payment — ' + tenantName;
  document.getElementById('lp-modal').style.display = 'flex';
}

function closeLogPayment() {
  document.getElementById('lp-modal').style.display = 'none';
}

async function submitLogPayment() {
  const btn    = document.getElementById('lp-btn');
  const tid    = document.getElementById('lp-tid').value;
  const month  = parseInt(document.getElementById('lp-month').value);
  const year   = parseInt(document.getElementById('lp-year').value);
  const amt    = parseFloat(document.getElementById('lp-amt').value) || 0;
  const date   = document.getElementById('lp-date').value;
  const method = document.getElementById('lp-method').value;
  const notes  = document.getElementById('lp-notes').value.trim();

  if (!amt || !date) { alert('Amount and date are required'); return; }

  btn.disabled = true;
  btn.textContent = 'Saving...';

  const tenant = R.tenants.find(t => t.id === tid);
  const { data, error } = await db.from('rental_payments').insert({
    tenant_id: tid, project_id: tenant?.project_id || null,
    amount: amt, paid_date: date, method, notes,
    period_month: month, period_year: year
  }).select();

  if (error) {
    alert('Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Log payment';
    return;
  }

  R.payments.unshift(data[0]);
  closeLogPayment();
  btn.disabled = false;
  btn.textContent = 'Log payment';
  renderRent();
}

async function removeRentPayment(id) {
  if (!confirm('Remove this payment record?')) return;
  await db.from('rental_payments').delete().eq('id', id);
  R.payments = R.payments.filter(p => p.id !== id);
  renderRent();
}

// ── MAINTENANCE ───────────────────────────────────────────────────────────────

function renderMaintenance() {
  const filter = document.getElementById('rm-filter')?.value || 'all';
  const list   = document.getElementById('rm-list');
  if (!list) return;

  let reqs = [...R.maintenance];
  if (filter !== 'all') reqs = reqs.filter(r => r.status === filter);

  if (!reqs.length) {
    list.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:12px 0">
      No maintenance requests${filter !== 'all' ? ' with this filter' : ''} yet.</div>`;
    return;
  }

  const pCol  = { low:'var(--muted)',  medium:'var(--amber)',  high:'var(--red)',  emergency:'#ff0040' };
  const pBg   = { low:'var(--border)', medium:'var(--adim)',   high:'var(--rdim)', emergency:'#ff004022' };
  const sCol  = { open:'var(--amber)', in_progress:'var(--blue)', resolved:'var(--green)' };
  const sBg   = { open:'var(--adim)', in_progress:'var(--bdim)',  resolved:'var(--gdim)' };
  const sLbl  = { open:'Open', in_progress:'In Progress', resolved:'Resolved' };

  list.innerHTML = reqs.map(r => {
    const tenant = R.tenants.find(t => t.id === r.tenant_id);
    const proj   = C.projects.find(p => p.id === r.project_id);
    return `<div class="bid-card" style="margin-bottom:10px">
      <div class="bid-hdr" onclick="toggleBody('rm-${r.id}')">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:600">${r.title}</span>
            <span style="font-size:10px;padding:2px 8px;border-radius:7px;font-weight:600;
              background:${pBg[r.priority]};color:${pCol[r.priority]}">${r.priority.toUpperCase()}</span>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">
            ${tenant ? tenant.name : '—'} · ${proj ? proj.name : '—'} · ${r.submitted_at ? r.submitted_at.slice(0,10) : '—'}
          </div>
        </div>
        <span class="bstatus" style="background:${sBg[r.status]};color:${sCol[r.status]}">${sLbl[r.status]}</span>
      </div>
      <div class="bid-body" id="rm-${r.id}">
        ${r.description ? `<div style="font-size:13px;padding:9px 12px;background:var(--surface2);
          border-radius:7px;margin-bottom:12px;line-height:1.5">${r.description}</div>` : ''}
        ${r.photos && r.photos.length
          ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
              ${r.photos.map(url =>
                `<a href="${url}" target="_blank">
                  <img src="${url}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--border)">
                </a>`
              ).join('')}
             </div>`
          : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div class="fg">
            <label class="flabel">Status</label>
            <select onchange="updateMaintStatus('${r.id}',this.value)"
              style="padding:7px 10px;background:var(--surface2);border:1px solid var(--border2);
              border-radius:8px;color:var(--text);font-size:13px;font-family:inherit;outline:none;width:100%">
              <option value="open"        ${r.status==='open'        ?'selected':''}>Open</option>
              <option value="in_progress" ${r.status==='in_progress' ?'selected':''}>In Progress</option>
              <option value="resolved"    ${r.status==='resolved'    ?'selected':''}>Resolved</option>
            </select>
          </div>
          <div class="fg">
            <label class="flabel">Priority</label>
            <select onchange="updateMaintPriority('${r.id}',this.value)"
              style="padding:7px 10px;background:var(--surface2);border:1px solid var(--border2);
              border-radius:8px;color:var(--text);font-size:13px;font-family:inherit;outline:none;width:100%">
              <option value="low"       ${r.priority==='low'       ?'selected':''}>Low</option>
              <option value="medium"    ${r.priority==='medium'    ?'selected':''}>Medium</option>
              <option value="high"      ${r.priority==='high'      ?'selected':''}>High</option>
              <option value="emergency" ${r.priority==='emergency' ?'selected':''}>Emergency</option>
            </select>
          </div>
        </div>
        <div class="fg">
          <label class="flabel">🔒 Internal notes (never shown to tenant)</label>
          <textarea rows="2" id="inote-${r.id}" onblur="saveInternalNote('${r.id}',this.value)"
            style="width:100%;padding:8px 11px;background:var(--surface2);border:1px solid var(--border2);
            border-radius:8px;color:var(--text);font-size:13px;font-family:inherit;outline:none;resize:vertical">${r.internal_notes || ''}</textarea>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function updateMaintStatus(id, status) {
  const resolved_at = status === 'resolved' ? new Date().toISOString() : null;
  await db.from('maintenance_requests').update({ status, resolved_at }).eq('id', id);
  const r = R.maintenance.find(x => x.id === id);
  if (r) { r.status = status; r.resolved_at = resolved_at; }
  renderMaintenance();
}

async function updateMaintPriority(id, priority) {
  await db.from('maintenance_requests').update({ priority }).eq('id', id);
  const r = R.maintenance.find(x => x.id === id);
  if (r) r.priority = priority;
}

async function saveInternalNote(id, notes) {
  await db.from('maintenance_requests').update({ internal_notes: notes }).eq('id', id);
  const r = R.maintenance.find(x => x.id === id);
  if (r) r.internal_notes = notes;
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────

function renderAnnouncements() {
  // Populate property select with "all" option
  const sel = document.getElementById('ra-proj');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">— all properties —</option>' +
      C.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (cur) sel.value = cur;
  }

  const list = document.getElementById('ra-list');
  if (!list) return;

  if (!R.announcements.length) {
    list.innerHTML = `<div style="font-size:13px;color:var(--muted)">No announcements yet.</div>`;
    return;
  }

  list.innerHTML = R.announcements.map(a => {
    const proj = C.projects.find(p => p.id === a.project_id);
    return `<div class="card" style="margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px">
        <div>
          <div style="font-size:14px;font-weight:600">${a.title}</div>
          <div style="font-size:11px;color:var(--muted)">
            ${proj ? proj.name : '📢 All properties'} · ${a.created_at ? a.created_at.slice(0,10) : '—'}
          </div>
        </div>
        <button class="btn sm red" onclick="removeAnnouncement('${a.id}')">Remove</button>
      </div>
      <div style="font-size:13px;color:#ccc;line-height:1.55">${a.body}</div>
    </div>`;
  }).join('');
}

async function addAnnouncement() {
  const btn   = document.getElementById('ra-btn');
  const title = document.getElementById('ra-title').value.trim();
  const body  = document.getElementById('ra-body').value.trim();
  const projId = document.getElementById('ra-proj').value || null;

  if (!title || !body) { showFb('ra-fb', 'error', 'Title and message required'); return; }

  btn.disabled = true;
  btn.textContent = 'Posting...';
  showFb('ra-fb', 'saving', 'Posting...', 0);

  const { data, error } = await db.from('announcements').insert({ project_id: projId, title, body }).select();

  if (error) {
    showFb('ra-fb', 'error', 'Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Post announcement';
    return;
  }

  R.announcements.unshift(data[0]);
  document.getElementById('ra-title').value = '';
  document.getElementById('ra-body').value  = '';
  showFb('ra-fb', 'saved', '✓ Posted!');
  btn.disabled = false;
  btn.textContent = 'Post announcement';
  renderAnnouncements();
}

async function removeAnnouncement(id) {
  if (!confirm('Delete this announcement? Tenants will no longer see it.')) return;
  await db.from('announcements').delete().eq('id', id);
  R.announcements = R.announcements.filter(a => a.id !== id);
  renderAnnouncements();
}
