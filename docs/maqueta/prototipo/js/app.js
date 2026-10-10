(() => {
  'use strict';

  const pages = [...document.querySelectorAll('[data-page]')];
  const navLinks = [...document.querySelectorAll('.nav-link[data-view]')];
  const mainNav = document.getElementById('mainNav');
  const menuToggle = document.getElementById('menuToggle');
  const toast = document.getElementById('toast');
  let attempts = 0;
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3600);
  }

  function switchView(viewName, options = {}) {
    const target = pages.find(page => page.dataset.page === viewName) || pages[0];
    pages.forEach(page => page.classList.toggle('active', page === target));
    navLinks.forEach(link => link.classList.toggle('active', link.dataset.view === target.dataset.page));
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir navegación');

    const hashMap = { home: 'inicio', register: 'registro', login: 'ingresar', dashboard: 'mi-banca', products: 'productos' };
    if (options.updateHash !== false) history.replaceState(null, '', `#${hashMap[target.dataset.page] || 'inicio'}`);
    if (options.scroll !== false) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-view]').forEach(control => {
    control.addEventListener('click', event => {
      event.preventDefault();
      const viewName = control.dataset.view;
      if (viewName) switchView(viewName);
    });
  });

  document.querySelectorAll('[data-anchor]').forEach(control => {
    control.addEventListener('click', event => {
      event.preventDefault();
      const anchor = control.dataset.anchor;
      switchView('home', { scroll: false });
      const target = document.getElementById(anchor);
      if (target) window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });
  });

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar navegación' : 'Abrir navegación');
  });

  const registerForm = document.getElementById('registerForm');
  const registerMessage = document.getElementById('registerMessage');
  registerForm.addEventListener('submit', event => {
    event.preventDefault();
    const password = document.getElementById('regPassword').value;
    const confirmation = document.getElementById('regConfirm').value;
    registerMessage.className = 'form-message show';

    if (!registerForm.checkValidity()) {
      registerMessage.classList.add('error');
      registerMessage.textContent = 'Revisa los campos requeridos. Usa únicamente información ficticia para probar esta maqueta.';
      registerForm.reportValidity();
      return;
    }
    if (password.length < 8) {
      registerMessage.classList.add('error');
      registerMessage.textContent = 'Para la demostración, escribe una contraseña de al menos 8 caracteres.';
      return;
    }
    if (password !== confirmation) {
      registerMessage.classList.add('error');
      registerMessage.textContent = 'Las contraseñas no coinciden. Corrige el campo de confirmación.';
      document.getElementById('regConfirm').focus();
      return;
    }

    registerMessage.classList.add('success');
    registerMessage.textContent = 'Validación visual completada. No se creó una cuenta ni se almacenaron los datos; el registro real corresponde a una etapa futura.';
    showToast('Formulario de demostración validado; no se guardó información.');
  });

  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const attemptCount = document.getElementById('attemptCount');
  const attemptBar = document.getElementById('attemptBar');
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    loginMessage.className = 'form-message show';
    if (!loginForm.checkValidity()) {
      loginMessage.classList.add('error');
      loginMessage.textContent = 'Completa los dos campos con datos ficticios para simular la interacción.';
      loginForm.reportValidity();
      return;
    }
    attempts = Math.min(attempts + 1, 3);
    attemptCount.textContent = `${attempts} / 3`;
    attemptBar.style.width = `${(attempts / 3) * 100}%`;
    loginMessage.classList.remove('error');
    loginMessage.textContent = `Intento de demostración ${attempts} de 3. No se validaron credenciales reales. Usa “Ver panel de demostración” para explorar la siguiente pantalla.`;
  });

  const knownHashes = {
    '#inicio': 'home', '#registro': 'register', '#ingresar': 'login',
    '#mi-banca': 'dashboard', '#productos': 'products'
  };
  const initialView = knownHashes[window.location.hash] || 'home';
  switchView(initialView, { updateHash: false, scroll: false });
})();
