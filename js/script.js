const searchInput = document.querySelector('#game-search');
const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.game-card')];
const count = document.querySelector('#game-count');
const emptyState = document.querySelector('#empty-state');
let activeFilter = 'todos';

function updateGames() {
  const query = searchInput.value.trim().toLocaleLowerCase('es');
  let visible = 0;
  cards.forEach((card) => {
    const matchesCategory = activeFilter === 'todos' || card.dataset.category === activeFilter;
    const title = card.querySelector('h3').textContent.toLocaleLowerCase('es');
    const matchesSearch = card.dataset.name.includes(query) || title.includes(query);
    const show = matchesCategory && matchesSearch;
    card.hidden = !show;
    if (show) visible++;
  });
  count.textContent = `${visible} ${visible === 1 ? 'juego' : 'juegos'}`;
  emptyState.hidden = visible !== 0;
}

filters.forEach((filter) => filter.addEventListener('click', () => {
  activeFilter = filter.dataset.filter;
  filters.forEach((item) => {
    const selected = item === filter;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  updateGames();
}));

searchInput.addEventListener('input', updateGames);
filters.forEach((filter) => {
  const isActive = filter.classList.contains('active');
  filter.setAttribute('aria-pressed', String(isActive));
});
