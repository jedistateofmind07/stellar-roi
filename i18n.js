// ── Stellar Analytics ROI — Translation Module v2 ──────────────────────────
const TRANSLATIONS = {
  en: {
    'lang.toggle': 'Español',
    'tab.dashboard': 'Dashboard', 'tab.bid_queue': 'Bid queue', 'tab.all_bids': 'All bids',
    'tab.payments': 'Payments', 'tab.expenses': 'Expenses', 'tab.expense_queue': 'Expense queue',
    'tab.reimbursements': 'Reimbursements', 'tab.people': 'People & subs', 'tab.projects': 'Projects',
    'tab.pl': 'P&L', 'tab.bids': 'Bids', 'tab.charts': 'Charts',
    'btn.export': '⬇ Export .xlsx', 'btn.new_project': '+ New project', 'btn.save_pl': 'Save P&L',
    'btn.approve': 'Approve — add to actuals', 'btn.reject': 'Reject', 'btn.remove': 'Remove',
    'btn.copy': 'Copy', 'btn.sign_out': 'Sign out',
    'metric.projects': 'Projects', 'metric.pending_bids': 'Pending bids',
    'metric.approved_bids': 'Approved bids', 'metric.approved_value': 'Approved bid value',
    'metric.pending_expenses': 'Pending expenses', 'metric.expense_actuals': 'Expense actuals',
    'metric.unreimbursed': 'Unreimbursed',
    'status.pending': 'Pending', 'status.approved': 'Approved', 'status.rejected': 'Rejected',
    'general.loading': 'Loading...', 'general.all_time': 'All time', 'general.this_month': 'This month',
    'general.this_quarter': 'This quarter', 'general.this_year': 'This year',
    'general.no_bids': 'No bids yet', 'general.no_approved': 'No approved bids yet',
    'general.add_expense_line': '+ Add expense line', 'general.approved_total': 'Approved total',
    'general.by_person': 'By person', 'general.by_project': 'By project',
    'general.rejected_log': 'Rejected log', 'general.queue_clear': 'Queue is clear',
    'general.mark_reimbursed': 'Mark reimbursed', 'general.mark_paid': 'Mark paid',
    'general.view_dashboard': '→ view dashboard', 'general.bid_link': '📋 Bid link:',
    'general.expense_link': '💵 Expense link:', 'general.total': 'Total',
    'general.outstanding': 'Outstanding', 'general.partners': 'Partners',
    'project.add': 'Add project', 'project.name': 'Project name', 'project.street': 'Street address',
    'project.unit': 'Unit / Suite / Apt', 'project.city': 'City', 'project.state': 'State',
    'project.zip': 'ZIP code', 'project.partners': 'Partners', 'project.save': 'Save to Supabase',
    'project.active': 'Active projects',
    'bid.title': 'Submit a Bid', 'bid.subtitle': 'Fill out this form to submit your bid for review',
    'bid.your_info': 'Your information', 'bid.company': 'Company / your name *',
    'bid.contact': 'Contact name', 'bid.phone': 'Phone number', 'bid.email': 'Email',
    'bid.address': 'Business address', 'bid.street': 'Street address',
    'bid.unit': 'Unit / Suite / Apt', 'bid.city': 'City', 'bid.state': 'State', 'bid.zip': 'ZIP code',
    'bid.job_details': 'Job details', 'bid.property': 'Property *', 'bid.job_title': 'Job title *',
    'bid.scope': 'Scope of work', 'bid.labor': 'Labor items', 'bid.add_labor': '+ Add labor line',
    'bid.materials': 'Materials items', 'bid.add_materials': '+ Add materials line',
    'bid.labor_sub': 'Labor subtotal', 'bid.mat_sub': 'Materials subtotal',
    'bid.grand_total': 'Grand total', 'bid.notes': 'Notes (optional)',
    'bid.submit': 'Submit bid', 'bid.success': 'Bid submitted!',
    'bid.success_msg': 'Your bid is in the review queue. You will be contacted if it is approved or if changes are needed.',
    'bid.submit_another': 'Submit another bid',
    'exp.title': 'Submit an Expense', 'exp.subtitle': 'Receipts go to the review queue before affecting project costs',
    'exp.who_paid': 'Who paid?', 'exp.paid_by': 'Paid by *', 'exp.project': 'Project *',
    'exp.items': 'Expense items', 'exp.description': 'Description', 'exp.add_item': '+ Add another item',
    'exp.total': 'Total', 'exp.receipt': 'Receipt / invoice', 'exp.receipt_opt': '(optional but recommended)',
    'exp.upload': 'Tap to upload or drag & drop',
    'exp.upload_sub': 'Take a photo of your receipt or upload a PDF',
    'exp.notes': 'Notes (optional)', 'exp.submit': 'Submit Expense', 'exp.success': 'Expense submitted!',
    'exp.success_msg': "Your receipt is in the review queue. Once approved it will be added to the project's actual costs.",
    'exp.submit_another': 'Submit another expense', 'exp.other': 'Other (type name)',
    'pl.title': 'Profit & loss — flip breakdown', 'pl.item': 'Item',
    'pl.estimated': 'Estimated ($)', 'pl.actual': 'Actual ($)', 'pl.difference': 'Difference',
    'pl.purchase': '📦 Purchase (costs)', 'pl.purchase_price': 'Purchase price',
    'pl.closing': 'Closing / acquisition costs', 'pl.rehab': '🏗️ Rehab (costs)',
    'pl.labor': 'Labor', 'pl.materials': 'Materials', 'pl.holding': '🏦 Holding (costs)',
    'pl.mortgage': 'Mortgage payments', 'pl.taxes': 'Taxes, insurance, utilities',
    'pl.loan': '💵 Loan disbursement', 'pl.loan_note': '(income — reduces net cost)',
    'pl.selling': '🏷️ Selling (costs)', 'pl.commission': 'Agent commission',
    'pl.sell_closing': 'Closing / selling costs', 'pl.staging': 'Staging & marketing',
    'pl.net_costs': 'Net out-of-pocket costs', 'pl.revenue': 'Revenue',
    'pl.arv': 'Selling price (ARV)', 'pl.net_profit': 'Net profit / loss',
    'pl.save': 'Save P&L', 'pl.saved': '✓ P&L saved',
    'notice.pending_gate': 'Expenses here have zero effect on actual project costs until you approve them.',
    'notice.reimbursements': 'Approved expenses are added to actual project costs automatically. Toggle reimbursed to track who has been paid back.',
  },
  es: {
    'lang.toggle': 'English',
    'tab.dashboard': 'Panel', 'tab.bid_queue': 'Cola de ofertas', 'tab.all_bids': 'Todas las ofertas',
    'tab.payments': 'Pagos', 'tab.expenses': 'Gastos', 'tab.expense_queue': 'Cola de gastos',
    'tab.reimbursements': 'Reembolsos', 'tab.people': 'Personas y contratistas', 'tab.projects': 'Proyectos',
    'tab.pl': 'P&G', 'tab.bids': 'Ofertas', 'tab.charts': 'Gráficas',
    'btn.export': '⬇ Exportar .xlsx', 'btn.new_project': '+ Nuevo proyecto', 'btn.save_pl': 'Guardar P&G',
    'btn.approve': 'Aprobar — agregar a reales', 'btn.reject': 'Rechazar', 'btn.remove': 'Eliminar',
    'btn.copy': 'Copiar', 'btn.sign_out': 'Cerrar sesión',
    'metric.projects': 'Proyectos', 'metric.pending_bids': 'Ofertas pendientes',
    'metric.approved_bids': 'Ofertas aprobadas', 'metric.approved_value': 'Valor de ofertas aprobadas',
    'metric.pending_expenses': 'Gastos pendientes', 'metric.expense_actuals': 'Gastos reales',
    'metric.unreimbursed': 'Sin reembolso',
    'status.pending': 'Pendiente', 'status.approved': 'Aprobado', 'status.rejected': 'Rechazado',
    'general.loading': 'Cargando...', 'general.all_time': 'Todo el tiempo', 'general.this_month': 'Este mes',
    'general.this_quarter': 'Este trimestre', 'general.this_year': 'Este año',
    'general.no_bids': 'Sin ofertas aún', 'general.no_approved': 'Sin ofertas aprobadas aún',
    'general.add_expense_line': '+ Agregar línea de gasto', 'general.approved_total': 'Total aprobado',
    'general.by_person': 'Por persona', 'general.by_project': 'Por proyecto',
    'general.rejected_log': 'Registro de rechazados', 'general.queue_clear': 'Cola limpia',
    'general.mark_reimbursed': 'Marcar reembolsado', 'general.mark_paid': 'Marcar pagado',
    'general.view_dashboard': '→ ver panel', 'general.bid_link': '📋 Enlace de oferta:',
    'general.expense_link': '💵 Enlace de gastos:', 'general.total': 'Total',
    'general.outstanding': 'Pendiente', 'general.partners': 'Socios',
    'project.add': 'Agregar proyecto', 'project.name': 'Nombre del proyecto', 'project.street': 'Dirección',
    'project.unit': 'Unidad / Suite / Apto', 'project.city': 'Ciudad', 'project.state': 'Estado',
    'project.zip': 'Código postal', 'project.partners': 'Socios', 'project.save': 'Guardar en Supabase',
    'project.active': 'Proyectos activos',
    'bid.title': 'Enviar una Oferta', 'bid.subtitle': 'Complete este formulario para enviar su oferta para revisión',
    'bid.your_info': 'Su información', 'bid.company': 'Empresa / su nombre *',
    'bid.contact': 'Nombre de contacto', 'bid.phone': 'Número de teléfono', 'bid.email': 'Correo electrónico',
    'bid.address': 'Dirección comercial', 'bid.street': 'Dirección',
    'bid.unit': 'Unidad / Suite / Apto', 'bid.city': 'Ciudad', 'bid.state': 'Estado', 'bid.zip': 'Código postal',
    'bid.job_details': 'Detalles del trabajo', 'bid.property': 'Propiedad *', 'bid.job_title': 'Título del trabajo *',
    'bid.scope': 'Alcance del trabajo', 'bid.labor': 'Mano de obra', 'bid.add_labor': '+ Agregar línea de mano de obra',
    'bid.materials': 'Materiales', 'bid.add_materials': '+ Agregar línea de materiales',
    'bid.labor_sub': 'Subtotal mano de obra', 'bid.mat_sub': 'Subtotal materiales',
    'bid.grand_total': 'Total general', 'bid.notes': 'Notas (opcional)',
    'bid.submit': 'Enviar oferta', 'bid.success': '¡Oferta enviada!',
    'bid.success_msg': 'Su oferta está en la cola de revisión. Se le contactará si es aprobada o si se necesitan cambios.',
    'bid.submit_another': 'Enviar otra oferta',
    'exp.title': 'Enviar un Gasto', 'exp.subtitle': 'Los recibos van a la cola de revisión antes de afectar los costos del proyecto',
    'exp.who_paid': '¿Quién pagó?', 'exp.paid_by': 'Pagado por *', 'exp.project': 'Proyecto *',
    'exp.items': 'Artículos del gasto', 'exp.description': 'Descripción', 'exp.add_item': '+ Agregar otro artículo',
    'exp.total': 'Total', 'exp.receipt': 'Recibo / factura', 'exp.receipt_opt': '(opcional pero recomendado)',
    'exp.upload': 'Toque para subir o arrastre y suelte',
    'exp.upload_sub': 'Tome una foto de su recibo o suba un PDF',
    'exp.notes': 'Notas (opcional)', 'exp.submit': 'Enviar gasto', 'exp.success': '¡Gasto enviado!',
    'exp.success_msg': 'Su recibo está en la cola de revisión. Una vez aprobado se agregará a los costos reales del proyecto.',
    'exp.submit_another': 'Enviar otro gasto', 'exp.other': 'Otro (escribir nombre)',
    'pl.title': 'Ganancias y pérdidas — desglose', 'pl.item': 'Artículo',
    'pl.estimated': 'Estimado ($)', 'pl.actual': 'Real ($)', 'pl.difference': 'Diferencia',
    'pl.purchase': '📦 Compra (costos)', 'pl.purchase_price': 'Precio de compra',
    'pl.closing': 'Costos de cierre / adquisición', 'pl.rehab': '🏗️ Remodelación (costos)',
    'pl.labor': 'Mano de obra', 'pl.materials': 'Materiales', 'pl.holding': '🏦 Mantenimiento (costos)',
    'pl.mortgage': 'Pagos de hipoteca', 'pl.taxes': 'Impuestos, seguro, servicios',
    'pl.loan': '💵 Desembolso del préstamo', 'pl.loan_note': '(ingreso — reduce el costo neto)',
    'pl.selling': '🏷️ Venta (costos)', 'pl.commission': 'Comisión del agente',
    'pl.sell_closing': 'Costos de cierre / venta', 'pl.staging': 'Preparación y mercadeo',
    'pl.net_costs': 'Costos netos de bolsillo', 'pl.revenue': 'Ingresos',
    'pl.arv': 'Precio de venta (ARV)', 'pl.net_profit': 'Ganancia / pérdida neta',
    'pl.save': 'Guardar P&G', 'pl.saved': '✓ P&G guardado',
    'notice.pending_gate': 'Los gastos aquí no afectan los costos reales del proyecto hasta que los apruebe.',
    'notice.reimbursements': 'Los gastos aprobados se agregan automáticamente a los costos reales.',
  }
};

let _lang = localStorage.getItem('stellar_lang') || 'en';

function t(key, fallback) {
  return (TRANSLATIONS[_lang] && TRANSLATIONS[_lang][key]) ||
         (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) ||
         fallback || key;
}

function getLang() { return _lang; }

function setLang(lang) {
  _lang = lang;
  localStorage.setItem('stellar_lang', lang);
  applyTranslations();
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

function toggleLang() { setLang(_lang === 'en' ? 'es' : 'en'); }

function applyTranslations() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-t-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-t-placeholder'));
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.textContent = t('lang.toggle');
  });
}

// Floating button always visible on every page
function injectLangButton() {
  if (document.getElementById('global-lang-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'global-lang-btn';
  btn.className = 'lang-btn';
  btn.textContent = t('lang.toggle');
  btn.onclick = toggleLang;
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;background:#1c1c1c;border:1px solid #a78bfa;border-radius:20px;color:#a78bfa;font-size:13px;font-weight:600;padding:8px 18px;cursor:pointer;font-family:inherit;box-shadow:0 2px 12px rgba(0,0,0,.5);transition:all .2s';
  btn.onmouseenter = () => { btn.style.background='#a78bfa'; btn.style.color='#000'; };
  btn.onmouseleave = () => { btn.style.background='#1c1c1c'; btn.style.color='#a78bfa'; };
  document.body.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
  injectLangButton();
  applyTranslations();
});
