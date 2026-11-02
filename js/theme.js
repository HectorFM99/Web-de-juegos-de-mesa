const themeButton = document.querySelector('.theme-toggle');
const savedTheme = localStorage.getItem('la-sobremesa-theme');
const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const isDark = theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.setAttribute('aria-label', `Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`);
  const icon = isDark ? '☀' : '☾';
  const label = isDark ? 'claro' : 'oscuro';
  themeButton.innerHTML = `<span aria-hidden="true">${icon}</span> Modo ${label}`;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  themeColor?.setAttribute('content', isDark ? '#22251f' : '#f5f0e5');
}

applyTheme(initialTheme);
themeButton.addEventListener('click', () => {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('la-sobremesa-theme', nextTheme);
  applyTheme(nextTheme);
});
