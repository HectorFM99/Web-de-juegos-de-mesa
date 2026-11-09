// Redirect to index if already authenticated
if (localStorage.getItem('sobremesa_user')) {
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
    footerText.innerHTML = '¿Aún no tienes cuenta? <button type="button" class="link-button" onclick="switchTab(\'register\')">Regístrate aquí</button>';
  } else {
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    footerText.innerHTML = '¿Ya tienes cuenta? <button type="button" class="link-button" onclick="switchTab(\'login\')">Inicia sesión aquí</button>';
  }
}

async function authenticateUser(endpoint, payload, fallbackUser) {
  try {
    const res = await fetch(`http://localhost:3000/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Error en la autenticación.'));
      return;
    }

    localStorage.setItem('sobremesa_user', JSON.stringify(data.user));
    if (data.access_token) {
      localStorage.setItem('sobremesa_token', data.access_token);
    }
    window.location.href = '../index.html';
  } catch (error) {
    // Ignored intentionally as offline/static preview fallback when NestJS backend is unreachable
    console.warn('Backend unavailable, using static session fallback:', error);
    localStorage.setItem('sobremesa_user', JSON.stringify(fallbackUser));
    window.location.href = '../index.html';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  await authenticateUser('login', { email, password }, { email });
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  await authenticateUser('register', { username, email, password }, { username, email });
}

window.switchTab = switchTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
