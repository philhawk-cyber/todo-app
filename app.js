(() => {
  "use strict";

  const STORAGE_KEY = "todo-app.items.v1";

  /** @typedef {{ id: string, text: string, done: boolean, createdAt: number }} Todo */

  /** @type {Todo[]} */
  let todos = load();
  /** @type {"all" | "active" | "completed"} */
  let filter = "all";

  // --- DOM ---
  const form = document.getElementById("new-form");
  const input = document.getElementById("new-input");
  const listEl = document.getElementById("todo-list");
  const emptyEl = document.getElementById("empty");
  const footerEl = document.getElementById("footer");
  const countEl = document.getElementById("count");
  const clearBtn = document.getElementById("clear-completed");
  const filterBtns = Array.from(document.querySelectorAll(".filter"));

  // --- persistence ---
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (t) => t && typeof t.id === "string" && typeof t.text === "string"
      );
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      /* storage full or unavailable — keep working in memory */
    }
  }

  // --- mutations ---
  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.push({
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
      createdAt: Date.now(),
    });
    save();
    render();
  }

  function toggleTodo(id) {
    const t = todos.find((t) => t.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    render();
  }

  function editTodo(id, text) {
    const t = todos.find((t) => t.id === id);
    if (!t) return;
    const trimmed = text.trim();
    if (trimmed) {
      t.text = trimmed;
    } else {
      todos = todos.filter((t) => t.id !== id);
    }
    save();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    save();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.done);
    save();
    render();
  }

  // --- rendering ---
  function visibleTodos() {
    if (filter === "active") return todos.filter((t) => !t.done);
    if (filter === "completed") return todos.filter((t) => t.done);
    return todos;
  }

  function render() {
    const visible = visibleTodos();

    listEl.replaceChildren(...visible.map(renderItem));

    const hasAny = todos.length > 0;
    emptyEl.hidden = visible.length > 0;
    emptyEl.textContent = hasAny ? "該当するタスクはありません" : "タスクはありません 🎉";

    footerEl.hidden = !hasAny;
    const remaining = todos.filter((t) => !t.done).length;
    countEl.textContent = `未完了 ${remaining} 件`;

    const doneCount = todos.length - remaining;
    clearBtn.disabled = doneCount === 0;

    for (const btn of filterBtns) {
      btn.classList.toggle("is-active", btn.dataset.filter === filter);
    }
  }

  /** @param {Todo} todo */
  function renderItem(todo) {
    const li = document.createElement("li");
    li.className = "todo" + (todo.done ? " is-done" : "");
    li.dataset.id = todo.id;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "todo__check";
    check.checked = todo.done;
    check.setAttribute("aria-label", "完了にする");
    check.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className = "todo__text";
    text.textContent = todo.text;
    text.title = "ダブルクリックで編集";
    text.addEventListener("dblclick", () => startEdit(li, todo));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "todo__delete";
    del.textContent = "×";
    del.setAttribute("aria-label", `「${todo.text}」を削除`);
    del.addEventListener("click", () => deleteTodo(todo.id));

    li.append(check, text, del);
    return li;
  }

  /** @param {HTMLLIElement} li @param {Todo} todo */
  function startEdit(li, todo) {
    const field = document.createElement("input");
    field.type = "text";
    field.className = "todo__edit";
    field.value = todo.text;
    field.maxLength = 200;

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      editTodo(todo.id, field.value);
    };

    field.addEventListener("blur", commit);
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        committed = true;
        render();
      }
    });

    li.replaceChildren(field);
    field.focus();
    field.select();
  }

  // --- events ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = "";
    input.focus();
  });

  clearBtn.addEventListener("click", clearCompleted);

  for (const btn of filterBtns) {
    btn.addEventListener("click", () => {
      filter = /** @type {any} */ (btn.dataset.filter);
      render();
    });
  }

  // keep multiple tabs in sync
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      todos = load();
      render();
    }
  });

  render();
})();
