const test = require("node:test");
const assert = require("node:assert");
const { installFakeDom } = require("./helpers/fake-dom");

const GAME_PATH = "../js/game.js";

function loadGame(gameName) {
  const dom = installFakeDom(gameName);
  delete require.cache[require.resolve(GAME_PATH)];
  const game = require(GAME_PATH);
  return { dom, game, state: () => game.getState() };
}

const card = (rank, value, suit, { red = false, faceUp = true } = {}) => ({
  rank,
  value,
  suit,
  red,
  faceUp,
});

// Orden de los hijos del tablero: mazo, descarte, separador, 4 bases, 7 columnas.
const PILE = { stock: 0, waste: 1, foundation: (i) => 3 + i, column: (i) => 7 + i };

// --- Carga sin tablero ------------------------------------------------------

test("game.js no falla cuando la página no tiene tablero ni estado", () => {
  global.document = {
    body: { dataset: { game: "chess" } },
    querySelector: () => null,
    createElement: () => ({}),
  };
  delete require.cache[require.resolve(GAME_PATH)];
  const game = require(GAME_PATH);
  assert.strictEqual(game.getState(), undefined);
  assert.doesNotThrow(() => game.reset());
});

test("game.js sin body ni tipo de juego no arranca ninguno", () => {
  const dom = installFakeDom("unknown");
  global.document.body = undefined;
  delete require.cache[require.resolve(GAME_PATH)];
  const game = require(GAME_PATH);
  assert.strictEqual(game.getState(), undefined);
  assert.strictEqual(dom.board.children.length, 0);
});

// --- Damas -----------------------------------------------------------------

test("damas: ganan negras cuando las rojas se quedan sin movimientos", () => {
  const { dom, game, state } = loadGame("checkers");
  const s = state();
  s.cells = new Array(64).fill(null);
  s.cells[17] = { side: "black", king: false };
  s.cells[26] = { side: "red", king: false };
  s.turn = "black";
  s.selected = 17;
  game.applyCheckerMove(35, { to: 35, take: 26 });
  assert.strictEqual(s.done, true);
  assert.strictEqual(dom.status.textContent, "¡Ganan negras!");
});

test("damas: pulsar una casilla no válida con una ficha seleccionada cambia la selección", () => {
  const { dom, state } = loadGame("checkers");
  dom.board.children[40].click();
  assert.strictEqual(state().selected, 40);
  dom.board.children[0].click();
  assert.strictEqual(state().selected, null);
  dom.board.children[42].click();
  dom.board.children[44].click();
  assert.strictEqual(state().selected, 44);
});

test("damas: durante una cadena de capturas no se puede cambiar de ficha", () => {
  const { dom, game, state } = loadGame("checkers");
  const s = state();
  s.cells = new Array(64).fill(null);
  s.cells[56] = { side: "red", king: false };
  s.cells[49] = { side: "black", king: false };
  s.cells[33] = { side: "black", king: false };
  s.cells[62] = { side: "red", king: false };
  s.cells[1] = { side: "black", king: false };
  s.turn = "red";
  s.selected = 56;
  game.applyCheckerMove(42, { to: 42, take: 49 });
  assert.strictEqual(s.selected, 42);
  dom.board.children[62].click();
  assert.strictEqual(s.selected, 42);
});

test("damas: no se puede jugar cuando la partida ha terminado", () => {
  const { dom, state } = loadGame("checkers");
  state().done = true;
  dom.board.children[40].click();
  assert.strictEqual(state().selected, null);
});

// --- Ajedrez ---------------------------------------------------------------

test("ajedrez: ganan negras al capturar el rey blanco", () => {
  const { dom, game, state } = loadGame("chess");
  const s = state();
  s.cells = new Array(64).fill("");
  s.cells[0] = "r";
  s.cells[8] = "K";
  s.turn = "black";
  s.selected = 0;
  game.applyChessMove(8);
  assert.strictEqual(s.done, true);
  assert.strictEqual(dom.status.textContent, "¡Ganan negras!");
});

test("ajedrez: un peón negro que llega a la última fila corona en dama negra", () => {
  const { game, state } = loadGame("chess");
  const s = state();
  s.cells = new Array(64).fill("");
  s.cells[50] = "p";
  s.turn = "black";
  s.selected = 50;
  game.applyChessMove(58);
  assert.strictEqual(s.cells[58], "q");
});

test("ajedrez: no se puede jugar cuando la partida ha terminado", () => {
  const { dom, state } = loadGame("chess");
  state().done = true;
  dom.board.children[52].click();
  assert.strictEqual(state().selected, null);
});

test("ajedrez: una casilla vacía no tiene movimientos", () => {
  const { game } = loadGame("chess");
  assert.deepStrictEqual(game.chessMoves(30), []);
});

test("ajedrez: un peón en el borde o bloqueado no avanza", () => {
  const { game, state } = loadGame("chess");
  const s = state();
  s.cells = new Array(64).fill("");
  s.cells[3] = "P";
  assert.deepStrictEqual(game.chessMoves(3), []);
  s.cells[60] = "p";
  assert.deepStrictEqual(game.chessMoves(60), []);
  s.cells[52] = "P";
  s.cells[44] = "p";
  assert.deepStrictEqual(game.chessMoves(52), []);
});

// --- Solitario -------------------------------------------------------------

function emptySolitaire(state) {
  const s = state();
  s.stock = [];
  s.waste = [];
  s.foundations = [[], [], [], []];
  s.columns = Array.from({ length: 7 }, () => []);
  s.selected = null;
  return s;
}

test("solitario: los montones vacíos muestran su marcador", () => {
  const { dom, game, state } = loadGame("solitaire");
  emptySolitaire(state);
  game.renderSolitaire();
  assert.strictEqual(dom.board.children[PILE.stock].children[0].textContent, "↻");
  assert.strictEqual(dom.board.children[PILE.waste].children[0].textContent, "·");
  assert.strictEqual(dom.board.children[PILE.foundation(0)].children[0].textContent, "A");
  assert.strictEqual(dom.board.children[PILE.column(0)].children[0].textContent, "·");
});

test("solitario: con mazo y descarte vacíos pulsar el mazo no hace nada", () => {
  const { dom, game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  game.renderSolitaire();
  dom.board.children[PILE.stock].click();
  assert.deepStrictEqual(s.stock, []);
  assert.deepStrictEqual(s.waste, []);
});

test("solitario: con el mazo agotado, pulsarlo devuelve el descarte boca abajo", () => {
  const { dom, game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.waste = [card("2", 1, "♠"), card("3", 2, "♠")];
  game.renderSolitaire();
  dom.board.children[PILE.stock].click();
  assert.deepStrictEqual(s.waste, []);
  assert.deepStrictEqual(s.stock.map((c) => c.rank), ["3", "2"]);
  assert.ok(s.stock.every((c) => c.faceUp === false));
});

test("solitario: pulsar el título de un montón vacío cuenta como pulsar el montón", () => {
  const { dom, game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.waste = [card("K", 12, "♠")];
  s.selected = { id: "waste:0:0" };
  game.renderSolitaire();
  const column = dom.board.children[PILE.column(0)];
  const title = column.children[0];
  title.classList.add("pile-title");
  // El clic sobre el título burbujea hasta el montón con el título como target.
  column.click.call(title);
  assert.strictEqual(s.columns[0].length, 1);
  assert.strictEqual(s.columns[0][0].rank, "K");
});

test("solitario: un clic sobre una carta que burbujea al montón no lo activa", () => {
  const { dom, game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.columns[0] = [card("5", 4, "♠")];
  game.renderSolitaire();
  const column = dom.board.children[PILE.column(0)];
  column.click.call(column.children[0]);
  assert.strictEqual(s.selected, null);
});

test("solitario: pulsar una carta del mazo roba una carta", () => {
  const { dom, game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.stock = [card("5", 4, "♣", { faceUp: false })];
  game.renderSolitaire();
  dom.board.children[PILE.stock].children[0].click();
  assert.strictEqual(s.waste.length, 1);
  assert.strictEqual(s.waste[0].faceUp, true);
});

test("solitario: un rey del descarte se puede colocar en una columna vacía", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.waste = [card("K", 12, "♥", { red: true })];
  s.selected = { id: "waste:0:0" };
  game.moveToColumn(2);
  assert.strictEqual(s.columns[2][0].rank, "K");
  assert.strictEqual(s.selected, null);
});

test("solitario: una carta que no es rey no va a una columna vacía", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.waste = [card("Q", 11, "♥", { red: true })];
  s.selected = { id: "waste:0:0" };
  game.moveToColumn(2);
  assert.strictEqual(s.columns[2].length, 0);
  assert.deepStrictEqual(s.selected, { id: "waste:0:0" });
});

test("solitario: moveToColumn y moveToFoundation sin selección no hacen nada", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  game.moveToColumn(0);
  game.moveToFoundation(0);
  assert.deepStrictEqual(s.columns[0], []);
  assert.deepStrictEqual(s.foundations[0], []);
});

test("solitario: pulsar una columna o el descarte sin selección no hace nada", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  game.clickPile("tableau", 0);
  game.clickPile("foundation", 0);
  game.clickPile("waste", 0);
  assert.deepStrictEqual(s.columns[0], []);
  assert.deepStrictEqual(s.foundations[0], []);
});

test("solitario: no se pueden mover varias cartas a la vez a una base", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.columns[0] = [card("A", 0, "♠"), card("2", 1, "♥", { red: true })];
  s.selected = { id: "column:0:0" };
  game.moveToFoundation(0);
  assert.strictEqual(s.foundations[0].length, 0);
  assert.strictEqual(s.columns[0].length, 2);
});

test("solitario: selectedCards y removeSelected ignoran selecciones de otros montones", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  assert.deepStrictEqual(game.selectedCards(), []);
  s.selected = { id: "foundation:0:0" };
  assert.deepStrictEqual(game.selectedCards(), []);
  assert.deepStrictEqual(game.removeSelected(), []);
});

test("solitario: al mover la última carta de una columna no se gira nada", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.columns[0] = [card("A", 0, "♠")];
  s.selected = { id: "column:0:0" };
  const removed = game.removeSelected();
  assert.strictEqual(removed.length, 1);
  assert.deepStrictEqual(s.columns[0], []);
});

test("solitario: completar las cuatro bases anuncia la victoria", () => {
  const { dom, game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  ["♠", "♥", "♣", "♦"].forEach((suit, i) => {
    s.foundations[i] = ranks.slice(0, i === 3 ? 12 : 13).map((r, v) => card(r, v, suit));
  });
  s.waste = [card("K", 12, "♦", { red: true })];
  s.selected = { id: "waste:0:0" };
  game.moveToFoundation(3);
  assert.strictEqual(s.foundations[3].length, 13);
  assert.strictEqual(dom.status.textContent, "¡Solitario completado!");
});

test("solitario: pulsar una carta de una base sin selección no hace nada", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.foundations[0] = [card("A", 0, "♠")];
  game.clickCard("foundation:0:0");
  assert.strictEqual(s.selected, null);
  assert.strictEqual(s.foundations[0].length, 1);
});

test("solitario: un id de carta desconocido no cambia la selección", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  game.clickCard("otro:0:0");
  assert.strictEqual(s.selected, null);
});

test("ajedrez: pulsar una casilla inalcanzable con una pieza seleccionada cambia la selección", () => {
  const { dom, state } = loadGame("chess");
  dom.board.children[52].click();
  assert.strictEqual(state().selected, 52);
  dom.board.children[20].click();
  assert.strictEqual(state().selected, null);
  dom.board.children[52].click();
  dom.board.children[51].click();
  assert.strictEqual(state().selected, 51);
});

// --- Solitario: cartas boca abajo y apilado ------------------------------------

test("solitario: una carta boca abajo con cartas encima no se puede girar", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.columns[2] = [
    card("4", 3, "♣", { faceUp: false }),
    card("9", 8, "♥", { red: true, faceUp: false }),
    card("7", 6, "♠"),
  ];
  game.clickCard("column:2:0");
  game.clickCard("column:2:1");
  assert.strictEqual(s.columns[2][0].faceUp, false);
  assert.strictEqual(s.columns[2][1].faceUp, false);
  assert.strictEqual(s.selected, null);
});

test("solitario: pulsar una carta tapada no pierde la selección actual", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.waste = [card("5", 4, "♦", { red: true })];
  s.columns[1] = [card("J", 10, "♣", { faceUp: false }), card("6", 5, "♠")];
  game.clickCard("waste:0:0");
  game.clickCard("column:1:0");
  assert.deepStrictEqual(s.selected, { id: "waste:0:0" });
  assert.strictEqual(s.columns[1][0].faceUp, false);
});

test("solitario: la carta tapada se puede girar cuando se retiran las de encima", () => {
  const { game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.columns[0] = [card("4", 3, "♣", { faceUp: false })];
  s.columns[1] = [card("8", 7, "♦", { red: true, faceUp: false }), card("K", 12, "♠")];
  game.clickCard("column:1:0");
  assert.strictEqual(s.columns[1][0].faceUp, false);
  // Al mover el rey a una columna vacía, la carta de debajo queda descubierta.
  s.columns[3] = [];
  game.clickCard("column:1:1");
  game.clickPile("tableau", 3);
  assert.strictEqual(s.columns[3][0].rank, "K");
  assert.strictEqual(s.columns[1][0].faceUp, true);
  // Y una carta tapada que queda sola arriba se gira al pulsarla.
  game.clickCard("column:0:0");
  assert.strictEqual(s.columns[0][0].faceUp, true);
});

test("solitario: las cartas de una columna se escalonan y la columna crece con ellas", () => {
  const { dom, game, state } = loadGame("solitaire");
  const s = emptySolitaire(state);
  s.columns[4] = [card("9", 8, "♠", { faceUp: false }), card("8", 7, "♥", { red: true }), card("7", 6, "♠")];
  game.renderSolitaire();
  const column = dom.board.children[PILE.column(4)];
  assert.deepStrictEqual(
    column.children.map((c) => c.style.top),
    ["calc(0 * var(--stack-offset))", "calc(1 * var(--stack-offset))", "calc(2 * var(--stack-offset))"]
  );
  assert.strictEqual(column.style.minHeight, "calc(var(--card-h) + 2 * var(--stack-offset))");
  assert.strictEqual(dom.board.children[PILE.column(0)].style.minHeight, "calc(var(--card-h) + 0 * var(--stack-offset))");
});

test("solitario: mazo, descarte, hueco y las cuatro bases forman la fila superior de 7 casillas", () => {
  const { dom } = loadGame("solitaire");
  const classes = dom.board.children.map((child) => child.className);
  assert.deepStrictEqual(classes.slice(0, 7), [
    "solitaire-pile stock",
    "solitaire-pile waste",
    "solitaire-spacer",
    "solitaire-pile foundation",
    "solitaire-pile foundation",
    "solitaire-pile foundation",
    "solitaire-pile foundation",
  ]);
  assert.ok(classes.slice(7).every((c) => c === "solitaire-pile tableau"));
  assert.strictEqual(classes.length, 14);
});
