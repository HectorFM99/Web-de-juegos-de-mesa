const game = document.body?.dataset?.game;
const board = document.querySelector('#board');
const statusEl = document.querySelector('#status');
const resetButton = document.querySelector('#reset');

const symbols = ['✿', '✳', '❋', '❀', '☼', '♧', '❈', '✾'];
const chessGlyphs = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};
let state;

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function reset() {
  if (!board) return;
  if (game === 'tic-tac-toe') startTicTacToe();
  if (game === 'connect-four') startConnectFour();
  if (game === 'memory') startMemory();
  if (game === 'checkers') startCheckers();
  if (game === 'chess') startChess();
  if (game === 'solitaire') startSolitaire();
}

if (resetButton) {
  resetButton.addEventListener('click', reset);
}

function winnerLine(cells, size, length, row, column, player, directions) {
  return directions.some(([dr, dc]) => {
    let total = 1;
    for (const sign of [-1, 1]) {
      let r = row + dr * sign;
      let c = column + dc * sign;
      const maxColumns = size === 6 ? 7 : size;
      while (
        r >= 0 &&
        r < size &&
        c >= 0 &&
        c < maxColumns &&
        cells[r][c] === player
      ) {
        total++;
        r += dr * sign;
        c += dc * sign;
      }
    }
    return total >= length;
  });
}

function startTicTacToe() {
  state = { cells: Array(9).fill(''), turn: 'X', done: false };
  board.replaceChildren();
  state.cells.forEach((_, index) => {
    const cell = document.createElement('button');
    cell.className = 'tic-cell';
    cell.setAttribute('aria-label', `Casilla ${index + 1}`);
    cell.addEventListener('click', () => {
      if (state.done || state.cells[index]) return;
      state.cells[index] = state.turn;
      cell.textContent = state.turn;
      const row = Math.floor(index / 3);
      const column = index % 3;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      if (winnerLine([state.cells], 3, 3, row, column, state.turn, directions)) {
        state.done = true;
        setStatus(`¡${state.turn} gana la partida!`);
      } else if (state.cells.every(Boolean)) {
        state.done = true;
        setStatus('Empate. ¡Una revancha!');
      } else {
        state.turn = state.turn === 'X' ? 'O' : 'X';
        setStatus(`Turno de ${state.turn}`);
      }
    });
    board.append(cell);
  });
  setStatus('Turno de X');
}

function startConnectFour() {
  state = { cells: Array.from({ length: 6 }, () => Array(7).fill('')), turn: 'red', done: false };
  board.replaceChildren();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
    const cell = document.createElement('button');
    cell.className = 'connect-cell';
    cell.setAttribute('aria-label', `Columna ${c + 1}, fila ${r + 1}`);
    cell.addEventListener('click', () => {
      if (state.done) return;
      let row = 5;
      while (row >= 0 && state.cells[row][c]) row--;
      if (row < 0) return;
      state.cells[row][c] = state.turn;
      cellAt(row, c).classList.add(state.turn);
      if (winnerLine(state.cells, 6, 4, row, c, state.turn, [[0, 1], [1, 0], [1, 1], [1, -1]])) {
        state.done = true;
        setStatus(`¡Ganan ${state.turn === 'red' ? 'rojas' : 'amarillas'}!`);
      } else if (state.cells.every((line) => line.every(Boolean))) {
        state.done = true;
        setStatus('Empate. ¡A por la revancha!');
      } else {
        state.turn = state.turn === 'red' ? 'yellow' : 'red';
        setStatus(`Turno de ${state.turn === 'red' ? 'rojas' : 'amarillas'}`);
      }
    });
    board.append(cell);
  }
  function cellAt(row, column) { return board.children[row * 7 + column]; }
  setStatus('Turno de rojas');
}

function startMemory() {
  state = { open: [], matched: new Set(), locked: false, moves: 0 };
  const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  board.replaceChildren();
  deck.forEach((symbol, index) => {
    const card = document.createElement('button');
    card.className = 'memory-card';
    card.setAttribute('aria-label', `Carta ${index + 1}, oculta`);
    card.addEventListener('click', () => {
      if (state.locked || state.matched.has(index) || state.open.includes(index)) return;
      card.textContent = symbol;
      card.classList.add('revealed');
      card.setAttribute('aria-label', `Carta ${index + 1}: ${symbol}`);
      state.open.push(index);
      if (state.open.length < 2) return;
      state.moves++;
      const [first, second] = state.open;
      if (deck[first] === deck[second]) {
        state.matched.add(first);
        state.matched.add(second);
        board.children[first].classList.add('matched');
        board.children[second].classList.add('matched');
        state.open = [];
        if (state.matched.size === deck.length) {
          setStatus(`¡Todas las parejas! Lo lograste en ${state.moves} intentos.`);
        } else {
          setStatus(
            `Parejas encontradas: ${state.matched.size / 2} de 8 · ` +
              `Intentos: ${state.moves}`,
          );
        }
      } else {
        state.locked = true;
        setStatus(
          `Parejas encontradas: ${state.matched.size / 2} de 8 · ` +
            `Intentos: ${state.moves}`,
        );
        window.setTimeout(() => {
          [first, second].forEach((i) => {
            const hidden = board.children[i];
            hidden.textContent = '';
            hidden.classList.remove('revealed');
            hidden.setAttribute('aria-label', `Carta ${i + 1}, oculta`);
          });
          state.open = [];
          state.locked = false;
        }, 750);
      }
    });
    board.append(card);
  });
  setStatus('Parejas encontradas: 0 de 8');
}

function startCheckers() {
  state = { cells: Array(64).fill(null), turn: 'red', selected: null, done: false };
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 8; column++) {
      if ((row + column) % 2) {
        state.cells[row * 8 + column] = { side: 'black', king: false };
      }
    }
  }
  for (let row = 5; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      if ((row + column) % 2) {
        state.cells[row * 8 + column] = { side: 'red', king: false };
      }
    }
  }
  renderCheckers();
  setStatus('Turno de rojas');
}

function checkMoves(index) {
  const piece = state.cells[index];
  if (!piece) return [];
  const row = Math.floor(index / 8), col = index % 8;
  const forward = piece.side === 'red' ? -1 : 1;
  const directions = piece.king ? [-1, 1] : [forward];
  const captures = [], moves = [];
  for (const dr of directions) for (const dc of [-1, 1]) {
    const r = row + dr, c = col + dc;
    if (r < 0 || r > 7 || c < 0 || c > 7) continue;
    const next = r * 8 + c;
    if (!state.cells[next]) moves.push({ to: next });
    else if (state.cells[next].side !== piece.side) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && !state.cells[rr * 8 + cc]) {
        captures.push({ to: rr * 8 + cc, take: next });
      }
    }
  }
  const anyCapture = state.cells.some((piece, i) => {
    const canCapture = checkMovesRaw(i).some((move) => move.take !== undefined);
    return piece?.side === state.turn && canCapture;
  });
  const options = captures.length ? captures : moves;
  return anyCapture ? options.filter((move) => move.take !== undefined) : options;
}

function checkMovesRaw(index) {
  const p = state.cells[index];
  if (!p) return [];
  const row = Math.floor(index / 8), col = index % 8;
  const directions = p.king ? [-1, 1] : [p.side === 'red' ? -1 : 1];
  const result = [];
  for (const dr of directions) for (const dc of [-1, 1]) {
    const r = row + dr, c = col + dc;
    if (r < 0 || r > 7 || c < 0 || c > 7) continue;
    const to = r * 8 + c;
    if (!state.cells[to]) result.push({ to });
    else if (state.cells[to].side !== p.side) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && !state.cells[rr * 8 + cc]) {
        result.push({ to: rr * 8 + cc, take: to });
      }
    }
  }
  return result;
}

function renderCheckers() {
  board.replaceChildren();
  state.cells.forEach((piece, index) => {
    const cell = document.createElement('button');
    const r = Math.floor(index / 8), c = index % 8;
    const color = (r + c) % 2 ? 'dark' : 'light';
    const selected = state.selected === index ? ' selected' : '';
    cell.className = `square ${color}${selected}`;
    if (piece) {
      const token = document.createElement('span');
      const side = piece.side === 'black' ? 'black' : '';
      const king = piece.king ? ' king' : '';
      token.className = `checker-piece ${side}${king}`;
      cell.append(token);
    }
    cell.addEventListener('click', () => clickCheckers(index));
    board.append(cell);
  });
}

function clickCheckers(index) {
  if (state.done) return;
  const piece = state.cells[index];
  if (state.selected === null) {
    if (piece?.side === state.turn && checkMoves(index).length) state.selected = index;
    renderCheckers();
    return;
  }
  const move = checkMoves(state.selected).find((option) => option.to === index);
  if (move) {
    const moving = state.cells[state.selected];
    state.cells[index] = moving;
    state.cells[state.selected] = null;
    if (move.take !== undefined) state.cells[move.take] = null;
    const reachesEnd =
      (moving.side === 'red' && index < 8) ||
      (moving.side === 'black' && index >= 56);
    if (reachesEnd) moving.king = true;
    if (move.take !== undefined && checkMoves(index).some((option) => option.take !== undefined)) {
      state.selected = index;
      renderCheckers();
      setStatus('¡Sigue capturando con esa ficha!');
      return;
    }
    state.turn = state.turn === 'red' ? 'black' : 'red';
    const opponentCanMove = state.cells.some((piece, i) => {
      return piece?.side === state.turn && checkMoves(i).length > 0;
    });
    if (!opponentCanMove) {
      state.done = true;
      setStatus(`¡Ganan ${moving.side === 'red' ? 'rojas' : 'negras'}!`);
    } else setStatus(`Turno de ${state.turn === 'red' ? 'rojas' : 'negras'}`);
    state.selected = null;
  } else if (piece?.side === state.turn) state.selected = index;
  else state.selected = null;
  renderCheckers();
}

function startChess() {
  const row = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  state = { cells: Array(64).fill(''), turn: 'white', selected: null, done: false };
  row.forEach((piece, column) => {
    state.cells[column] = piece;
    state.cells[8 + column] = 'p';
    state.cells[48 + column] = 'P';
    state.cells[56 + column] = piece.toUpperCase();
  });
  renderChess();
  setStatus('Turno de blancas');
}

function chessMoves(from) {
  const piece = state.cells[from];
  if (!piece) return [];
  const side = piece === piece.toUpperCase() ? 'white' : 'black';
  const r = Math.floor(from / 8), c = from % 8, type = piece.toLowerCase();
  const moves = [];
  const add = (rr, cc) => {
    if (rr < 0 || rr > 7 || cc < 0 || cc > 7) return false;
    const to = rr * 8 + cc, target = state.cells[to];
    if (target && (target === target.toUpperCase() ? 'white' : 'black') === side) return false;
    moves.push(to);
    return !target;
  };
  if (type === 'p') {
    const dir = side === 'white' ? -1 : 1, start = side === 'white' ? 6 : 1;
    if (r + dir >= 0 && r + dir < 8 && !state.cells[(r + dir) * 8 + c]) {
      moves.push((r + dir) * 8 + c);
      if (r === start && !state.cells[(r + 2 * dir) * 8 + c]) moves.push((r + 2 * dir) * 8 + c);
    }
    for (const dc of [-1, 1]) if (c + dc >= 0 && c + dc < 8) {
      const to = (r + dir) * 8 + c + dc, target = state.cells[to];
      if (target && (target === target.toUpperCase() ? 'white' : 'black') !== side) moves.push(to);
    }
  } else if (type === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => add(r+dr,c+dc));
  } else {
    const dirs = [];
    if (type === 'b' || type === 'q' || type === 'k') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if (type === 'r' || type === 'q' || type === 'k') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    dirs.forEach(([dr,dc]) => {
      let rr = r + dr, cc = c + dc, steps = 0;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && (type !== 'k' || steps < 1)) {
        if (!add(rr,cc)) break;
        rr += dr; cc += dc; steps++;
      }
    });
  }
  return moves;
}

function renderChess() {
  board.replaceChildren();
  state.cells.forEach((piece, index) => {
    const r = Math.floor(index / 8), c = index % 8;
    const cell = document.createElement('button');
    const color = (r + c) % 2 ? 'dark' : 'light';
    const selected = state.selected === index ? ' selected' : '';
    cell.className = `square ${color}${selected}`;
    if (piece) {
      const token = document.createElement('span');
      token.className = `chess-piece${piece === piece.toLowerCase() ? ' black' : ''}`;
      token.textContent = chessGlyphs[piece];
      cell.append(token);
    }
    cell.addEventListener('click', () => clickChess(index));
    board.append(cell);
  });
}

function clickChess(index) {
  if (state.done) return;
  const piece = state.cells[index];
  if (state.selected === null) {
    const side = piece === piece?.toUpperCase() ? 'white' : 'black';
    if (piece && side === state.turn) state.selected = index;
    renderChess();
    return;
  }
  const moves = chessMoves(state.selected);
  if (moves.includes(index)) {
    const moving = state.cells[state.selected];
    state.cells[index] = moving;
    state.cells[state.selected] = '';
    const promotes = moving.toLowerCase() === 'p' && (index < 8 || index >= 56);
    if (promotes) state.cells[index] = moving === 'P' ? 'Q' : 'q';
    const capturedKing = piece?.toLowerCase() === 'k';
    state.turn = state.turn === 'white' ? 'black' : 'white';
    state.selected = null;
    if (capturedKing) {
      state.done = true;
      setStatus(`¡Ganan ${moving === moving.toUpperCase() ? 'blancas' : 'negras'}!`);
    } else setStatus(`Turno de ${state.turn === 'white' ? 'blancas' : 'negras'}`);
  } else {
    const side = piece === piece?.toUpperCase() ? 'white' : 'black';
    state.selected = piece && side === state.turn ? index : null;
  }
  renderChess();
}

const suits = ['♠', '♥', '♣', '♦'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
function startSolitaire() {
  const deck = suits.flatMap((suit, suitIndex) =>
    ranks.map((rank, value) => ({
      suit,
      suitIndex,
      rank,
      value,
      red: suit === '♥' || suit === '♦',
    })),
  );
  deck.sort(() => Math.random() - 0.5);
  state = {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    columns: Array.from({ length: 7 }, () => []),
    selected: null,
  };
  for (let column = 0; column < 7; column++) {
    for (let row = 0; row <= column; row++) {
      state.columns[column].push({
        ...state.stock.pop(),
        faceUp: row === column,
      });
    }
  }
  renderSolitaire();
  setStatus('Robá una carta para empezar.');
}

function renderSolitaire() {
  board.replaceChildren();
  const makePile = (name, type, index, cards = []) => {
    const pile = document.createElement('div');
    pile.className = `solitaire-pile ${type}`;
    pile.setAttribute('aria-label', name);
    if (!cards.length) {
      const title = document.createElement('span'); title.className = 'pile-title';
      title.textContent = type === 'stock' ? '↻' : type === 'foundation' ? 'A' : '·';
      pile.append(title);
    }
    if (type === 'tableau') {
      cards.forEach((card, cardIndex) => {
        const cardId = `column:${index}:${cardIndex}`;
        pile.append(makeCard(card, cardId, cardIndex * 24));
      });
    } else if (cards.length) {
      const card = cards.at(-1);
      pile.append(makeCard(card, `${type}:${index}:${cards.length - 1}`, 0));
    }
    pile.addEventListener('click', (event) => {
      const clickedEmptySpace =
        event.target === pile || event.target.classList.contains('pile-title');
      if (clickedEmptySpace) clickPile(type, index);
    });
    return pile;
  };
  board.append(makePile('Mazo', 'stock', 0, state.stock));
  board.append(makePile('Descarte', 'waste', 0, state.waste));
  const spacer = document.createElement('div');
  spacer.className = 'solitaire-spacer';
  board.append(spacer);
  state.foundations.forEach((cards, i) => board.append(makePile('Base', 'foundation', i, cards)));
  state.columns.forEach((cards, i) => {
    board.append(makePile(`Columna ${i + 1}`, 'tableau', i, cards));
  });
}

function makeCard(card, id, offset) {
  const button = document.createElement('button');
  const colorClass = card.red ? ' red-suit' : '';
  const faceClass = card.faceUp ? '' : ' face-down';
  const selectedClass = state.selected?.id === id ? ' selected' : '';
  button.className = `playing-card${colorClass}${faceClass}${selectedClass}`;
  button.style.top = `${offset}px`;
  button.textContent = card.faceUp ? `${card.rank}${card.suit}` : '✳';
  button.setAttribute('aria-label', card.faceUp ? `${card.rank} ${card.suit}` : 'Carta boca abajo');
  button.addEventListener('click', (event) => { event.stopPropagation(); clickCard(id); });
  return button;
}

function clickPile(type, index) {
  if (type === 'stock') {
    if (state.stock.length) {
      const card = state.stock.pop(); card.faceUp = true; state.waste.push(card);
    } else if (state.waste.length) {
      state.stock = state.waste.reverse().map((card) => ({ ...card, faceUp: false }));
      state.waste = [];
    }
    state.selected = null;
  } else if (type === 'foundation' && state.selected) moveToFoundation(index);
  else if (type === 'tableau' && state.selected) moveToColumn(index);
  renderSolitaire();
}

function selectedCards() {
  if (!state.selected) return [];
  const { id } = state.selected;
  if (id.startsWith('waste:')) return [state.waste.at(-1)];
  if (id.startsWith('column:')) {
    const [, col, row] = id.split(':').map(Number);
    return state.columns[col].slice(row);
  }
  return [];
}

function removeSelected() {
  const id = state.selected.id;
  if (id.startsWith('waste:')) return state.waste.pop();
  if (id.startsWith('column:')) {
    const [, col, row] = id.split(':').map(Number);
    const removed = state.columns[col].splice(row);
    const top = state.columns[col].at(-1);
    if (top) top.faceUp = true;
    return removed;
  }
  return [];
}

function clickCard(id) {
  if (id.startsWith('stock:')) {
    clickPile('stock', 0);
    return;
  }
  if (id.startsWith('column:')) {
    const [, col, row] = id.split(':').map(Number);
    const card = state.columns[col][row];
    if (!card.faceUp) { card.faceUp = true; state.selected = null; }
    else if (state.selected) moveToColumn(col);
    else state.selected = { id };
  } else if (id.startsWith('waste:')) {
    state.selected = state.selected?.id === id ? null : { id };
  }
  renderSolitaire();
}

function moveToColumn(index) {
  const cards = selectedCards();
  if (!cards.length) return;
  const target = state.columns[index].at(-1);
  const first = cards[0];
  const canPlaceOnEmpty = !target && first.rank === 'K';
  const canPlaceOnCard =
    target &&
    target.faceUp &&
    target.red !== first.red &&
    target.value === first.value + 1;
  if (canPlaceOnEmpty || canPlaceOnCard) {
    const moved = removeSelected();
    state.columns[index].push(...(Array.isArray(moved) ? moved : [moved]));
    state.selected = null;
  }
}

function moveToFoundation(index) {
  const cards = selectedCards();
  const card = cards[0];
  if (!card || cards.length > 1) return;
  const foundation = state.foundations[index];
  const top = foundation.at(-1);
  const canStartFoundation = !top && card.rank === 'A';
  const canAddToFoundation = top && top.suit === card.suit && card.value === top.value + 1;
  if (canStartFoundation || canAddToFoundation) {
    const moved = removeSelected();
    foundation.push(Array.isArray(moved) ? moved[0] : moved);
    state.selected = null;
    if (state.foundations.every((pile) => pile.length === 13)) setStatus('¡Solitario completado!');
  }
}

reset();
