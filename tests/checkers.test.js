const test = require("node:test");
const assert = require("node:assert");
const { installFakeDom } = require("./helpers/fake-dom");

const dom = installFakeDom("checkers");
const game = require("../js/game.js");

// Squares are indexed 0-63, row 0 at the top. Red starts on the bottom rows
// and moves toward row 0 (up); black starts on the top rows and moves down.
// Pieces sit on the dark squares, where (row + column) is odd.
//
// Verified starting squares:
//   red:   40 42 44 46 49 51 53 55 56 58 60 62
//   black:  1  3  5  7  8 10 12 14 17 19 21 23

function click(square) {
  dom.board.children[square].click();
}

function sorted(values) {
  return [...values].sort((a, b) => a - b);
}

function targets(moves) {
  return sorted(moves.map((move) => move.to));
}

function hasPiece(square) {
  return dom.board.children[square].children.length > 0;
}

function pieceClass(square) {
  return dom.board.children[square].children[0]?.className ?? "";
}

function isSelected(square) {
  return dom.board.children[square].className.includes("selected");
}

// Plays a sequence of clicks in pairs: origin, then destination.
function play(...pairs) {
  for (let i = 0; i < pairs.length; i += 2) {
    click(pairs[i]);
    click(pairs[i + 1]);
  }
}

test("checkers: a red man on the edge has one forward diagonal at the start", () => {
  game.startCheckers();

  assert.deepStrictEqual(targets(game.checkMoves(40)), [33]);
});

test("checkers: a red man in the middle has two forward diagonals at the start", () => {
  game.startCheckers();

  assert.deepStrictEqual(targets(game.checkMoves(42)), [33, 35]);
});

test("checkers: an empty square has no moves", () => {
  game.startCheckers();

  assert.deepStrictEqual(game.checkMoves(33), []);
});

test("checkers: clicking one of your pieces selects it", () => {
  game.startCheckers();
  click(42);

  assert.ok(isSelected(42));
});

test("checkers: moving to an empty diagonal passes the turn to black", () => {
  game.startCheckers();
  play(42, 33);

  assert.strictEqual(dom.status.textContent, "Turno de negras");
  assert.strictEqual(hasPiece(42), false, "origin is empty");
  assert.strictEqual(pieceClass(33), "checker-piece ");
});

test("checkers: clicking an empty square without a selection keeps the turn with red", () => {
  game.startCheckers();
  click(0);
  click(16);

  assert.strictEqual(dom.status.textContent, "Turno de rojas");
});

test("checkers: a red man captures a black man diagonally and lands on the empty square beyond", () => {
  game.startCheckers();
  // Black 17 steps to 26 so red 35 can jump it. 17 is then empty.
  play(44, 35, 17, 26);
  // Red 35 (row 4, col 3) jumps black 26 (row 3, col 2) and lands on 17 (row 2, col 1).
  click(35);
  click(17);

  assert.strictEqual(hasPiece(26), false, "captured black man is removed");
  assert.strictEqual(hasPiece(35), false, "origin is empty");
  assert.ok(pieceClass(17).includes("checker-piece"), "red man now sits on 17");
  assert.ok(!pieceClass(17).includes("black"), "the piece on 17 is red");
});

test("checkers: after a capture, the turn passes when the capturing piece has no further capture", () => {
  game.startCheckers();
  play(44, 35, 17, 26);
  play(35, 17);

  // From 17, black pieces on 8 and 10 cannot be jumped (landing squares are blocked),
  // so there is no continuation and the turn passes to black.
  assert.deepStrictEqual(game.checkMoves(17), []);
  assert.strictEqual(dom.status.textContent, "Turno de negras");
});

test("checkers: when any piece can capture, a plain move by another piece is not allowed", () => {
  game.startCheckers();
  play(44, 35, 17, 26);

  // Piece 40 has a plain move to 33 in the starting position, but red 35 can capture.
  // Captures are mandatory, so 40 is left with no legal moves.
  assert.deepStrictEqual(game.checkMoves(40), []);
  assert.deepStrictEqual(targets(game.checkMoves(35)), [17]);
});

test("checkers: a capture that can be continued keeps the same piece selected", () => {
  game.startCheckers();
  // Verified position: after red 35x17, the piece on 17 can jump black 10 to land on 3.
  play(44, 35, 17, 26, 35, 17, 10, 24, 40, 33, 23, 30, 33, 26, 19, 33, 51, 44, 33, 51, 60, 42, 3, 10, 44, 37, 30, 44, 53, 35, 8, 17, 62, 53, 17, 26);
  play(35, 17);

  assert.strictEqual(dom.status.textContent, "¡Sigue capturando con esa ficha!");
  assert.ok(isSelected(17), "the same piece stays selected");
  assert.deepStrictEqual(targets(game.checkMoves(17)), [3]);
});

test("checkers: the continuation of a capture must be made by the same piece", () => {
  game.startCheckers();
  play(44, 35, 17, 26, 35, 17, 10, 24, 40, 33, 23, 30, 33, 26, 19, 33, 51, 44, 33, 51, 60, 42, 3, 10, 44, 37, 30, 44, 53, 35, 8, 17, 62, 53, 17, 26);
  play(35, 17);

  // Another red piece cannot start moving while the chain is in progress.
  click(42);
  click(33);

  assert.strictEqual(hasPiece(42), true, "the other red piece did not move");
  assert.ok(isSelected(17), "the chain keeps its piece selected");
});

test("checkers: a multi-capture chain ends and the man is crowned on the last row", () => {
  game.startCheckers();
  // Replayed with black's replies in place: 35x17, black 10->24, then 35x17 pieces move through to row 0.
  play(44, 35, 17, 26, 35, 17, 10, 24, 40, 33, 23, 30, 33, 26, 19, 33, 51, 44, 33, 51, 60, 42, 3, 10, 44, 37, 30, 44, 53, 35, 8, 17, 62, 53, 17, 26, 35, 17, 17, 3);

  assert.ok(pieceClass(3).includes("king"), "red man reached row 0 and became a king");
  assert.strictEqual(hasPiece(10), false, "black man on 10 was captured earlier in the chain");
});

test("checkers: the game ends when black has no pieces left to move", () => {
  game.startCheckers();
  play(
    44, 35, 17, 26, 35, 17, 10, 24, 40, 33, 23, 30, 33, 26, 19, 33, 51, 44, 33, 51,
    60, 42, 3, 10, 44, 37, 30, 44, 53, 35, 8, 17, 62, 53, 17, 26, 35, 17, 17, 3,
    24, 33, 42, 24, 14, 23, 58, 51, 21, 28, 3, 21, 21, 35, 5, 14, 51, 42, 1, 10,
    24, 17, 10, 24, 46, 39, 23, 30, 39, 21, 14, 28, 35, 21, 24, 33, 42, 24, 7, 14, 21, 7,
  );

  assert.strictEqual(dom.status.textContent, "¡Ganan rojas!");
});

test("checkers: no moves are accepted after the game has ended", () => {
  game.startCheckers();
  play(
    44, 35, 17, 26, 35, 17, 10, 24, 40, 33, 23, 30, 33, 26, 19, 33, 51, 44, 33, 51,
    60, 42, 3, 10, 44, 37, 30, 44, 53, 35, 8, 17, 62, 53, 17, 26, 35, 17, 17, 3,
    24, 33, 42, 24, 14, 23, 58, 51, 21, 28, 3, 21, 21, 35, 5, 14, 51, 42, 1, 10,
    24, 17, 10, 24, 46, 39, 23, 30, 39, 21, 14, 28, 35, 21, 24, 33, 42, 24, 7, 14, 21, 7,
  );
  // Red piece 49 still has legal moves to 40 and 42 at this point. If the game were
  // still running, clicking it would select it; after the end it must do nothing.
  click(49);

  assert.strictEqual(isSelected(49), false, "a finished game does not select pieces");
  assert.strictEqual(dom.status.textContent, "¡Ganan rojas!");
});

test("checkers: the reset button restores the starting position", () => {
  game.startCheckers();
  play(42, 33);
  dom.reset.click();

  assert.strictEqual(dom.status.textContent, "Turno de rojas");
  assert.strictEqual(hasPiece(42), true, "red man is back on 42");
  assert.strictEqual(hasPiece(33), false, "33 is empty again");
});
