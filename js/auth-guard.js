function logout() {
  localStorage.removeItem('sobremesa_user');
  localStorage.removeItem('sobremesa_token');
  const inHtmlDir = window.location.pathname.includes('/html/');
  window.location.href = inHtmlDir ? 'auth.html' : 'html/auth.html';
}
window.logout = logout;

(function() {
  const isAuthPage = window.location.pathname.includes('auth.html');
  const userStr = localStorage.getItem('sobremesa_user');
  const sessionToken = localStorage.getItem('sobremesa_token');

  // Una sesión sin token (p. ej. creada sin backend) no es válida: se descarta.
  if ((!userStr || !sessionToken) && !isAuthPage) {
    localStorage.removeItem('sobremesa_user');
    localStorage.removeItem('sobremesa_token');
    const inHtmlDir = window.location.pathname.includes('/html/');
    window.location.href = inHtmlDir ? 'auth.html' : 'html/auth.html';
    return;
  }

  function checkAdminDisplay() {
    const userStrLocal = localStorage.getItem('sobremesa_user');
    let isAdmin = false;

    if (userStrLocal) {
      try {
        const user = JSON.parse(userStrLocal);
        if (user.role === 'ADMIN') {
          isAdmin = true;
        }
      } catch {
        // Ignored
      }
    }

    const adminLink = document.getElementById('nav-admin');
    if (!adminLink) {
      return;
    }
    if (isAdmin) {
      adminLink.hidden = false;
      adminLink.style.display = 'inline-block';
    } else {
      adminLink.hidden = true;
      adminLink.style.display = 'none';
    }
  }

  // Botón "Cerrar sesión" sin onclick inline (la CSP lo bloquea).
  function bindLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', window.logout);
    }
  }

  function onReady() {
    if (typeof document === 'undefined') {
      return;
    }
    checkAdminDisplay();
    bindLogoutButton();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }
})();
