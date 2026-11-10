const test = require("node:test");
const assert = require("node:assert");
const { installFakeDom } = require("./helpers/fake-dom");

const dom = installFakeDom("chess");
const game = require("../js/game.js");

// Squares are indexed 0-63: row 0 is black's back rank (0-7), row 7 is white's (56-63).
// Named squares used below: a1 = 56, b1 = 57, c1 = 58, d1 = 59, e2 = 52, d2 = 51,
// e4 = 36, d4 = 35, a7 = 8, d7 = 11, f7 = 13, e8 = 4, a6 = 16, f5 = 29, h5 = 31, d5 = 27.

function click(square) {
  dom.board.children[square].click();
}

function glyphAt(square) {
  return dom.board.children[square].children[0]?.textContent ?? "";
}

function sorted(moves) {
  return [...moves].sort((a, b) => a - b);
}

test("chess: a knight on b1 can jump to a3 and c3 at the start", () => {
  game.startChess();

  assert.deepStrictEqual(sorted(game.chessMoves(57)), [40, 42]);
});

test("chess: a rook on a1 has no moves at the start, blocked by its pawn and knight", () => {
  game.startChess();

  assert.deepStrictEqual(game.chessMoves(56), []);
});

test("chess: a pawn on its starting row can advance one or two squares", () => {
  game.startChess();

  assert.deepStrictEqual(sorted(game.chessMoves(52)), [36, 44]);
});

test("chess: a pawn that has left its starting row cannot advance two squares", () => {
  game.startChess();
  click(52); // e2 -> e4
  click(36);
  click(11); // d7 -> d5
  click(27);

  // Only e5 (28) is ahead, and d5 (27) holds a black pawn to capture.
  // f5 (29) is empty, so it is not a capture target.
  assert.deepStrictEqual(sorted(game.chessMoves(36)), [27, 28]);
});

test("chess: a king moves only one square even when the path is open", () => {
  game.startChess();
  click(52); click(36); // e2 -> e4 opens the e-file for the king
  click(12); click(28); // e7 -> e5

  // Open e-file: e2 (52) and e3 (44) are free, but a king steps only once. e4 is own pawn.
  assert.deepStrictEqual(sorted(game.chessMoves(60)), [52]);
});

test("chess: a bishop on c1 slides along an open diagonal and stops at its own pawn", () => {
  game.startChess();
  click(51); // d2 -> d4 opens the c1-h6 diagonal

  click(35);

  // b2 (49) is still blocked by a friendly pawn, so only the open side is listed.
  assert.deepStrictEqual(sorted(game.chessMoves(58)), [23, 30, 37, 44, 51]);
});

test("chess: a pawn cannot capture a friendly piece on its diagonal", () => {
  game.startChess();
  click(62); // g1 -> f3 puts a white knight on the e2 pawn's diagonal
  click(45);

  // e2 pawn: e3 (44) and e4 (36) are free. f3 (45) holds its own knight and is not a target.
  assert.deepStrictEqual(sorted(game.chessMoves(52)), [36, 44]);
});

test("chess: a pawn captures an enemy piece diagonally and vacates its origin", () => {
  game.startChess();
  click(52); // e2 -> e4
  click(36);
  click(11); // d7 -> d5
  click(27);

  click(36); // exd5
  click(27);

  assert.strictEqual(glyphAt(27), "♙");
  assert.strictEqual(glyphAt(36), "");
});

test("chess: capturing the enemy king ends the game for the capturing side", () => {
  game.startChess();
  click(52); click(36); // 1. e4
  click(13); click(29); // 1... f5
  click(59); click(31); // 2. Qh5
  click(8); click(16); // 2... a6
  click(31); click(4); // 3. Qxe8

  assert.strictEqual(dom.status.textContent, "¡Ganan blancas!");
});

test("chess: no moves are accepted once the game has ended", () => {
  game.startChess();
  click(52); click(36);
  click(13); click(29);
  click(59); click(31);
  click(8); click(16);
  click(31); click(4);

  // It is black's turn now, so h7 is the piece that could move if the game were still running.
  click(15); // h7
  click(23); // h6

  assert.strictEqual(glyphAt(15), "♟", "h7 pawn did not move");
  assert.strictEqual(glyphAt(23), "", "h6 stayed empty");
  assert.strictEqual(dom.status.textContent, "¡Ganan blancas!");
});

test("chess: clicking an enemy piece on your turn does not change the turn", () => {
  game.startChess();
  click(8); // black pawn during white's turn

  assert.strictEqual(dom.status.textContent, "Turno de blancas");
});

test("chess: the reset button restores the starting position", () => {
  game.startChess();
  click(52);
  click(36);
  dom.reset.click();

  assert.strictEqual(dom.status.textContent, "Turno de blancas");
  assert.strictEqual(glyphAt(52), "♙", "white pawn is back on e2");
  assert.strictEqual(glyphAt(36), "", "e4 is empty again");
});
