// Redirect to index if already authenticated (sesión real: usuario + token)
if (localStorage.getItem('sobremesa_user') && localStorage.getItem('sobremesa_token')) {
  window.location.href = '../index.html';
}

function switchTab(tab) {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const footerText = document.getElementById('auth-footer-text');

  if (tab === 'login') {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    footerText.innerHTML = '¿Aún no tienes cuenta? <button type="button" class="link-button" data-tab="register">Regístrate aquí</button>';
  } else {
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    footerText.innerHTML = '¿Ya tienes cuenta? <button type="button" class="link-button" data-tab="login">Inicia sesión aquí</button>';
  }
}

async function authenticateUser(endpoint, payload) {
  try {
    const submitBtn = typeof document?.querySelector === 'function' ? document.querySelector('.auth-submit') : null;
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Procesando... <span>⟳</span>';
    }

    const res = await fetch(`http://localhost:3000/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Error en la autenticación.');
      if (typeof alert === 'function') {
        alert(errorMsg);
      } else {
        console.error(errorMsg);
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
      return;
    }

    localStorage.setItem('sobremesa_user', JSON.stringify(data.user));
    if (data.access_token) {
      localStorage.setItem('sobremesa_token', data.access_token);
    }
    window.location.href = '../index.html';
  } catch (error) {
    console.error('No se pudo conectar con el backend:', error);
    const serverErrorMsg = 'No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.';
    if (typeof alert === 'function') {
      alert(serverErrorMsg);
    } else {
      console.error(serverErrorMsg);
    }
    const submitBtn = typeof document?.querySelector === 'function' ? document.querySelector('.auth-submit') : null;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Entrar a la partida <span>→</span>';
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  await authenticateUser('login', { email, password });
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  await authenticateUser('register', { username, email, password });
}

// Pestañas y enlaces del pie (data-tab) y envío de formularios, sin onclick/onsubmit inline (CSP).
// El script se carga con defer, así que el DOM ya está disponible.
function handleTabClick(event) {
  const button = event.target.closest('[data-tab]');
  if (button) {
    switchTab(button.dataset.tab);
  }
}

function bindAuthEvents() {
  const bindings = [
    ['tab-login', 'click', handleTabClick],
    ['tab-register', 'click', handleTabClick],
    ['auth-footer-text', 'click', handleTabClick],
    ['form-login', 'submit', handleLogin],
    ['form-register', 'submit', handleRegister]
  ];
  for (const [id, type, handler] of bindings) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener(type, handler);
    }
  }
}

bindAuthEvents();

window.switchTab = switchTab;
window.handleTabClick = handleTabClick;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;