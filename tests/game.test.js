const test = require("node:test");
const assert = require("node:assert");

// Mock browser globals for Node test environment
global.document = {
  body: { dataset: { game: "tic-tac-toe" } },
  querySelector: () => ({
    replaceChildren: () => {},
    append: () => {},
    children: [],
    classList: { add: () => {}, remove: () => {} },
    setAttribute: () => {},
    addEventListener: () => {},
  }),
  createElement: () => ({
    classList: { add: () => {}, remove: () => {} },
    setAttribute: () => {},
    addEventListener: () => {},
    append: () => {},
    replaceChildren: () => {},
    style: {},
  }),
};
global.window = {
  setTimeout: (fn) => fn(),
};

const gameModule = require("../js/game.js");

test("winnerLine detects wins", () => {
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

test("checker helpers", () => {
  assert.deepStrictEqual(gameModule.checkerDirections({ side: "red", king: false }), [-1]);
  assert.deepStrictEqual(gameModule.checkerDirections({ side: "black", king: false }), [1]);
  assert.deepStrictEqual(gameModule.checkerDirections({ side: "red", king: true }), [-1, 1]);
});

test("chess side and directions", () => {
  assert.strictEqual(gameModule.chessSide("K"), "white");
  assert.strictEqual(gameModule.chessSide("k"), "black");
  assert.strictEqual(gameModule.chessDirections("b").length, 4);
  assert.strictEqual(gameModule.chessDirections("r").length, 4);
  assert.strictEqual(gameModule.chessDirections("q").length, 8);
});

test("game starters run without error", () => {
  assert.doesNotThrow(() => gameModule.startTicTacToe());
  assert.doesNotThrow(() => gameModule.startConnectFour());
  assert.doesNotThrow(() => gameModule.startMemory());
  assert.doesNotThrow(() => gameModule.startCheckers());
  assert.doesNotThrow(() => gameModule.startChess());
  assert.doesNotThrow(() => gameModule.startSolitaire());
  assert.doesNotThrow(() => gameModule.reset());
});

test("checkers and chess extra functions", () => {
  gameModule.startCheckers();
  assert.doesNotThrow(() => gameModule.checkerMovesFor(0));
  assert.doesNotThrow(() => gameModule.checkMoves(0));

  gameModule.startChess();
  assert.doesNotThrow(() => gameModule.chessMoves(0, 0));
  assert.doesNotThrow(() => gameModule.selectChessPiece(0));

  gameModule.startSolitaire();
  assert.deepStrictEqual(gameModule.selectedCards(), []);
  assert.doesNotThrow(() => gameModule.moveToColumn(0));
  assert.doesNotThrow(() => gameModule.moveToFoundation(0));
});
