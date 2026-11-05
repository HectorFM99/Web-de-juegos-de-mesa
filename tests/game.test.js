const test = require("node:test");
const assert = require("node:assert");

// Mock browser globals for Node test environment
let mockStatusContent = "";
const mockStatus = {
  get textContent() { return mockStatusContent; },
  set textContent(v) { mockStatusContent = v; }
};

const mockBoard = {
  children: [],
  replaceChildren(...children) {
    this.children = children;
  },
  append(...children) {
    this.children.push(...children);
  }
};

global.document = {
  body: { dataset: { game: "tic-tac-toe" } },
  querySelector: (selector) => {
    if (selector === "#board") return mockBoard;
    if (selector === "#status") return mockStatus;
    if (selector === "#reset") return null;
    return null;
  },
  createElement: (tag) => {
    const el = {
      tagName: tag.toUpperCase(),
      className: "",
      textContent: "",
      children: [],
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      style: {},
      attributes: {},
      setAttribute(name, val) { this.attributes[name] = val; },
      getAttribute(name) { return this.attributes[name]; },
      addEventListener(event, handler) {
        if (!this.listeners) this.listeners = {};
        this.listeners[event] = handler;
      },
      append(...children) {
        this.children.push(...children);
      },
      replaceChildren(...children) {
        this.children = children;
      },
      click() {
        if (this.listeners && this.listeners.click) {
          this.listeners.click({ stopPropagation: () => {}, target: this });
        }
      }
    };
    return el;
  }
};

global.window = {
  setTimeout: (fn) => fn(),
};

const gameModule = require("../js/game.js");

test("winnerLine detects wins and non-wins", () => {
  const cells = [
    ["X", "X", "X"],
    ["O", "O", ""],
    ["", "", ""],
  ];
  const win = gameModule.winnerLine(cells, 3, 3, 0, 1, "X", [[0, 1], [1, 0], [1, 1], [1, -1]]);
  assert.strictEqual(win, true);

  const noWin = gameModule.winnerLine(cells, 3, 3, 0, 1, "O", [[0, 1], [1, 0], [1, 1], [1, -1]]);
  assert.strictEqual(noWin, false);
});

test("board coordinate and index helpers", () => {
  assert.strictEqual(gameModule.isOnBoard(0, 0), true);
  assert.strictEqual(gameModule.isOnBoard(8, 0), false);
  assert.strictEqual(gameModule.boardIndex(1, 2), 10);
});

test("checker helpers and moves", () => {
  assert.deepStrictEqual(gameModule.checkerDirections({ side: "red", king: false }), [-1]);
  assert.deepStrictEqual(gameModule.checkerDirections({ side: "black", king: false }), [1]);
  assert.deepStrictEqual(gameModule.checkerDirections({ side: "red", king: true }), [-1, 1]);

  gameModule.startCheckers();
  assert.doesNotThrow(() => gameModule.checkerMovesFor(0));
  assert.doesNotThrow(() => gameModule.checkMoves(0));
});

test("chess side, directions and moves", () => {
  assert.strictEqual(gameModule.chessSide("K"), "white");
  assert.strictEqual(gameModule.chessSide("k"), "black");
  assert.strictEqual(gameModule.chessDirections("b").length, 4);
  assert.strictEqual(gameModule.chessDirections("r").length, 4);
  assert.strictEqual(gameModule.chessDirections("q").length, 8);
  assert.strictEqual(gameModule.chessDirections("p").length, 0);

  gameModule.startChess();
  assert.doesNotThrow(() => gameModule.chessMoves(0));
  assert.doesNotThrow(() => gameModule.selectChessPiece(0));
});

test("Tic-Tac-Toe gameplay (win and tie)", () => {
  gameModule.startTicTacToe();
  assert.strictEqual(mockBoard.children.length, 9);

  mockBoard.children[0].click(); // X
  mockBoard.children[3].click(); // O
  mockBoard.children[1].click(); // X
  mockBoard.children[4].click(); // O
  mockBoard.children[2].click(); // X wins

  assert.match(mockStatus.textContent, /gana/);

  mockBoard.children[5].click();

  gameModule.startTicTacToe();
  const tieOrder = [0, 2, 1, 3, 5, 4, 6, 8, 7];
  tieOrder.forEach(idx => mockBoard.children[idx].click());
  assert.match(mockStatus.textContent, /Empate/);
});

test("Connect Four gameplay", () => {
  gameModule.startConnectFour();
  assert.strictEqual(mockBoard.children.length, 42);

  for (let i = 0; i < 4; i++) {
    mockBoard.children[0].click(); // red
    mockBoard.children[1].click(); // yellow
  }
  mockBoard.children[0].click(); // red win
  assert.match(mockStatus.textContent, /Ganan/);
});

test("Memory game play (matches and mismatches)", () => {
  gameModule.startMemory();
  assert.strictEqual(mockBoard.children.length, 16);

  mockBoard.children[0].click();
  mockBoard.children[0].click(); // already open
  mockBoard.children[1].click(); // mismatch
});

test("Checkers advanced gameplay and movement", () => {
  gameModule.startCheckers();
  const pieceIdx = 41; // red piece
  assert.doesNotThrow(() => gameModule.clickCheckers(pieceIdx));
  const moves = gameModule.checkMoves(pieceIdx);
  if (moves.length > 0) {
    assert.doesNotThrow(() => gameModule.applyCheckerMove(moves[0].to, moves[0]));
  }
});

test("Chess advanced gameplay and movement", () => {
  gameModule.startChess();
  const pawnMoves = gameModule.chessMoves(52);
  assert.ok(pawnMoves.length > 0);
  assert.doesNotThrow(() => gameModule.selectChessPiece(52));
  assert.doesNotThrow(() => gameModule.applyChessMove(pawnMoves[0]));
  assert.doesNotThrow(() => gameModule.clickChess(52));
});

test("Solitaire gameplay and actions", () => {
  gameModule.startSolitaire();
  assert.ok(mockBoard.children.length > 0);

  assert.doesNotThrow(() => gameModule.clickPile("stock", 0));
  assert.doesNotThrow(() => gameModule.clickPile("waste", 0));
  assert.doesNotThrow(() => gameModule.clickPile("foundation", 0));
  assert.doesNotThrow(() => gameModule.clickPile("tableau", 0));
  assert.doesNotThrow(() => gameModule.clickCard("stock:0:0"));
  assert.doesNotThrow(() => gameModule.clickCard("waste:0:0"));
  assert.doesNotThrow(() => gameModule.clickCard("column:0:0"));
  assert.doesNotThrow(() => gameModule.moveToColumn(0));
  assert.doesNotThrow(() => gameModule.moveToFoundation(0));
});

test("Game starters and reset", () => {
  assert.doesNotThrow(() => gameModule.startTicTacToe());
  assert.doesNotThrow(() => gameModule.startConnectFour());
  assert.doesNotThrow(() => gameModule.startMemory());
  assert.doesNotThrow(() => gameModule.startCheckers());
  assert.doesNotThrow(() => gameModule.startChess());
  assert.doesNotThrow(() => gameModule.startSolitaire());
  assert.doesNotThrow(() => gameModule.reset());
});
