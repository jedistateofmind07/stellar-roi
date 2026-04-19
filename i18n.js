// ── Stellar Analytics ROI — Translation Module ─────────────────────────────
// Usage: include this file, then call t('key') to get translated string
// Toggle: setLang('es') or setLang('en')

const TRANSLATIONS = {
  en: {
    // NAV / HEADER
    'app.title': 'Stellar Analytics ROI',
    'app.live': 'Stellar Analytics ROI — Live ✓',
    'app.connecting': 'Connecting...',
    'btn.export': '⬇ Export .xlsx',
    'btn.new_project': '+ New project',
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.delete': 'Delete',
    'btn.approve': 'Approve',
    'btn.reject': 'Reject',
    'btn.submit': 'Submit',
    'btn.add': 'Add',
    'btn.sign_out': 'Sign out',
    'lang.toggle': 'Español',

    // TABS
    'tab.dashboard': 'Dashboard',
    'tab.bid_queue': 'Bid queue',
    'tab.all_bids': 'All bids',
    'tab.payments': 'Payments',
    'tab.expenses': 'Expenses',
    'tab.expense_queue': 'Expense queue',
    'tab.reimbursements': 'Reimbursements',
    'tab.people': 'People & subs',
    'tab.projects': 'Projects',
    'tab.pl': 'P&L',
    'tab.bids': 'Bids',
    'tab.charts': 'Charts',

    // DASHBOARD METRICS
    'metric.projects': 'Projects',
    'metric.pending_bids': 'Pending bids',
    'metric.approved_bids': 'Approved bids',
    'metric.approved_value': 'Approved bid value',
    'metric.pending_expenses': 'Pending expenses',
    'metric.expense_actuals': 'Expense actuals',
    'metric.unreimbursed': 'Unreimbursed',

    // PROJECT FORM
    'project.name': 'Project name',
    'project.street': 'Street address',
    'project.unit': 'Unit / Suite / Apt',
    'project.city': 'City',
    'project.state': 'State',
    'project.zip': 'ZIP code',
    'project.partners': 'Partners',
    'project.save': 'Save to Supabase',
    'project.active': 'Active projects',
    'project.add': 'Add project',
    'project.remove': 'Remove',

    // BID FORM
    'bid.title': 'Submit a Bid',
    'bid.subtitle': 'Fill out this form to submit your bid for review',
    'bid.your_info': 'Your information',
    'bid.company': 'Company / your name',
    'bid.contact': 'Contact name',
    'bid.phone': 'Phone number',
    'bid.email': 'Email',
    'bid.address': 'Business address',
    'bid.street': 'Street address',
    'bid.unit': 'Unit / Suite / Apt',
    'bid.city': 'City',
    'bid.state': 'State',
    'bid.zip': 'ZIP code',
    'bid.job_details': 'Job details',
    'bid.property': 'Property',
    'bid.job_title': 'Job title',
    'bid.scope': 'Scope of work',
    'bid.labor': 'Labor items',
    'bid.add_labor': '+ Add labor line',
    'bid.materials': 'Materials items',
    'bid.add_materials': '+ Add materials line',
    'bid.labor_sub': 'Labor subtotal',
    'bid.mat_sub': 'Materials subtotal',
    'bid.grand_total': 'Grand total',
    'bid.files': 'Attachments',
    'bid.notes': 'Notes',
    'bid.submit': 'Submit bid',
    'bid.success': 'Bid submitted!',
    'bid.success_msg': 'Your bid is in the review queue. You will be contacted if it is approved or if changes are needed.',
    'bid.submit_another': 'Submit another bid',
    'bid.project_locked': 'Project',
    'bid.copy_link': 'Copy bid link for this project',
    'bid.link_copied': '✓ Link copied!',

    // EXPENSE FORM
    'exp.title': 'Submit an Expense',
    'exp.subtitle': 'Receipts go to the review queue before affecting project costs',
    'exp.who_paid': 'Who paid?',
    'exp.paid_by': 'Paid by',
    'exp.project': 'Project',
    'exp.items': 'Expense items',
    'exp.description': 'Description',
    'exp.amount': 'Amount',
    'exp.add_item': '+ Add another item',
    'exp.total': 'Total',
    'exp.receipt': 'Receipt / invoice',
    'exp.receipt_sub': '(optional but recommended)',
    'exp.upload': 'Tap to upload or drag & drop',
    'exp.upload_sub': 'Take a photo of your receipt or upload a PDF',
    'exp.notes': 'Notes (optional)',
    'exp.submit': 'Submit Expense',
    'exp.success': 'Expense submitted!',
    'exp.success_msg': 'Your receipt is in the review queue. Once approved it will be added to the project\'s actual costs.',
    'exp.submit_another': 'Submit another expense',
    'exp.project_locked': 'Project',
    'exp.copy_link': 'Copy expense link for this project',
    'exp.link_copied': '✓ Link copied!',
    'exp.other': 'Other (type name)',

    // P&L
    'pl.title': 'Profit & loss — flip breakdown',
    'pl.item': 'Item',
    'pl.estimated': 'Estimated ($)',
    'pl.actual': 'Actual ($)',
    'pl.difference': 'Difference',
    'pl.purchase': 'Purchase (costs)',
    'pl.purchase_price': 'Purchase price',
    'pl.closing': 'Closing / acquisition costs',
    'pl.rehab': 'Rehab (costs)',
    'pl.labor': 'Labor',
    'pl.materials': 'Materials',
    'pl.holding': 'Holding (costs)',
    'pl.mortgage': 'Mortgage payments',
    'pl.taxes': 'Taxes, insurance, utilities',
    'pl.loan': 'Loan disbursement',
    'pl.loan_note': '(income — reduces net cost)',
    'pl.selling': 'Selling (costs)',
    'pl.commission': 'Agent commission',
    'pl.sell_closing': 'Closing / selling costs',
    'pl.staging': 'Staging & marketing',
    'pl.net_costs': 'Net out-of-pocket costs',
    'pl.revenue': 'Revenue',
    'pl.arv': 'Selling price (ARV)',
    'pl.net_profit': 'Net profit / loss',
    'pl.save': 'Save P&L',
    'pl.saved': '✓ P&L saved',

    // GENERAL
    'general.loading': 'Loading...',
    'general.no_data': 'No data yet',
    'general.all_time': 'All time',
    'general.this_month': 'This month',
    'general.this_quarter': 'This quarter',
    'general.this_year': 'This year',
    'general.select': '— select —',
    'general.optional': 'optional',
    'general.status': 'Status',
    'general.pending': 'Pending',
    'general.approved': 'Approved',
    'general.rejected': 'Rejected',
    'general.reimbursed': 'Reimbursed',
    'general.outstanding': 'Outstanding',
    'general.total': 'Total',
    'general.date': 'Date',
    'general.notes': 'Notes',
    'general.actions': 'Actions',
    'general.who_paid': 'Who paid',
    'general.cost': 'Cost',
    'general.photo': 'Photo',
  },

  es: {
    // NAV / HEADER
    'app.title': 'Stellar Analytics ROI',
    'app.live': 'Stellar Analytics ROI — En vivo ✓',
    'app.connecting': 'Conectando...',
    'btn.export': '⬇ Exportar .xlsx',
    'btn.new_project': '+ Nuevo proyecto',
    'btn.save': 'Guardar',
    'btn.cancel': 'Cancelar',
    'btn.delete': 'Eliminar',
    'btn.approve': 'Aprobar',
    'btn.reject': 'Rechazar',
    'btn.submit': 'Enviar',
    'btn.add': 'Agregar',
    'btn.sign_out': 'Cerrar sesión',
    'lang.toggle': 'English',

    // TABS
    'tab.dashboard': 'Panel',
    'tab.bid_queue': 'Cola de ofertas',
    'tab.all_bids': 'Todas las ofertas',
    'tab.payments': 'Pagos',
    'tab.expenses': 'Gastos',
    'tab.expense_queue': 'Cola de gastos',
    'tab.reimbursements': 'Reembolsos',
    'tab.people': 'Personas y contratistas',
    'tab.projects': 'Proyectos',
    'tab.pl': 'P&G',
    'tab.bids': 'Ofertas',
    'tab.charts': 'Gráficas',

    // DASHBOARD METRICS
    'metric.projects': 'Proyectos',
    'metric.pending_bids': 'Ofertas pendientes',
    'metric.approved_bids': 'Ofertas aprobadas',
    'metric.approved_value': 'Valor de ofertas aprobadas',
    'metric.pending_expenses': 'Gastos pendientes',
    'metric.expense_actuals': 'Gastos reales',
    'metric.unreimbursed': 'Sin reembolso',

    // PROJECT FORM
    'project.name': 'Nombre del proyecto',
    'project.street': 'Dirección',
    'project.unit': 'Unidad / Suite / Apto',
    'project.city': 'Ciudad',
    'project.state': 'Estado',
    'project.zip': 'Código postal',
    'project.partners': 'Socios',
    'project.save': 'Guardar en Supabase',
    'project.active': 'Proyectos activos',
    'project.add': 'Agregar proyecto',
    'project.remove': 'Eliminar',

    // BID FORM
    'bid.title': 'Enviar una Oferta',
    'bid.subtitle': 'Complete este formulario para enviar su oferta para revisión',
    'bid.your_info': 'Su información',
    'bid.company': 'Empresa / su nombre',
    'bid.contact': 'Nombre de contacto',
    'bid.phone': 'Número de teléfono',
    'bid.email': 'Correo electrónico',
    'bid.address': 'Dirección comercial',
    'bid.street': 'Dirección',
    'bid.unit': 'Unidad / Suite / Apto',
    'bid.city': 'Ciudad',
    'bid.state': 'Estado',
    'bid.zip': 'Código postal',
    'bid.job_details': 'Detalles del trabajo',
    'bid.property': 'Propiedad',
    'bid.job_title': 'Título del trabajo',
    'bid.scope': 'Alcance del trabajo',
    'bid.labor': 'Mano de obra',
    'bid.add_labor': '+ Agregar línea de mano de obra',
    'bid.materials': 'Materiales',
    'bid.add_materials': '+ Agregar línea de materiales',
    'bid.labor_sub': 'Subtotal mano de obra',
    'bid.mat_sub': 'Subtotal materiales',
    'bid.grand_total': 'Total general',
    'bid.files': 'Archivos adjuntos',
    'bid.notes': 'Notas',
    'bid.submit': 'Enviar oferta',
    'bid.success': '¡Oferta enviada!',
    'bid.success_msg': 'Su oferta está en la cola de revisión. Se le contactará si es aprobada o si se necesitan cambios.',
    'bid.submit_another': 'Enviar otra oferta',
    'bid.project_locked': 'Proyecto',
    'bid.copy_link': 'Copiar enlace de oferta para este proyecto',
    'bid.link_copied': '✓ ¡Enlace copiado!',

    // EXPENSE FORM
    'exp.title': 'Enviar un Gasto',
    'exp.subtitle': 'Los recibos van a la cola de revisión antes de afectar los costos del proyecto',
    'exp.who_paid': '¿Quién pagó?',
    'exp.paid_by': 'Pagado por',
    'exp.project': 'Proyecto',
    'exp.items': 'Artículos del gasto',
    'exp.description': 'Descripción',
    'exp.amount': 'Monto',
    'exp.add_item': '+ Agregar otro artículo',
    'exp.total': 'Total',
    'exp.receipt': 'Recibo / factura',
    'exp.receipt_sub': '(opcional pero recomendado)',
    'exp.upload': 'Toque para subir o arrastre y suelte',
    'exp.upload_sub': 'Tome una foto de su recibo o suba un PDF',
    'exp.notes': 'Notas (opcional)',
    'exp.submit': 'Enviar gasto',
    'exp.success': '¡Gasto enviado!',
    'exp.success_msg': 'Su recibo está en la cola de revisión. Una vez aprobado se agregará a los costos reales del proyecto.',
    'exp.submit_another': 'Enviar otro gasto',
    'exp.project_locked': 'Proyecto',
    'exp.copy_link': 'Copiar enlace de gastos para este proyecto',
    'exp.link_copied': '✓ ¡Enlace copiado!',
    'exp.other': 'Otro (escribir nombre)',

    // P&L
    'pl.title': 'Ganancias y pérdidas — desglose de remodelación',
    'pl.item': 'Artículo',
    'pl.estimated': 'Estimado ($)',
    'pl.actual': 'Real ($)',
    'pl.difference': 'Diferencia',
    'pl.purchase': 'Compra (costos)',
    'pl.purchase_price': 'Precio de compra',
    'pl.closing': 'Costos de cierre / adquisición',
    'pl.rehab': 'Remodelación (costos)',
    'pl.labor': 'Mano de obra',
    'pl.materials': 'Materiales',
    'pl.holding': 'Mantenimiento (costos)',
    'pl.mortgage': 'Pagos de hipoteca',
    'pl.taxes': 'Impuestos, seguro, servicios',
    'pl.loan': 'Desembolso del préstamo',
    'pl.loan_note': '(ingreso — reduce el costo neto)',
    'pl.selling': 'Venta (costos)',
    'pl.commission': 'Comisión del agente',
    'pl.sell_closing': 'Costos de cierre / venta',
    'pl.staging': 'Preparación y mercadeo',
    'pl.net_costs': 'Costos netos de bolsillo',
    'pl.revenue': 'Ingresos',
    'pl.arv': 'Precio de venta (ARV)',
    'pl.net_profit': 'Ganancia / pérdida neta',
    'pl.save': 'Guardar P&G',
    'pl.saved': '✓ P&G guardado',

    // GENERAL
    'general.loading': 'Cargando...',
    'general.no_data': 'Sin datos aún',
    'general.all_time': 'Todo el tiempo',
    'general.this_month': 'Este mes',
    'general.this_quarter': 'Este trimestre',
    'general.this_year': 'Este año',
    'general.select': '— seleccionar —',
    'general.optional': 'opcional',
    'general.status': 'Estado',
    'general.pending': 'Pendiente',
    'general.approved': 'Aprobado',
    'general.rejected': 'Rechazado',
    'general.reimbursed': 'Reembolsado',
    'general.outstanding': 'Pendiente de pago',
    'general.total': 'Total',
    'general.date': 'Fecha',
    'general.notes': 'Notas',
    'general.actions': 'Acciones',
    'general.who_paid': 'Quién pagó',
    'general.cost': 'Costo',
    'general.photo': 'Foto',
  }
};

// ── Core translation engine ──────────────────────────────────────────────────
let _lang = localStorage.getItem('stellar_lang') || 'en';

function t(key, fallback) {
  return TRANSLATIONS[_lang]?.[key] || TRANSLATIONS['en']?.[key] || fallback || key;
}

function getLang() { return _lang; }

function setLang(lang) {
  _lang = lang;
  localStorage.setItem('stellar_lang', lang);
  // Re-render the page by refreshing all data-t elements
  applyTranslations();
  // Dispatch event so pages can re-render dynamic content
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

function toggleLang() {
  setLang(_lang === 'en' ? 'es' : 'en');
}

// Apply translations to all [data-t] elements
function applyTranslations() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else if (el.tagName === 'OPTION') {
      el.textContent = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-t-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-t-placeholder'));
  });
}

// Auto-apply on load
document.addEventListener('DOMContentLoaded', applyTranslations);
