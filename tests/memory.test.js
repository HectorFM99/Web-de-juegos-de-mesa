const test = require("node:test");
const assert = require("node:assert");
const { installFakeDom } = require("./helpers/fake-dom");

const dom = installFakeDom("memory");
const game = require("../js/game.js");

// With a constant random value the comparator returns 0 for every pair, so
// the deck keeps its natural order: card i and card i + 8 always form a pair.
const PAIR_OFFSET = 8;

function withUnshuffledDeck(run) {
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    run();
  } finally {
    Math.random = originalRandom;
  }
}

function startUnshuffledMemory() {
  withUnshuffledDeck(() => game.startMemory());
}

function isRevealed(index) {
  return dom.board.children[index].classList.contains("revealed");
}

function isMatched(index) {
  return dom.board.children[index].classList.contains("matched");
}

test("memory: a matching pair stays face up and is marked as matched", () => {
  startUnshuffledMemory();

  dom.board.children[0].click();
  dom.board.children[PAIR_OFFSET].click();

  assert.ok(isMatched(0));
  assert.ok(isMatched(PAIR_OFFSET));
  assert.strictEqual(dom.status.textContent, "Parejas encontradas: 1 de 8 · Intentos: 1");
});

test("memory: clicking the same card twice is not an attempt", () => {
  startUnshuffledMemory();

  dom.board.children[0].click();
  dom.board.children[0].click();

  assert.strictEqual(dom.status.textContent, "Parejas encontradas: 0 de 8");

  dom.board.children[PAIR_OFFSET].click();
  assert.strictEqual(dom.status.textContent, "Parejas encontradas: 1 de 8 · Intentos: 1");
});

test("memory: a mismatch counts as an attempt, hides both cards and blocks input meanwhile", () => {
  startUnshuffledMemory();

  dom.board.children[0].click();
  dom.board.children[1].click();

  assert.strictEqual(dom.status.textContent, "Parejas encontradas: 0 de 8 · Intentos: 1");

  dom.board.children[2].click();
  assert.strictEqual(isRevealed(2), false, "no card can be opened while a mismatch is shown");

  dom.advanceTime(749);
  assert.ok(isRevealed(0), "the mismatch stays visible until the delay has elapsed");

  dom.advanceTime(1);
  assert.strictEqual(isRevealed(0), false);
  assert.strictEqual(isRevealed(1), false);
  assert.strictEqual(dom.board.children[0].textContent, "");
  assert.strictEqual(dom.board.children[1].textContent, "");

  dom.board.children[2].click();
  assert.strictEqual(isRevealed(2), true, "input is accepted again after the mismatch closes");
});

test("memory: failed attempts are counted together with successful ones", () => {
  startUnshuffledMemory();

  dom.board.children[0].click();
  dom.board.children[1].click();
  dom.advanceTime(750);

  dom.board.children[0].click();
  dom.board.children[PAIR_OFFSET].click();

  assert.strictEqual(dom.status.textContent, "Parejas encontradas: 1 de 8 · Intentos: 2");
});

test("memory: finding every pair announces the victory with the number of attempts", () => {
  startUnshuffledMemory();

  for (let index = 0; index < PAIR_OFFSET; index++) {
    dom.board.children[index].click();
    dom.board.children[index + PAIR_OFFSET].click();
  }

  assert.strictEqual(dom.status.textContent, "¡Todas las parejas! Lo lograste en 8 intentos.");
  for (let index = 0; index < dom.board.children.length; index++) {
    assert.ok(isMatched(index), `card ${index} should be matched`);
  }
});

test("memory: the reset button starts a new game with no matches", () => {
  startUnshuffledMemory();

  dom.board.children[0].click();
  dom.board.children[PAIR_OFFSET].click();
  dom.reset.click();

  assert.strictEqual(dom.status.textContent, "Parejas encontradas: 0 de 8");
  assert.strictEqual(isMatched(0), false);
  assert.strictEqual(isMatched(PAIR_OFFSET), false);
});
