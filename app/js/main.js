import { StorageService } from './services/StorageService.js';
import { crearDatosDemostracion } from './services/DemoData.js';
import { AuthService } from './services/AuthService.js';
import { BancoService } from './services/BancoService.js';
import { Cuenta } from './models/Cuenta.js';
import { CuentaAhorros } from './models/CuentaAhorros.js';
import { CuentaCorriente } from './models/CuentaCorriente.js';
import { TarjetaCredito, determinarTasaCuotas, calcularCuotaMensual } from './models/TarjetaCredito.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const PANEL_TITLES = { overview: 'Resumen general', balance: 'Consultar saldo', products: 'Mis productos', deposit: 'Consignar dinero', withdraw: 'Retirar dinero', transfer: 'Transferir dinero', card: 'Tarjeta de crédito', movements: 'Historial de movimientos', profile: 'Perfil y seguridad', admin: 'Panel administrativo' };
const TYPE_NAMES = { CuentaAhorros: 'Cuenta de ahorros', CuentaCorriente: 'Cuenta corriente', TarjetaCredito: 'Tarjeta de crédito' };
const NEGATIVE_TYPES = new Set(['RETIRO', 'TRANSFERENCIA_SALIENTE', 'PAGO_TARJETA', 'COMPRA_TARJETA']);
let storage;
let state;
let auth;
let bank;
let currentClientId = null;
let toastTimer = null;

function money(value) { return COP.format(Number(value) || 0); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function labelTipo(product) { return TYPE_NAMES[product.tipo] || product.tipo; }
function productIcon(product) {
  if (product instanceof CuentaAhorros) return '<span class="product-badge">◫</span>';
  if (product instanceof CuentaCorriente) return '<span class="product-badge current">⇄</span>';
  return '<span class="product-badge credit">▱</span>';
}
function ownerOf(product) { return auth.obtenerClientePorId(product.clienteId); }
function currentClient() { return auth?.obtenerClientePorId(currentClientId) || null; }
function currentProducts() { return bank.productosDeCliente(currentClientId); }
function currentAccounts() { return bank.cuentasDeCliente(currentClientId); }
function currentCards() { return bank.tarjetasDeCliente(currentClientId); }
function setFeedback(id, message, type = 'info') {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = message;
  node.className = `form-feedback show ${type}`;
}
function clearFeedback(id) {
  const node = document.getElementById(id);
  if (node) { node.textContent = ''; node.className = 'form-feedback'; }
}
function showToast(message, type = 'info') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3800);
}
function showGlobalNotice(message, type = 'info') {
  const notice = $('#globalNotice');
  notice.textContent = message;
  notice.className = `global-notice show ${type}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => { notice.className = 'global-notice'; }, 5200);
}
function labelRole(role) { return role === 'administrador' ? 'Administrador' : 'Cliente'; }
function formatDate(value) {
  try { return DATE.format(new Date(value)); } catch { return String(value || '—'); }
}
function setPublicScreen(name) {
  $('#publicApp').hidden = false;
  $('#publicHeader').hidden = false;
  $('#appShell').hidden = true;
  $$('[data-screen-view]').forEach(section => section.classList.toggle('active', section.dataset.screenView === name));
  $$('.public-link').forEach(button => button.classList.toggle('active', button.dataset.screen === name));
  $('.public-nav')?.classList.remove('open');
  $('#publicMenuToggle')?.setAttribute('aria-expanded', 'false');
  if (name === 'login') $('#loginUsername')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setPanel(name) {
  const client = currentClient();
  if (!client) { setPublicScreen('login'); return; }
  if (name === 'admin' && client.rol !== 'administrador') name = 'overview';
  $$('.app-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panelView === name));
  $$('.side-link').forEach(button => button.classList.toggle('active', button.dataset.panel === name));
  $('#panelTitle').textContent = PANEL_TITLES[name] || 'Mi Plata';
  $('#appSidebar').classList.remove('open');
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function enterApp(client) {
  currentClientId = client.id;
  try { sessionStorage.setItem('mi-plata:session', client.id); } catch { /* La sesión solo vive en memoria si sessionStorage está deshabilitado. */ }
  $('#publicApp').hidden = true;
  $('#publicHeader').hidden = true;
  $('#appShell').hidden = false;
  $('#adminNavItem').hidden = client.rol !== 'administrador';
  $('#topbarName').textContent = client.nombreCompleto;
  $('#topbarRole').textContent = labelRole(client.rol);
  $('#topbarAvatar').textContent = client.nombreCompleto.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  $('#welcomeName').textContent = client.nombreCompleto.split(' ')[0];
  setPanel('overview');
}
function logout() {
  currentClientId = null;
  try { sessionStorage.removeItem('mi-plata:session'); } catch { /* no-op */ }
  $('#loginForm').reset();
  clearFeedback('loginFeedback');
  $('#loginAttempts').textContent = '0 / 3';
  $('#loginAttemptBar').style.width = '0%';
  setPublicScreen('login');
}
function fillSelect(id, options, placeholder = 'Selecciona una opción', selectedValue = undefined) {
  const select = document.getElementById(id);
  if (!select) return;
  const previous = selectedValue ?? select.value;
  select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + options.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('');
  if (options.some(option => String(option.value) === String(previous))) select.value = previous;
}
function accountOptions(accounts = currentAccounts()) {
  return accounts.map(account => ({ value: account.id, label: `${labelTipo(account)} · ${account.alias} · disponible ${money(account.consultarDisponible())}` }));
}
function cardOptions(cards = currentCards()) {
  return cards.map(card => ({ value: card.id, label: `${card.alias} · cupo ${money(card.cupoDisponible)}` }));
}
function renderSelects() {
  const accounts = currentAccounts();
  fillSelect('balanceProduct', accountOptions(accounts), 'Elige una cuenta');
  fillSelect('depositProduct', accountOptions(accounts), 'Elige una cuenta');
  fillSelect('withdrawProduct', accountOptions(accounts), 'Elige una cuenta');
  fillSelect('transferOrigin', accountOptions(accounts), 'Cuenta de origen');
  renderTransferDestinations();
  fillSelect('paymentSource', accountOptions(accounts), 'Cuenta desde la que se paga');
  fillSelect('purchaseCard', cardOptions(), 'Selecciona la tarjeta');
  fillSelect('paymentCard', cardOptions(), 'Selecciona la tarjeta');
  fillSelect('movementFilter', [{ value: 'all', label: 'Todos mis productos' }, ...currentProducts().map(p => ({ value: p.id, label: `${labelTipo(p)} · ${p.alias}` }))], 'Todos mis productos', $('#movementFilter')?.value || 'all');
  fillSelect('adminProductOwner', auth.listarUsuarios().filter(c => c.rol === 'cliente' && c.activo).map(c => ({ value: c.id, label: `${c.nombreCompleto} (@${c.nombreUsuario})` })), 'Selecciona el titular');
  const allProductOptions = state.productos.map(p => {
    const owner = ownerOf(p);
    return { value: p.id, label: `${owner?.nombreUsuario || 'Sin titular'} · ${labelTipo(p)} · ${p.alias} · ${p instanceof Cuenta ? money(p.consultarSaldo()) : `cupo ${money(p.cupoTotal)}`}` };
  });
  fillSelect('adminExistingProduct', allProductOptions, 'Selecciona un producto');
  renderPaymentPurchaseOptions();
  updateWithdrawRule();
  updateBalanceResult();
  updatePurchasePreview();
  updatePaymentPreview();
}
function renderTransferDestinations() {
  const origenId = $('#transferOrigin')?.value;
  const currentUser = currentClient();
  const destinos = bank.todasLasCuentas().filter(account => account.id !== origenId && ownerOf(account)?.activo).map(account => {
    const owner = ownerOf(account);
    return { value: account.id, label: `${owner?.nombreCompleto || 'Cliente'} (@${owner?.nombreUsuario || 'usuario'}) · ${labelTipo(account)} · ${account.alias}` };
  });
  fillSelect('transferDestination', destinos, 'Selecciona cuenta destino');
  if (currentUser && destinos.length === 0) $('#transferDestination').innerHTML = '<option value="">No hay otra cuenta disponible</option>';
}
function renderPaymentPurchaseOptions() {
  const cardId = $('#paymentCard')?.value;
  const cards = currentCards().filter(card => !cardId || card.id === cardId);
  const purchases = cards.flatMap(card => card.compras.filter(purchase => purchase.activa && purchase.cuotasPagadas < purchase.cuotasTotales).map(purchase => {
    let next;
    try { next = card.siguienteCuota(purchase.id); } catch { next = { valor: 0 }; }
    return { value: `${card.id}::${purchase.id}`, label: `${purchase.descripcion} · cuota ${next.numeroCuota}/${next.cuotasTotales} · ${money(next.valor)}` };
  }));
  fillSelect('paymentPurchase', purchases, purchases.length ? 'Selecciona una compra' : 'No hay cuotas pendientes');
}
function updateBalanceResult() {
  const result = $('#balanceResult');
  if (!result || !bank) return;
  const product = bank.obtenerProducto($('#balanceProduct')?.value);
  if (!(product instanceof Cuenta)) { result.innerHTML = '<span>Saldo actual</span><b>Selecciona una cuenta</b>'; return; }
  const disponible = product.consultarDisponible();
  result.innerHTML = `<span>${escapeHtml(labelTipo(product))} · ${escapeHtml(product.alias)}</span><b>${money(product.consultarSaldo())}</b><small>Disponible permitido: ${money(disponible)}</small>`;
}

function updateWithdrawRule() {
  const product = bank?.obtenerProducto($('#withdrawProduct')?.value);
  const box = $('#withdrawRule');
  if (!box) return;
  if (product instanceof CuentaAhorros) box.innerHTML = `Saldo: <b>${money(product.consultarSaldo())}</b>. Al retirar se liquida el interés acumulado al 1,5 % mensual pro rata sobre períodos de 30 días, conforme al supuesto académico.`;
  else if (product instanceof CuentaCorriente) box.innerHTML = `Saldo: <b>${money(product.consultarSaldo())}</b> · Disponible máximo estimado: <b>${money(product.consultarDisponible())}</b>, con sobregiro del 20 % del saldo positivo.`;
  else box.textContent = 'Selecciona una cuenta para consultar las validaciones.';
}
function updatePurchasePreview() {
  const preview = $('#purchasePreview');
  if (!preview) return;
  const valor = Number($('#purchaseAmount')?.value);
  const cuotas = Number($('#purchaseInstallments')?.value);
  if (!Number.isSafeInteger(valor) || valor <= 0 || !Number.isSafeInteger(cuotas) || cuotas < 1) {
    preview.textContent = 'Ingresa un monto positivo y un número entero de cuotas mayor que cero para estimar el pago mensual.';
    return;
  }
  try {
    const tasa = determinarTasaCuotas(cuotas);
    const cuota = calcularCuotaMensual(valor, tasa, cuotas);
    const tasaTxt = (tasa * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 });
    const avisoAcademico = cuotas >= 7 ? '<br><small>Se aplica la tasa de 2,3 % mensual indicada en la guía académica. No es una oferta de crédito real ni una validación de tasa para contratación.</small>' : '';
    preview.innerHTML = `Tasa mensual según la guía: <b>${tasaTxt} %</b>. Cuota mensual estimada: <b>${money(cuota)}</b>. Total estimado: <b>${money(cuota * cuotas)}</b>.${avisoAcademico}`;
  } catch (error) { preview.textContent = error.message; }
}
function updatePaymentPreview() {
  const value = $('#paymentPurchase')?.value;
  const preview = $('#paymentPreview');
  if (!preview) return;
  if (!value) { preview.textContent = 'Selecciona una compra con cuotas pendientes para consultar el próximo pago.'; return; }
  const [cardId, purchaseId] = value.split('::');
  const card = bank.obtenerProducto(cardId);
  try {
    const cuota = card.siguienteCuota(purchaseId);
    preview.innerHTML = `Próxima cuota: <b>${money(cuota.valor)}</b> · Cuota ${cuota.numeroCuota} de ${cuota.cuotasTotales}. Incluye interés estimado de ${money(cuota.interes)}.`;
  } catch (error) { preview.textContent = error.message; }
}
function renderProductCard(product, { admin = false } = {}) {
  const owner = ownerOf(product);
  const isCuenta = product instanceof Cuenta;
  const sub = isCuenta ? `Disponible: ${money(product.consultarDisponible())}` : `Deuda: ${money(product.deudaActual)}`;
  const valorPrincipal = isCuenta ? money(product.consultarSaldo()) : money(product.cupoDisponible);
  const pieLabel = isCuenta ? 'Saldo actual' : 'Cupo total';
  const pieValue = isCuenta ? money(product.consultarSaldo()) : money(product.cupoTotal);
  const icon = product instanceof CuentaAhorros ? '◫' : product instanceof CuentaCorriente ? '⇄' : '▱';
  const cls = product instanceof CuentaAhorros ? '' : product instanceof CuentaCorriente ? 'current' : 'credit';
  const actionButtons = admin
    ? `<button type="button" class="mini-action" data-action="select-admin-product" data-product-id="${escapeHtml(product.id)}">Gestionar</button>`
    : isCuenta
      ? `<button type="button" class="mini-action" data-action="go-deposit" data-product-id="${escapeHtml(product.id)}">Consignar</button><button type="button" class="mini-action" data-action="go-withdraw" data-product-id="${escapeHtml(product.id)}">Retirar</button>`
      : `<button type="button" class="mini-action" data-action="go-card" data-product-id="${escapeHtml(product.id)}">Ver tarjeta</button>`;
  return `<article class="account-product-card">
    <div class="card-product-top"><span class="product-badge ${cls}">${icon}</span><span class="status-chip">${admin ? escapeHtml(owner?.nombreUsuario || 'usuario') : 'ACTIVO'}</span></div>
    <h3>${escapeHtml(labelTipo(product))}</h3><div class="product-subtitle">${escapeHtml(product.alias)}${admin ? ` · ${escapeHtml(owner?.nombreCompleto || '')}` : ''}</div>
    <div class="product-balance">${valorPrincipal} <small>${isCuenta ? 'COP' : 'cupo disp.'}</small></div>
    <div class="product-card-footer"><span>${pieLabel}</span><b>${pieValue}</b></div>
    <div class="product-card-footer"><span>${isCuenta ? 'Saldo disponible' : 'Deuda actual'}</span><b>${sub}</b></div>
    <div class="product-actions">${actionButtons}</div>
  </article>`;
}
function movementValueClass(movement) {
  if (['CONSIGNACION', 'TRANSFERENCIA_ENTRANTE', 'INTERES_AHORRO', 'PAGO_CUOTA'].includes(movement.tipo)) return 'positive';
  if (NEGATIVE_TYPES.has(movement.tipo)) return 'negative';
  return 'neutral';
}
function movementValueDisplay(movement) {
  const sign = NEGATIVE_TYPES.has(movement.tipo) ? '−' : ['CONSIGNACION', 'TRANSFERENCIA_ENTRANTE', 'INTERES_AHORRO', 'PAGO_CUOTA'].includes(movement.tipo) ? '+' : '';
  return `${sign}${money(movement.valor)}`;
}
function renderMovementTable(targetId, movements, { showProductFilter = true } = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;
  if (!movements.length) {
    target.innerHTML = '<div class="empty-state"><b>Aún no hay movimientos.</b>Cuando realices una operación válida, aparecerá en este historial.</div>';
    return;
  }
  target.innerHTML = `<table class="movement-table"><thead><tr><th>Fecha y hora</th><th>Movimiento</th>${showProductFilter ? '<th>Producto</th>' : ''}<th>Valor</th></tr></thead><tbody>${movements.map(m => `<tr>
    <td>${escapeHtml(formatDate(m.fecha))}</td><td><b>${escapeHtml(m.descripcion)}</b><small><span class="movement-type">${escapeHtml(m.tipo.replaceAll('_', ' '))}</span></small></td>
    ${showProductFilter ? `<td>${escapeHtml(labelTipo({ tipo: m.productoTipo }))}<small>${escapeHtml(m.productoAlias)}</small></td>` : ''}
    <td class="movement-value ${movementValueClass(m)}">${escapeHtml(movementValueDisplay(m))}</td></tr>`).join('')}</tbody></table>`;
}
function renderOverview() {
  const products = currentProducts();
  const accounts = products.filter(p => p instanceof Cuenta);
  const cards = products.filter(p => p instanceof TarjetaCredito);
  $('#totalBalance').textContent = money(accounts.reduce((sum, account) => sum + account.consultarSaldo(), 0));
  $('#productsCount').textContent = String(products.length);
  $('#creditAvailable').textContent = money(cards.reduce((sum, card) => sum + card.cupoDisponible, 0));
  $('#overviewProducts').innerHTML = products.length ? products.slice(0, 3).map(p => renderProductCard(p)).join('') : '<div class="empty-state"><b>No tienes productos asignados.</b>Contacta al administrador de la demostración para crear los productos iniciales.</div>';
  renderMovementTable('overviewMovements', bank.movimientosDeCliente(currentClientId).slice(0, 5));
}
function renderProducts() {
  const products = currentProducts();
  $('#allProducts').innerHTML = products.length ? products.map(p => renderProductCard(p)).join('') : '<div class="empty-state"><b>No tienes productos asignados.</b>El administrador puede asignarlos en el panel de demostración.</div>';
}
function renderMovements() {
  const filter = $('#movementFilter')?.value || 'all';
  let movements = bank.movimientosDeCliente(currentClientId);
  if (filter !== 'all') movements = movements.filter(m => m.productoId === filter);
  renderMovementTable('movementTable', movements);
}
function renderCredit() {
  const cards = currentCards();
  if (!cards.length) $('#creditSummary').innerHTML = '<div class="empty-state">No tienes tarjeta asignada. Solicita al administrador de demostración que cree una.</div>';
  else $('#creditSummary').innerHTML = cards.map(card => `<article class="credit-summary"><h3>${escapeHtml(card.alias)}</h3><div class="credit-numbers"><div class="credit-number-row"><span>Cupo total</span><b>${money(card.cupoTotal)}</b></div><div class="credit-number-row"><span>Deuda pendiente</span><b>${money(card.deudaActual)}</b></div><div class="credit-number-row"><span>Cupo disponible</span><b>${money(card.cupoDisponible)}</b></div></div></article>`).join('');
  const purchases = cards.flatMap(card => card.compras.map(compra => ({ ...compra, cardId: card.id, cardAlias: card.alias }))).sort((a, b) => b.fecha.localeCompare(a.fecha));
  $('#creditPurchases').innerHTML = purchases.length ? purchases.map(p => `<article class="purchase-item"><div><b>${escapeHtml(p.descripcion)}</b><small>${escapeHtml(p.cardAlias)} · ${escapeHtml(formatDate(p.fecha))} · ${p.cuotasPagadas}/${p.cuotasTotales} cuotas pagadas</small><small>Tasa mensual de la guía: ${(p.tasaMensual * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })}%</small></div><div class="purchase-amount"><b>${money(p.cuotaMensual)}</b><small>pago mensual</small><small>pendiente: ${money(p.capitalPendiente)}</small></div><span class="purchase-state">${p.activa ? 'CUOTAS PENDIENTES' : 'PAGADA'}</span></article>`).join('') : '<div class="empty-state"><b>No has registrado compras.</b>Usa el formulario para crear una compra de demostración con cuotas.</div>';
  renderSelects();
}
function renderProfile() {
  const client = currentClient();
  if (!client) return;
  $('#profileIdentification').value = client.identificacion;
  $('#profileName').value = client.nombreCompleto;
  $('#profilePhone').value = client.celular;
  $('#profileUsername').value = client.nombreUsuario;
  $('#passwordUsername').value = client.nombreUsuario;
}
function renderAdmin() {
  const users = auth.listarUsuarios();
  const totalProducts = state.productos.length;
  const blocked = state.credenciales.filter(c => c.bloqueado).length;
  $('#adminStats').innerHTML = `<article class="admin-stat"><span>Usuarios registrados</span><b>${users.length}</b></article><article class="admin-stat"><span>Productos de prueba</span><b>${totalProducts}</b></article><article class="admin-stat"><span>Usuarios bloqueados</span><b>${blocked}</b></article>`;
  $('#adminUsersTable').innerHTML = `<table class="movement-table"><thead><tr><th>Usuario</th><th>Rol / estado</th><th>Acceso</th><th>Productos</th><th>Acciones</th></tr></thead><tbody>${users.map(user => {
    const cred = auth.obtenerCredencialPorCliente(user.id);
    const count = bank.productosDeCliente(user.id).length;
    const initials = user.nombreCompleto.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    const actions = `<div class="admin-action-group"><button class="table-action" data-action="edit-user" data-user-id="${escapeHtml(user.id)}">Editar</button>
      ${user.activo ? `<button class="table-action" data-action="toggle-user" data-user-id="${escapeHtml(user.id)}" data-active="false">Desactivar</button>` : `<button class="table-action good" data-action="toggle-user" data-user-id="${escapeHtml(user.id)}" data-active="true">Activar</button>`}
      ${cred?.bloqueado ? `<button class="table-action good" data-action="unlock-user" data-user-id="${escapeHtml(user.id)}">Desbloquear</button>` : ''}
      ${user.rol !== 'administrador' ? `<button class="table-action danger" data-action="delete-user" data-user-id="${escapeHtml(user.id)}">Eliminar</button>` : ''}</div>`;
    return `<tr><td><div class="admin-user-name"><span class="user-initial">${escapeHtml(initials)}</span><span><b>${escapeHtml(user.nombreCompleto)}</b><small>@${escapeHtml(user.nombreUsuario)} · ID ${escapeHtml(user.identificacion)}</small></span></div></td><td>${escapeHtml(labelRole(user.rol))}<small>${user.activo ? 'Activo' : 'Desactivado'}</small></td><td>${cred?.bloqueado ? '<span class="movement-type">BLOQUEADO</span>' : `<span class="muted-text">${cred?.intentosFallidos || 0}/3 fallos</span>`}</td><td>${count}</td><td>${actions}</td></tr>`;
  }).join('')}</tbody></table>`;
  fillSelect('adminProductOwner', users.filter(c => c.activo && c.rol === 'cliente').map(c => ({ value: c.id, label: `${c.nombreCompleto} (@${c.nombreUsuario})` })), 'Selecciona el titular', $('#adminProductOwner')?.value);
  const allProductOptions = state.productos.map(p => {
    const owner = ownerOf(p);
    return { value: p.id, label: `${owner?.nombreUsuario || 'usuario'} · ${labelTipo(p)} · ${p.alias} · ${p instanceof Cuenta ? money(p.consultarSaldo()) : `cupo ${money(p.cupoTotal)}`}` };
  });
  fillSelect('adminExistingProduct', allProductOptions, 'Selecciona un producto', $('#adminExistingProduct')?.value);
}
function renderAll() {
  if (!currentClient()) return;
  renderSelects();
  renderOverview();
  renderProducts();
  renderMovements();
  renderCredit();
  renderProfile();
  if (currentClient().rol === 'administrador') renderAdmin();
}
function fillLoginCounter() {
  const username = $('#loginUsername').value.trim().toLowerCase();
  const client = auth.listarUsuarios().find(item => item.nombreUsuario.toLowerCase() === username);
  const credential = client && auth.obtenerCredencialPorCliente(client.id);
  const count = Number(credential?.intentosFallidos || 0);
  $('#loginAttempts').textContent = `${count} / 3`;
  $('#loginAttemptBar').style.width = `${(count / 3) * 100}%`;
}
function getFormData(form, mapping) {
  const data = new FormData(form);
  return Object.fromEntries(Object.entries(mapping).map(([key, selector]) => [key, data.get(selector) ?? '']));
}
function bindNavigation() {
  document.addEventListener('click', event => {
    const publicButton = event.target.closest('[data-screen]');
    if (publicButton) {
      event.preventDefault();
      setPublicScreen(publicButton.dataset.screen);
      return;
    }
    const anchor = event.target.closest('[data-anchor]');
    if (anchor) {
      event.preventDefault();
      setPublicScreen('home');
      const target = document.getElementById(anchor.dataset.anchor);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 50);
      return;
    }
    const panelButton = event.target.closest('[data-panel]');
    if (panelButton && !panelButton.classList.contains('app-panel')) {
      event.preventDefault();
      setPanel(panelButton.dataset.panel);
      return;
    }
    const action = event.target.closest('[data-action]');
    if (action) handleAction(action).catch(error => showGlobalNotice(error.message, 'error'));
  });
  $('#publicMenuToggle').addEventListener('click', () => {
    const open = $('.public-nav').classList.toggle('open');
    $('#publicMenuToggle').setAttribute('aria-expanded', String(open));
  });
  $('#sidebarToggle').addEventListener('click', () => $('#appSidebar').classList.toggle('open'));
  $('#logoutButton').addEventListener('click', logout);
}
async function handleAction(button) {
  const action = button.dataset.action;
  if (action === 'go-deposit' || action === 'go-withdraw') {
    setPanel(action === 'go-deposit' ? 'deposit' : 'withdraw');
    const select = $(action === 'go-deposit' ? '#depositProduct' : '#withdrawProduct');
    select.value = button.dataset.productId;
    updateWithdrawRule();
    $(action === 'go-deposit' ? '#depositAmount' : '#withdrawAmount').focus();
  } else if (action === 'go-card') setPanel('card');
  else if (action === 'select-admin-product') {
    setPanel('admin');
    $('#adminExistingProduct').value = button.dataset.productId;
    updateAdminAdjustmentValue();
    $('#adminExistingProduct').focus();
  } else if (action === 'edit-user') {
    const user = auth.obtenerClientePorId(button.dataset.userId);
    if (!user) return;
    $('#adminEditId').value = user.id;
    $('#adminEditIdentification').value = user.identificacion;
    $('#adminEditName').value = user.nombreCompleto;
    $('#adminEditPhone').value = user.celular;
    $('#adminEditUsername').value = user.nombreUsuario;
    $('#adminEditPassword').value = '';
    clearFeedback('adminEditFeedback');
    $('#adminEditName').focus();
    $('#adminEditUserForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (action === 'toggle-user') {
    const id = button.dataset.userId;
    if (id === currentClientId && button.dataset.active === 'false') throw new Error('No puedes desactivar el usuario con el que has iniciado sesión.');
    const activate = button.dataset.active === 'true';
    if (!activate && !confirm('¿Desactivar este usuario? No podrá iniciar sesión hasta que un administrador lo reactive.')) return;
    auth.activarUsuario(id, activate);
    renderAll(); showToast(activate ? 'Usuario activado.' : 'Usuario desactivado.', 'success');
  } else if (action === 'unlock-user') {
    auth.desbloquearUsuario(button.dataset.userId);
    renderAdmin(); showToast('Usuario desbloqueado y contador reiniciado.', 'success');
  } else if (action === 'delete-user') {
    const user = auth.obtenerClientePorId(button.dataset.userId);
    if (!user) return;
    if (!confirm(`¿Eliminar a ${user.nombreCompleto} y sus productos/movimientos locales? Esta acción no se puede deshacer.`)) return;
    auth.eliminarUsuario(user.id, currentClientId);
    renderAll(); showToast('Usuario y productos locales eliminados.', 'success');
  }
}
function updateAdminAdjustmentValue() {
  const product = bank.obtenerProducto($('#adminExistingProduct').value);
  if (!product) { $('#adminAdjustValue').value = ''; return; }
  $('#adminAdjustValue').value = product instanceof Cuenta ? product.consultarSaldo() : product.cupoTotal;
}
function bindForms() {
  $('#registerForm').addEventListener('submit', async event => {
    event.preventDefault(); clearFeedback('registerFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const data = getFormData(event.currentTarget, { identificacion: 'identificacion', nombreCompleto: 'nombreCompleto', celular: 'celular', nombreUsuario: 'nombreUsuario', contrasena: 'contrasena', confirmarContrasena: 'confirmarContrasena' });
      const cliente = await auth.registrar(data);
      bank.asegurarProductosIniciales(cliente.id);
      event.currentTarget.reset();
      setFeedback('registerFeedback', 'Usuario creado correctamente. Se asignaron productos con saldo/cupo cero; un administrador puede ajustar valores de demostración.', 'success');
      showToast('Registro completado. Ya puedes iniciar sesión.', 'success');
      $('#loginUsername').value = cliente.nombreUsuario;
      setTimeout(() => setPublicScreen('login'), 1000);
    } catch (error) { setFeedback('registerFeedback', error.message, 'error'); }
  });

  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault(); clearFeedback('loginFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const client = await auth.iniciarSesion($('#loginUsername').value, $('#loginPassword').value);
      $('#loginForm').reset();
      $('#loginAttempts').textContent = '0 / 3';
      $('#loginAttemptBar').style.width = '0%';
      enterApp(client);
      showToast(`Bienvenido a Mi Plata, ${client.nombreCompleto.split(' ')[0]}.`, 'success');
    } catch (error) {
      fillLoginCounter();
      setFeedback('loginFeedback', error.message, 'error');
    }
  });

  $('#loginUsername').addEventListener('input', fillLoginCounter);
  $$('.credential-item').forEach(button => button.addEventListener('click', () => {
    const [username, password] = button.dataset.fillLogin.split('|');
    $('#loginUsername').value = username; $('#loginPassword').value = password; fillLoginCounter();
    setFeedback('loginFeedback', `Credenciales de demostración para ${username} completadas.`, 'info');
  }));

  $('#resetDemoButton').addEventListener('click', async () => {
    if (!confirm('Se borrarán usuarios, productos y movimientos guardados en este navegador y se restaurarán los datos iniciales. ¿Continuar?')) return;
    try {
      storage.limpiar();
      state = await crearDatosDemostracion();
      storage.guardar(state);
      auth = new AuthService(state, storage); bank = new BancoService(state, storage);
      currentClientId = null;
      try { sessionStorage.removeItem('mi-plata:session'); } catch { /* no-op */ }
      $('#loginForm').reset(); $('#loginAttempts').textContent = '0 / 3'; $('#loginAttemptBar').style.width = '0%';
      setFeedback('loginFeedback', 'Datos de demostración restaurados. Contraseñas iniciales: admin/Admin123!, cliente1/Cliente123!, cliente2/Cliente123!.', 'success');
    } catch (error) { setFeedback('loginFeedback', error.message, 'error'); }
  });

  $('#depositForm').addEventListener('submit', event => {
    event.preventDefault(); clearFeedback('depositFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const balance = bank.consignar(currentClientId, $('#depositProduct').value, $('#depositAmount').value);
      $('#depositAmount').value = ''; renderAll();
      setFeedback('depositFeedback', `Consignación exitosa. Nuevo saldo: ${money(balance)}.`, 'success'); showToast('Consignación registrada.', 'success');
    } catch (error) { setFeedback('depositFeedback', error.message, 'error'); }
  });

  $('#withdrawProduct').addEventListener('change', updateWithdrawRule);
  $('#withdrawForm').addEventListener('submit', event => {
    event.preventDefault(); clearFeedback('withdrawFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const productId = $('#withdrawProduct').value;
      const oldCount = bank.obtenerProducto(productId).obtenerMovimientos().length;
      const balance = bank.retirar(currentClientId, productId, $('#withdrawAmount').value);
      const movements = bank.obtenerProducto(productId).obtenerMovimientos();
      const interest = movements.slice(0, movements.length - oldCount).find(m => m.tipo === 'INTERES_AHORRO')?.valor || 0;
      $('#withdrawAmount').value = ''; renderAll(); updateWithdrawRule();
      setFeedback('withdrawFeedback', `Retiro exitoso. Nuevo saldo: ${money(balance)}.${interest ? ` Interés liquidado en esta operación: ${money(interest)}.` : ''}`, 'success'); showToast('Retiro registrado.', 'success');
    } catch (error) { setFeedback('withdrawFeedback', error.message, 'error'); }
  });

  $('#transferOrigin').addEventListener('change', renderTransferDestinations);
  $('#transferForm').addEventListener('submit', event => {
    event.preventDefault(); clearFeedback('transferFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const result = bank.transferir(currentClientId, $('#transferOrigin').value, $('#transferDestination').value, $('#transferAmount').value);
      $('#transferAmount').value = ''; renderAll();
      setFeedback('transferFeedback', `Transferencia realizada por ${money(result.monto)} a ${result.destinoUsuario}. Se registró la operación en las dos cuentas.`, 'success'); showToast('Transferencia completada.', 'success');
    } catch (error) { setFeedback('transferFeedback', error.message, 'error'); }
  });

  $('#purchaseAmount').addEventListener('input', updatePurchasePreview);
  $('#purchaseInstallments').addEventListener('input', updatePurchasePreview);
  $('#purchaseForm').addEventListener('submit', event => {
    event.preventDefault(); clearFeedback('purchaseFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const purchase = bank.comprarConTarjeta(currentClientId, $('#purchaseCard').value, $('#purchaseAmount').value, $('#purchaseInstallments').value, $('#purchaseDescription').value);
      event.currentTarget.reset(); $('#purchaseInstallments').value = '3'; renderAll();
      setFeedback('purchaseFeedback', `Compra registrada. Pago mensual estimado: ${money(purchase.cuotaMensual)} durante ${purchase.cuotasTotales} cuotas. Tasa mensual aplicada según la guía: ${(purchase.tasaMensual * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })}%.`, 'success');
      showToast('Compra a cuotas registrada.', 'success');
    } catch (error) { setFeedback('purchaseFeedback', error.message, 'error'); }
  });

  $('#paymentCard').addEventListener('change', () => { renderPaymentPurchaseOptions(); updatePaymentPreview(); });
  $('#paymentPurchase').addEventListener('change', updatePaymentPreview);
  $('#payInstallmentForm').addEventListener('submit', event => {
    event.preventDefault(); clearFeedback('paymentFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const [cardId, purchaseId] = $('#paymentPurchase').value.split('::');
      const cuota = bank.pagarCuota(currentClientId, $('#paymentSource').value, cardId, purchaseId);
      renderAll();
      setFeedback('paymentFeedback', `Pago aplicado por ${money(cuota.valor)}. Interés: ${money(cuota.interes)} · Abono a capital: ${money(cuota.capital)}.`, 'success');
      showToast('Cuota de tarjeta pagada.', 'success');
    } catch (error) { setFeedback('paymentFeedback', error.message, 'error'); }
  });

  $('#balanceProduct').addEventListener('change', updateBalanceResult);
  $('#refreshBalanceButton').addEventListener('click', () => { updateBalanceResult(); showToast('Saldo actualizado desde los datos locales.', 'success'); });

  $('#movementFilter').addEventListener('change', renderMovements);

  $('#profileForm').addEventListener('submit', event => {
    event.preventDefault(); clearFeedback('profileFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const client = auth.actualizarUsuario(currentClientId, {
        identificacion: $('#profileIdentification').value, nombreCompleto: $('#profileName').value,
        celular: $('#profilePhone').value, nombreUsuario: $('#profileUsername').value
      });
      $('#topbarName').textContent = client.nombreCompleto;
      $('#topbarRole').textContent = labelRole(client.rol);
      $('#topbarAvatar').textContent = client.nombreCompleto.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
      $('#welcomeName').textContent = client.nombreCompleto.split(' ')[0];
      $('#passwordUsername').value = client.nombreUsuario;
      renderAll(); setFeedback('profileFeedback', 'Perfil actualizado correctamente.', 'success'); showToast('Perfil actualizado.', 'success');
    } catch (error) { setFeedback('profileFeedback', error.message, 'error'); }
  });

  $('#passwordForm').addEventListener('submit', async event => {
    event.preventDefault(); clearFeedback('passwordFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      await auth.cambiarContrasena(currentClientId, $('#passwordUsername').value, $('#passwordCurrent').value, $('#passwordNew').value, $('#passwordConfirm').value);
      event.currentTarget.reset(); $('#passwordUsername').value = currentClient()?.nombreUsuario || '';
      setFeedback('passwordFeedback', 'Contraseña cambiada. La nueva credencial se guardó derivada mediante PBKDF2 en el almacenamiento local.', 'success'); showToast('Contraseña actualizada.', 'success');
    } catch (error) { setFeedback('passwordFeedback', error.message, 'error'); }
  });

  $('#adminCreateUserForm').addEventListener('submit', async event => {
    event.preventDefault(); clearFeedback('adminCreateFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const client = await auth.crearUsuarioAdministrativo({ identificacion: $('#adminNewIdentification').value, nombreCompleto: $('#adminNewName').value,
        celular: $('#adminNewPhone').value, nombreUsuario: $('#adminNewUsername').value, contrasena: $('#adminNewPassword').value, confirmarContrasena: $('#adminNewConfirm').value });
      bank.asegurarProductosIniciales(client.id); event.currentTarget.reset(); renderAll();
      setFeedback('adminCreateFeedback', `Cliente ${client.nombreUsuario} creado con productos de saldo/cupo cero. Puedes asignar valores demostrativos desde este panel.`, 'success'); showToast('Cliente creado.', 'success');
    } catch (error) { setFeedback('adminCreateFeedback', error.message, 'error'); }
  });

  $('#adminEditUserForm').addEventListener('submit', async event => {
    event.preventDefault(); clearFeedback('adminEditFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const id = $('#adminEditId').value;
      if (!id) throw new Error('Selecciona primero un usuario desde la tabla.');
      const updated = auth.actualizarUsuario(id, { identificacion: $('#adminEditIdentification').value, nombreCompleto: $('#adminEditName').value,
        celular: $('#adminEditPhone').value, nombreUsuario: $('#adminEditUsername').value });
      if ($('#adminEditPassword').value) await auth.restablecerContrasenaAdministrativa(id, $('#adminEditPassword').value);
      if (id === currentClientId) {
        $('#topbarName').textContent = updated.nombreCompleto; $('#topbarAvatar').textContent = updated.nombreCompleto.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
        $('#welcomeName').textContent = updated.nombreCompleto.split(' ')[0];
      }
      $('#adminEditPassword').value = ''; renderAll(); setFeedback('adminEditFeedback', 'Datos del usuario guardados correctamente.', 'success'); showToast('Usuario actualizado.', 'success');
    } catch (error) { setFeedback('adminEditFeedback', error.message, 'error'); }
  });

  $('#adminCreateProductForm').addEventListener('submit', event => {
    event.preventDefault(); clearFeedback('adminCreateProductFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const product = bank.crearProductoAdministrativo($('#adminProductOwner').value, $('#adminProductType').value, $('#adminProductAlias').value, $('#adminProductValue').value);
      event.currentTarget.reset(); $('#adminProductValue').value = '0'; renderAll();
      setFeedback('adminCreateProductFeedback', `${labelTipo(product)} creado con valores de demostración.`, 'success'); showToast('Producto creado.', 'success');
    } catch (error) { setFeedback('adminCreateProductFeedback', error.message, 'error'); }
  });

  $('#adminExistingProduct').addEventListener('change', updateAdminAdjustmentValue);
  $('#adminAdjustProductForm').addEventListener('submit', event => {
    event.preventDefault(); clearFeedback('adminAdjustFeedback');
    if (!event.currentTarget.reportValidity()) return;
    try {
      const product = bank.ajustarProductoAdministrativo($('#adminExistingProduct').value, $('#adminAdjustValue').value);
      renderAll(); updateAdminAdjustmentValue(); setFeedback('adminAdjustFeedback', `${labelTipo(product)} actualizado. Este ajuste es exclusivamente para preparar datos de prueba.`, 'success'); showToast('Valor demostrativo ajustado.', 'success');
    } catch (error) { setFeedback('adminAdjustFeedback', error.message, 'error'); }
  });

  $('#adminDeleteProductButton').addEventListener('click', () => {
    const product = bank.obtenerProducto($('#adminExistingProduct').value);
    if (!product) { setFeedback('adminAdjustFeedback', 'Selecciona un producto para eliminar.', 'error'); return; }
    if (!confirm(`¿Eliminar ${product.alias}? Se borrarán sus movimientos locales. Esta acción no se puede deshacer.`)) return;
    try { bank.eliminarProductoAdministrativo(product.id); renderAll(); setFeedback('adminAdjustFeedback', 'Producto eliminado de la demostración.', 'success'); }
    catch (error) { setFeedback('adminAdjustFeedback', error.message, 'error'); }
  });
}

async function initialize() {
  storage = new StorageService();
  try {
    state = storage.cargar();
    if (!state) {
      state = await crearDatosDemostracion();
      storage.guardar(state);
    }
    auth = new AuthService(state, storage);
    bank = new BancoService(state, storage);
    bindNavigation();
    bindForms();
    const savedSession = (() => { try { return sessionStorage.getItem('mi-plata:session'); } catch { return null; } })();
    const client = savedSession && auth.obtenerClientePorId(savedSession);
    if (client?.activo) enterApp(client);
    else setPublicScreen('home');
  } catch (error) {
    console.error(error);
    $('#publicApp').innerHTML = `<section class="wrap auth-screen"><div class="form-card"><h1>No se pudo iniciar Mi Plata</h1><p>${escapeHtml(error.message)}</p><p>Abre la aplicación con Live Server o mediante HTTPS. Si el almacenamiento local está dañado, puedes borrar los datos de la demostración y crear de nuevo las cuentas iniciales.</p><div class="hero-actions"><button class="btn btn-outline" id="retryStart">Reintentar inicio</button><button class="btn btn-danger" id="resetBrokenData">Borrar datos locales y reiniciar</button></div></div></section>`;
    $('#retryStart')?.addEventListener('click', () => location.reload());
    $('#resetBrokenData')?.addEventListener('click', () => { if (confirm('Esto elimina los datos locales actuales. ¿Continuar?')) { try { storage.limpiar(); location.reload(); } catch (cleanupError) { alert(cleanupError.message); } } });
  }
}

initialize();
