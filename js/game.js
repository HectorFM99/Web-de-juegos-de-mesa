const game = document.body?.dataset?.game;
const board = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const resetButton = document.querySelector("#reset");

const MEMORY_SYMBOLS = ["✿", "✳", "❋", "❀", "☼", "♧", "❈", "✾"];
const BOARD_SIZE = 8;
const CHECKERS_DIRECTIONS = [-1, 1];
const LINE_DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];
const CHESS_GLYPHS = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};
let state;

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function reset() {
  if (!board) return;
  const starters = {
    "tic-tac-toe": startTicTacToe,
    "connect-four": startConnectFour,
    memory: startMemory,
    checkers: startCheckers,
    chess: startChess,
    solitaire: startSolitaire,
  };
  starters[game]?.();
}

if (resetButton) {
  resetButton.addEventListener("click", reset);
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
  state = { cells: new Array(9).fill(""), turn: "X", done: false };
  board.replaceChildren();
  state.cells.forEach((_, index) => {
    const cell = document.createElement("button");
    cell.className = "tic-cell";
    cell.setAttribute("aria-label", `Casilla ${index + 1}`);
    cell.addEventListener("click", () => {
      if (state.done || state.cells[index]) return;
      state.cells[index] = state.turn;
      cell.textContent = state.turn;
      const row = Math.floor(index / 3);
      const column = index % 3;
      const directions = LINE_DIRECTIONS;
      if (
        winnerLine([state.cells], 3, 3, row, column, state.turn, directions)
      ) {
        state.done = true;
        setStatus(`¡${state.turn} gana la partida!`);
      } else if (state.cells.every(Boolean)) {
        state.done = true;
        setStatus("Empate. ¡Una revancha!");
      } else {
        state.turn = state.turn === "X" ? "O" : "X";
        setStatus(`Turno de ${state.turn}`);
      }
    });
    board.append(cell);
  });
  setStatus("Turno de X");
}

function startConnectFour() {
  state = {
    cells: Array.from({ length: 6 }, () => new Array(7).fill("")),
    turn: "red",
    done: false,
  };
  board.replaceChildren();
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 7; c++) {
      const cell = document.createElement("button");
      cell.className = "connect-cell";
      cell.setAttribute("aria-label", `Columna ${c + 1}, fila ${r + 1}`);
      cell.addEventListener("click", () => {
        if (state.done) return;
        let row = 5;
        while (row >= 0 && state.cells[row][c]) row--;
        if (row < 0) return;
        state.cells[row][c] = state.turn;
        cellAt(row, c).classList.add(state.turn);
        if (
          winnerLine(state.cells, 6, 4, row, c, state.turn, LINE_DIRECTIONS)
        ) {
          state.done = true;
          setStatus(`¡Ganan ${state.turn === "red" ? "rojas" : "amarillas"}!`);
        } else if (state.cells.every((line) => line.every(Boolean))) {
          state.done = true;
          setStatus("Empate. ¡A por la revancha!");
        } else {
          state.turn = state.turn === "red" ? "yellow" : "red";
          setStatus(`Turno de ${state.turn === "red" ? "rojas" : "amarillas"}`);
        }
      });
      board.append(cell);
    }
  function cellAt(row, column) {
    return board.children[row * 7 + column];
  }
  setStatus("Turno de rojas");
}

function startMemory() {
  state = { open: [], matched: new Set(), locked: false, moves: 0 };
  const deck = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS].sort(
    () => Math.random() - 0.5,
  );
  board.replaceChildren();
  deck.forEach((symbol, index) => {
    const card = document.createElement("button");
    card.className = "memory-card";
    card.setAttribute("aria-label", `Carta ${index + 1}, oculta`);
    card.addEventListener("click", () => handleMemoryClick(card, symbol, index, deck));
    board.append(card);
  });
  setStatus("Parejas encontradas: 0 de 8");
}

function handleMemoryClick(card, symbol, index, deck) {
  if (
    state.locked ||
    state.matched.has(index) ||
    state.open.includes(index)
  )
    return;
  card.textContent = symbol;
  card.classList.add("revealed");
  card.setAttribute("aria-label", `Carta ${index + 1}: ${symbol}`);
  state.open.push(index);
  if (state.open.length < 2) return;
  processMemoryPair(deck);
}

function processMemoryPair(deck) {
  state.moves++;
  const [first, second] = state.open;
  if (deck[first] === deck[second]) {
    handleMemoryMatch(first, second, deck.length);
  } else {
    handleMemoryMismatch(first, second);
  }
}

function handleMemoryMatch(first, second, totalLength) {
  state.matched.add(first);
  state.matched.add(second);
  board.children[first].classList.add("matched");
  board.children[second].classList.add("matched");
  state.open = [];
  if (state.matched.size === totalLength) {
    setStatus(
      `¡Todas las parejas! Lo lograste en ${state.moves} intentos.`,
    );
  } else {
    setStatus(
      `Parejas encontradas: ${state.matched.size / 2} de 8 · ` +
        `Intentos: ${state.moves}`,
    );
  }
}

function handleMemoryMismatch(first, second) {
  state.locked = true;
  setStatus(
    `Parejas encontradas: ${state.matched.size / 2} de 8 · ` +
      `Intentos: ${state.moves}`,
  );
  window.setTimeout(() => {
    [first, second].forEach((i) => {
      const hidden = board.children[i];
      hidden.textContent = "";
      hidden.classList.remove("revealed");
      hidden.setAttribute("aria-label", `Carta ${i + 1}, oculta`);
    });
    state.open = [];
    state.locked = false;
  }, 750);
}

function startCheckers() {
  state = {
    cells: new Array(64).fill(null),
    turn: "red",
    selected: null,
    done: false,
  };
  populateCheckersRows(0, 3, "black");
  populateCheckersRows(5, 8, "red");
  renderCheckers();
  setStatus("Turno de rojas");
}

function populateCheckersRows(startRow, endRow, side) {
  for (let row = startRow; row < endRow; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      if ((row + column) % 2) {
        state.cells[boardIndex(row, column)] = { side, king: false };
      }
    }
  }
}

function checkerDirections(piece) {
  if (piece.king) return CHECKERS_DIRECTIONS;
  return [piece.side === "red" ? -1 : 1];
}

function checkerMovesFor(index) {
  const piece = state.cells[index];
  if (!piece) return [];
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  const moves = [];
  for (const dr of checkerDirections(piece)) {
    for (const dc of [-1, 1]) {
      addCheckerMove(moves, piece, row + dr, col + dc, dr, dc);
    }
  }
  return moves;
}

function isOnBoard(row, column) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
}

function boardIndex(row, column) {
  return row * BOARD_SIZE + column;
}

function addCheckerMove(moves, piece, row, col, dr, dc) {
  if (!isOnBoard(row, col)) return;
  const next = boardIndex(row, col);
  const target = state.cells[next];
  if (!target) {
    moves.push({ to: next });
    return;
  }
  if (target.side === piece.side) return;
  const landingRow = row + dr;
  const landingCol = col + dc;
  if (!isOnBoard(landingRow, landingCol)) return;
  const landing = boardIndex(landingRow, landingCol);
  if (!state.cells[landing]) {
    moves.push({ to: landing, take: next });
  }
}

function checkMoves(index) {
  const piece = state.cells[index];
  if (!piece) return [];
  const options = checkerMovesFor(index);
  const anyCapture = state.cells.some(
    (candidate, candidateIndex) =>
      candidate?.side === state.turn &&
      checkerMovesFor(candidateIndex).some((move) => move.take !== undefined),
  );
  if (!anyCapture) return options;
  return options.filter((move) => move.take !== undefined);
}

function renderCheckers() {
  board.replaceChildren();
  state.cells.forEach((piece, index) => {
    const cell = document.createElement("button");
    const r = Math.floor(index / BOARD_SIZE);
    const c = index % BOARD_SIZE;
    const color = (r + c) % 2 ? "dark" : "light";
    const selected = state.selected === index ? " selected" : "";
    cell.className = `square ${color}${selected}`;
    if (piece) {
      const token = document.createElement("span");
      const side = piece.side === "black" ? "black" : "";
      const king = piece.king ? " king" : "";
      token.className = `checker-piece ${side}${king}`;
      cell.append(token);
    }
    cell.addEventListener("click", () => clickCheckers(index));
    board.append(cell);
  });
}

function finishCheckerTurn(moving) {
  state.turn = state.turn === "red" ? "black" : "red";
  const opponentCanMove = state.cells.some(
    (piece, index) =>
      piece?.side === state.turn && checkMoves(index).length > 0,
  );
  if (!opponentCanMove) {
    state.done = true;
    setStatus(`¡Ganan ${moving.side === "red" ? "rojas" : "negras"}!`);
  } else {
    setStatus(`Turno de ${state.turn === "red" ? "rojas" : "negras"}`);
  }
  state.selected = null;
}

function applyCheckerMove(index, move) {
  const moving = state.cells[state.selected];
  state.cells[index] = moving;
  state.cells[state.selected] = null;
  if (move.take !== undefined) state.cells[move.take] = null;
  const reachesEnd =
    (moving.side === "red" && index < BOARD_SIZE) ||
    (moving.side === "black" && index >= BOARD_SIZE * (BOARD_SIZE - 1));
  if (reachesEnd) moving.king = true;
  if (
    move.take !== undefined &&
    checkMoves(index).some((option) => option.take !== undefined)
  ) {
    state.selected = index;
    setStatus("¡Sigue capturando con esa ficha!");
    return;
  }
  finishCheckerTurn(moving);
}

function clickCheckers(index) {
  if (state.done) return;
  const piece = state.cells[index];
  if (state.selected === null) {
    state.selected =
      piece?.side === state.turn && checkMoves(index).length ? index : null;
  } else {
    const move = checkMoves(state.selected).find(
      (option) => option.to === index,
    );
    if (move) {
      applyCheckerMove(index, move);
    } else {
      state.selected = piece?.side === state.turn ? index : null;
    }
  }
  renderCheckers();
}

function startChess() {
  const row = ["r", "n", "b", "q", "k", "b", "n", "r"];
  state = {
    cells: new Array(64).fill(""),
    turn: "white",
    selected: null,
    done: false,
  };
  row.forEach((piece, column) => {
    state.cells[column] = piece;
    state.cells[BOARD_SIZE + column] = "p";
    state.cells[BOARD_SIZE * 6 + column] = "P";
    state.cells[BOARD_SIZE * 7 + column] = piece.toUpperCase();
  });
  renderChess();
  setStatus("Turno de blancas");
}

function chessSide(piece) {
  return piece === piece.toUpperCase() ? "white" : "black";
}

function addChessDestination(moves, row, col, side) {
  if (!isOnBoard(row, col)) return false;
  const destination = boardIndex(row, col);
  const target = state.cells[destination];
  if (target && chessSide(target) === side) return false;
  moves.push(destination);
  return !target;
}

function addPawnSingleStep(moves, row, col, side) {
  const direction = side === "white" ? -1 : 1;
  const nextRow = row + direction;
  if (!isOnBoard(nextRow, col)) return;
  const nextIdx = boardIndex(nextRow, col);
  if (state.cells[nextIdx]) return;
  moves.push(nextIdx);
  const startingRow = side === "white" ? 6 : 1;
  const doubleRow = row + direction * 2;
  const doubleIdx = boardIndex(doubleRow, col);
  if (row === startingRow && !state.cells[doubleIdx]) {
    moves.push(doubleIdx);
  }
}

function addPawnCaptures(moves, row, col, side) {
  const direction = side === "white" ? -1 : 1;
  const nextRow = row + direction;
  for (const offset of [-1, 1]) {
    const targetCol = col + offset;
    if (!isOnBoard(nextRow, targetCol)) continue;
    const targetIdx = boardIndex(nextRow, targetCol);
    const target = state.cells[targetIdx];
    if (target && chessSide(target) !== side) {
      moves.push(targetIdx);
    }
  }
}

function addPawnMoves(moves, row, col, side) {
  addPawnSingleStep(moves, row, col, side);
  addPawnCaptures(moves, row, col, side);
}

function chessDirections(type) {
  const diagonal = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  const straight = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  if (type === "b") return diagonal;
  if (type === "r") return straight;
  if (type === "q" || type === "k") return [...diagonal, ...straight];
  return [];
}

function addLeaperMoves(moves, row, col, side) {
  const offsets = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  offsets.forEach(([dr, dc]) =>
    addChessDestination(moves, row + dr, col + dc, side),
  );
}

function addSlidingMoves(moves, row, col, side, type) {
  for (const [dr, dc] of chessDirections(type)) {
    let targetRow = row + dr;
    let targetCol = col + dc;
    const maxSteps = type === "k" ? 1 : BOARD_SIZE - 1;
    for (let step = 0; step < maxSteps; step++) {
      if (!addChessDestination(moves, targetRow, targetCol, side)) break;
      targetRow += dr;
      targetCol += dc;
    }
  }
}

function chessMoves(from) {
  const piece = state.cells[from];
  if (!piece) return [];
  const side = chessSide(piece);
  const row = Math.floor(from / BOARD_SIZE);
  const col = from % BOARD_SIZE;
  const type = piece.toLowerCase();
  const moves = [];
  if (type === "p") addPawnMoves(moves, row, col, side);
  else if (type === "n") addLeaperMoves(moves, row, col, side);
  else addSlidingMoves(moves, row, col, side, type);
  return moves;
}

function renderChess() {
  board.replaceChildren();
  state.cells.forEach((piece, index) => {
    const r = Math.floor(index / BOARD_SIZE);
    const c = index % BOARD_SIZE;
    const cell = document.createElement("button");
    const color = (r + c) % 2 ? "dark" : "light";
    const selected = state.selected === index ? " selected" : "";
    cell.className = `square ${color}${selected}`;
    if (piece) {
      const token = document.createElement("span");
      token.className = `chess-piece${piece === piece.toLowerCase() ? " black" : ""}`;
      token.textContent = CHESS_GLYPHS[piece];
      cell.append(token);
    }
    cell.addEventListener("click", () => clickChess(index));
    board.append(cell);
  });
}

function selectChessPiece(index) {
  const piece = state.cells[index];
  state.selected = piece && chessSide(piece) === state.turn ? index : null;
}

function finishChessTurn(moving, capturedKing) {
  state.turn = state.turn === "white" ? "black" : "white";
  state.selected = null;
  if (capturedKing) {
    state.done = true;
    setStatus(
      `¡Ganan ${chessSide(moving) === "white" ? "blancas" : "negras"}!`,
    );
  } else {
    setStatus(`Turno de ${state.turn === "white" ? "blancas" : "negras"}`);
  }
}

function applyChessMove(index) {
  const moving = state.cells[state.selected];
  const capturedKing = state.cells[index]?.toLowerCase() === "k";
  state.cells[index] = moving;
  state.cells[state.selected] = "";
  const promotes = moving.toLowerCase() === "p" && (index < BOARD_SIZE || index >= BOARD_SIZE * (BOARD_SIZE - 1));
  if (promotes) state.cells[index] = chessSide(moving) === "white" ? "Q" : "q";
  finishChessTurn(moving, capturedKing);
}

function clickChess(index) {
  if (state.done) return;
  if (state.selected === null) {
    selectChessPiece(index);
  } else if (chessMoves(state.selected).includes(index)) {
    applyChessMove(index);
  } else {
    selectChessPiece(index);
  }
  renderChess();
}

const suits = ["♠", "♥", "♣", "♦"];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
function startSolitaire() {
  const deck = suits.flatMap((suit, suitIndex) =>
    ranks.map((rank, value) => ({
      suit,
      suitIndex,
      rank,
      value,
      red: suit === "♥" || suit === "♦",
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
  setStatus("Robá una carta para empezar.");
}

function renderSolitaire() {
  board.replaceChildren();
  const makePile = (name, type, index, cards = []) => {
    const pile = document.createElement("div");
    pile.className = `solitaire-pile ${type}`;
    pile.setAttribute("aria-label", name);
    if (!cards.length) {
      const title = document.createElement("span");
      title.className = "pile-title";
      let placeholder = "·";
      if (type === "stock") placeholder = "↻";
      if (type === "foundation") placeholder = "A";
      title.textContent = placeholder;
      pile.append(title);
    }
    if (type === "tableau") {
      cards.forEach((card, cardIndex) => {
        const cardId = `column:${index}:${cardIndex}`;
        pile.append(makeCard(card, cardId, cardIndex * 24));
      });
    } else if (cards.length) {
      const card = cards.at(-1);
      pile.append(makeCard(card, `${type}:${index}:${cards.length - 1}`, 0));
    }
    pile.addEventListener("click", (event) => {
      const clickedEmptySpace =
        event.target === pile || event.target.classList.contains("pile-title");
      if (clickedEmptySpace) clickPile(type, index);
    });
    return pile;
  };
  board.append(makePile("Mazo", "stock", 0, state.stock));
  board.append(makePile("Descarte", "waste", 0, state.waste));
  const spacer = document.createElement("div");
  spacer.className = "solitaire-spacer";
  board.append(spacer);
  state.foundations.forEach((cards, i) =>
    board.append(makePile("Base", "foundation", i, cards)),
  );
  state.columns.forEach((cards, i) => {
    board.append(makePile(`Columna ${i + 1}`, "tableau", i, cards));
  });
}

function makeCard(card, id, offset) {
  const button = document.createElement("button");
  const colorClass = card.red ? " red-suit" : "";
  const faceClass = card.faceUp ? "" : " face-down";
  const selectedClass = state.selected?.id === id ? " selected" : "";
  button.className = `playing-card${colorClass}${faceClass}${selectedClass}`;
  button.style.top = `${offset}px`;
  button.textContent = card.faceUp ? `${card.rank}${card.suit}` : "✳";
  button.setAttribute(
    "aria-label",
    card.faceUp ? `${card.rank} ${card.suit}` : "Carta boca abajo",
  );
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    clickCard(id);
  });
  return button;
}

function clickPile(type, index) {
  if (type === "stock") {
    if (state.stock.length) {
      const card = state.stock.pop();
      card.faceUp = true;
      state.waste.push(card);
    } else if (state.waste.length) {
      state.stock = state.waste
        .reverse()
        .map((card) => ({ ...card, faceUp: false }));
      state.waste = [];
    }
    state.selected = null;
  } else if (type === "foundation" && state.selected) moveToFoundation(index);
  else if (type === "tableau" && state.selected) moveToColumn(index);
  renderSolitaire();
}

function selectedCards() {
  if (!state.selected) return [];
  const { id } = state.selected;
  if (id.startsWith("waste:")) return [state.waste.at(-1)];
  if (id.startsWith("column:")) {
    const [, col, row] = id.split(":").map(Number);
    return state.columns[col].slice(row);
  }
  return [];
}

function removeSelected() {
  const id = state.selected.id;
  if (id.startsWith("waste:")) return state.waste.pop();
  if (id.startsWith("column:")) {
    const [, col, row] = id.split(":").map(Number);
    const removed = state.columns[col].splice(row);
    const top = state.columns[col].at(-1);
    if (top) top.faceUp = true;
    return removed;
  }
  return [];
}

function clickCard(id) {
  if (id.startsWith("stock:")) {
    clickPile("stock", 0);
    return;
  }
  if (id.startsWith("column:")) {
    const [, col, row] = id.split(":").map(Number);
    const card = state.columns[col][row];
    if (!card.faceUp) {
      card.faceUp = true;
      state.selected = null;
    } else if (state.selected) moveToColumn(col);
    else state.selected = { id };
  } else if (id.startsWith("waste:")) {
    state.selected = state.selected?.id === id ? null : { id };
  }
  renderSolitaire();
}

function moveToColumn(index) {
  const cards = selectedCards();
  if (!cards.length) return;
  const target = state.columns[index].at(-1);
  const first = cards[0];
  const canPlaceOnEmpty = !target && first.rank === "K";
  const canPlaceOnCard =
    Boolean(target?.faceUp) &&
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
  const canStartFoundation = !top && card.rank === "A";
  const canAddToFoundation =
    Boolean(top) && top.suit === card.suit && card.value === top.value + 1;
  if (canStartFoundation || canAddToFoundation) {
    const moved = removeSelected();
    foundation.push(Array.isArray(moved) ? moved[0] : moved);
    state.selected = null;
    if (state.foundations.every((pile) => pile.length === 13))
      setStatus("¡Solitario completado!");
  }
}

reset();
