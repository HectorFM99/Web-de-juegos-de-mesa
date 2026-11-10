// Minimal DOM double for exercising js/game.js through its click seams.
// Only the surface game.js uses is implemented.

function createClassList() {
  const classes = new Set();
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    contains: (name) => classes.has(name),
  };
}

function createElement(tag) {
  const listeners = {};
  const attributes = {};
  return {
    tagName: tag.toUpperCase(),
    className: "",
    textContent: "",
    children: [],
    style: {},
    classList: createClassList(),
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    getAttribute(name) {
      return attributes[name] ?? null;
    },
    addEventListener(type, handler) {
      (listeners[type] ??= []).push(handler);
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    replaceChildren(...nodes) {
      this.children = nodes;
    },
    click() {
      (listeners.click ?? []).forEach((handler) =>
        handler({ target: this, stopPropagation() {} }),
      );
    },
  };
}

function installFakeDom(gameName) {
  const board = createElement("div");
  const status = createElement("p");
  const reset = createElement("button");
  const pendingTimers = [];
  let clock = 0;

  global.document = {
    body: { dataset: { game: gameName } },
    querySelector(selector) {
      return { "#board": board, "#status": status, "#reset": reset }[selector] ?? null;
    },
    createElement,
  };
  global.window = {
    setTimeout(callback, delay = 0) {
      pendingTimers.push({ due: clock + delay, callback });
      return pendingTimers.length;
    },
  };

  return {
    board,
    status,
    reset,
    // Advances the fake clock by `ms` and runs every timer that became due.
    advanceTime(ms) {
      clock += ms;
      const due = pendingTimers.filter((timer) => timer.due <= clock);
      pendingTimers.splice(0, pendingTimers.length, ...pendingTimers.filter((timer) => timer.due > clock));
      due.forEach((timer) => timer.callback());
    },
  };
}

module.exports = { installFakeDom };
