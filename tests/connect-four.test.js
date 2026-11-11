const test = require("node:test");
const assert = require("node:assert");
const { installFakeDom } = require("./helpers/fake-dom");

const dom = installFakeDom("connect-four");
const game = require("../js/game.js");

// Columns are 0-6. Clicking any cell in a column drops a piece into it;
// the first cell of each column (row 0 in the DOM) is used for that.
function play(columns) {
  columns.forEach((column) => dom.board.children[column].click());
}

function cellClasses(row, column) {
  return dom.board.children[row * 7 + column].classList;
}

test("connect four: pieces stack from the bottom of the column", () => {
  game.startConnectFour();
  play([3]);

  assert.ok(cellClasses(5, 3).contains("red"));
  assert.strictEqual(dom.status.textContent, "Turno de amarillas");
});

test("connect four: four in a column wins for the player who made it", () => {
  game.startConnectFour();
  // Red stacks column 0 while yellow plays column 1.
  play([0, 1, 0, 1, 0, 1, 0]);

  assert.strictEqual(dom.status.textContent, "¡Ganan rojas!");
});

test("connect four: four in a row wins horizontally", () => {
  game.startConnectFour();
  play([0, 0, 1, 1, 2, 2, 3]);

  assert.strictEqual(dom.status.textContent, "¡Ganan rojas!");
});

test("connect four: four on a diagonal wins", () => {
  game.startConnectFour();
  // Red finishes the diagonal (5,0) (4,1) (3,2) (2,3).
  play([0, 1, 1, 2, 6, 2, 2, 3, 3, 3, 3]);

  assert.strictEqual(dom.status.textContent, "¡Ganan rojas!");
});

test("connect four: yellow can win too", () => {
  game.startConnectFour();
  // Yellow stacks column 0 while red plays elsewhere.
  play([1, 0, 2, 0, 3, 0, 5, 0]);

  assert.strictEqual(dom.status.textContent, "¡Ganan amarillas!");
});

test("connect four: a full board without a winner is a draw", () => {
  game.startConnectFour();
  // Verified no-winner sequence that fills all 42 cells.
  play([4, 6, 1, 0, 6, 2, 0, 1, 3, 5, 0, 5, 2, 6, 2, 4, 0, 5, 2, 3, 5, 2, 5, 0, 3, 0, 4, 1, 2, 4, 3, 5, 3, 1, 1, 4, 1, 3, 6, 6, 6, 4]);

  assert.strictEqual(dom.status.textContent, "Empate. ¡A por la revancha!");
});

test("connect four: a full column rejects the move without passing the turn", () => {
  game.startConnectFour();
  // Six alternating moves fill column 0 with no four in a row; it is red's turn again.
  play([0, 0, 0, 0, 0, 0]);
  assert.strictEqual(dom.status.textContent, "Turno de rojas");

  play([0]);
  assert.strictEqual(dom.status.textContent, "Turno de rojas");

  play([1]);
  assert.strictEqual(dom.status.textContent, "Turno de amarillas");
});

test("connect four: no moves are accepted after the game is decided", () => {
  game.startConnectFour();
  play([0, 1, 0, 1, 0, 1, 0]);
  assert.strictEqual(dom.status.textContent, "¡Ganan rojas!");

  play([2]);
  assert.strictEqual(cellClasses(5, 2).contains("yellow"), false);
  assert.strictEqual(dom.status.textContent, "¡Ganan rojas!");
});

test("connect four: the reset button starts a new empty board", () => {
  game.startConnectFour();
  play([0, 1, 0, 1, 0, 1, 0]);
  dom.reset.click();

  assert.strictEqual(dom.status.textContent, "Turno de rojas");
  assert.strictEqual(cellClasses(5, 0).contains("red"), false);
});
