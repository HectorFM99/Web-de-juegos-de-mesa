(function() {
  const isAuthPage = window.location.pathname.includes('auth.html');
  const user = localStorage.getItem('sobremesa_user');
  
  if (!user && !isAuthPage) {
    const inHtmlDir = window.location.pathname.includes('/html/');
    window.location.href = inHtmlDir ? 'auth.html' : 'html/auth.html';
  }
})();

function logout() {
  localStorage.removeItem('sobremesa_user');
  localStorage.removeItem('sobremesa_token');
  const inHtmlDir = window.location.pathname.includes('/html/');
  window.location.href = inHtmlDir ? 'auth.html' : 'html/auth.html';
}
window.logout = logout;
