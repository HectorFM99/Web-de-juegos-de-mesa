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
    if (typeof document === 'undefined') {
      return;
    }
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

    const token = localStorage.getItem('sobremesa_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'ADMIN') {
          isAdmin = true;
        }
      } catch {
        // Ignored
      }
    }

    if (isAdmin) {
      const adminLink = document.getElementById('nav-admin');
      if (adminLink) {
        adminLink.style.display = 'inline-block';
      }
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAdminDisplay);
    } else {
      checkAdminDisplay();
    }
  }
})();

function logout() {
  localStorage.removeItem('sobremesa_user');
  localStorage.removeItem('sobremesa_token');
  const inHtmlDir = window.location.pathname.includes('/html/');
  window.location.href = inHtmlDir ? 'auth.html' : 'html/auth.html';
}
window.logout = logout;
