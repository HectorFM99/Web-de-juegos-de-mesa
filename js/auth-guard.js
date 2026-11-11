(function() {
  const isAuthPage = window.location.pathname.includes('auth.html');
  const userStr = localStorage.getItem('sobremesa_user');
  
  if (!userStr && !isAuthPage) {
    const inHtmlDir = window.location.pathname.includes('/html/');
    window.location.href = inHtmlDir ? 'auth.html' : 'html/auth.html';
    return;
  }

  function checkAdminDisplay() {
    const userStr = localStorage.getItem('sobremesa_user');
    let isAdmin = false;
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN' || user.email === 'admin@lasobremesa.local') {
          isAdmin = true;
        }
      } catch (e) {}
    }

    const token = localStorage.getItem('sobremesa_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'ADMIN' || payload.email === 'admin@lasobremesa.local' || payload.sub === 1) {
          isAdmin = true;
        }
      } catch (e) {}
    }

    // Force show if user is admin
    if (isAdmin) {
      const adminLink = document.getElementById('nav-admin');
      if (adminLink) {
        adminLink.style.display = 'inline-block';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAdminDisplay);
  } else {
    checkAdminDisplay();
  }
})();

function logout() {
  localStorage.removeItem('sobremesa_user');
  localStorage.removeItem('sobremesa_token');
  const inHtmlDir = window.location.pathname.includes('/html/');
  window.location.href = inHtmlDir ? 'auth.html' : 'html/auth.html';
}
window.logout = logout;
