import { defineStore } from "pinia";
import { reactive, computed, watch } from "vue";
import type {
  BoardState,
  Column,
  Ticket,
  Id,
  Priority,
} from "../app/types/board";
import { COLUMN_TITLE_ES_BY_EN } from "../app/types/board";

function uid(): Id {
  return crypto.randomUUID();
}

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeText(s: string) {
  return stripDiacritics(s).trim().replace(/\s+/g, " ").toLowerCase();
}

function isOnlyLettersAndSpaces(s: string) {
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(s);
}

function normalizeFullName(s: string) {
  return stripDiacritics(s).trim().replace(/\s+/g, " ").toLowerCase();
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

const DONE_COLUMN_ID = "c_done";

const STORAGE_KEY = "app-de-tareas.board.v1";

function defaultState(): BoardState {
  return {
    users: [],
    tickets: {},
    columns: [
      { id: "c_todo", title: "To Do", ticketIds: [] },
      { id: "c_prog", title: "In Progress", ticketIds: [] },
      { id: DONE_COLUMN_ID, title: "Done", ticketIds: [] },
    ],
    events: [],
    ui: {
      activeTicketId: null,
    },
  };
}

function loadFromLocalStorage(): BoardState {
  if (typeof window === "undefined") return defaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();

    const parsed = JSON.parse(raw) as Partial<BoardState> | null;
    if (!parsed || typeof parsed !== "object") return defaultState();

    const base = defaultState();

    return {
      ...base,
      ...parsed,
      ui: { ...base.ui, ...(parsed.ui ?? {}) },
      users: Array.isArray(parsed.users) ? parsed.users : base.users,
      columns: Array.isArray(parsed.columns) ? parsed.columns : base.columns,
      events: Array.isArray(parsed.events) ? parsed.events : base.events,
      tickets:
        parsed.tickets && typeof parsed.tickets === "object"
          ? (parsed.tickets as any)
          : base.tickets,
    };
  } catch {
    return defaultState();
  }
}

function saveToLocalStorage(state: BoardState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const useBoardStore = defineStore("board", () => {
  const state = reactive<BoardState>(loadFromLocalStorage());

  watch(
    state,
    (s) => {
      saveToLocalStorage(s);
    },
    { deep: true },
  );

  // --- Getters ---
  const activeTicket = computed(() => {
    return state.ui.activeTicketId
      ? state.tickets[state.ui.activeTicketId]
      : null;
  });

  const doneColumnId = computed(() => DONE_COLUMN_ID);

  // --- Actions ---
  function addColumn(
    title: string,
    insertIndex?: number,
  ): { ok: true } | { ok: false; error: string } {
    const clean = title.trim().replace(/\s+/g, " ");

    if (!clean)
      return { ok: false, error: "El nombre de la columna es obligatorio." };

    if (!isOnlyLettersAndSpaces(clean)) {
      return {
        ok: false,
        error: "Solo se permiten letras y espacios (sin números).",
      };
    }

    const newNorm = normalizeText(clean);

    const exists = state.columns.some((c) => {
      const internal = normalizeText(c.title);

      const visibleEs = COLUMN_TITLE_ES_BY_EN[c.title]
        ? normalizeText(COLUMN_TITLE_ES_BY_EN[c.title]!)
        : null;

      return internal === newNorm || visibleEs === newNorm;
    });

    if (exists)
      return { ok: false, error: "Ya existe una columna con ese nombre." };

    const col: Column = { id: uid(), title: clean, ticketIds: [] };

    const idxRaw = insertIndex ?? state.columns.length;
    const idx = Math.max(0, Math.min(state.columns.length, idxRaw));
    state.columns.splice(idx, 0, col);

    return { ok: true };
  }

  function deleteColumn(
    columnId: Id,
  ): { ok: true } | { ok: false; error: string } {
    if (columnId.startsWith("c_")) {
      return {
        ok: false,
        error: "No se pueden borrar las columnas por defecto.",
      };
    }

    const idx = state.columns.findIndex((c) => c.id === columnId);
    if (idx === -1) return { ok: false, error: "Columna no encontrada." };

    const col = state.columns[idx];
    if (!col) return { ok: false, error: "Columna no encontrada." };

    for (const ticketId of col.ticketIds) {
      delete state.tickets[ticketId];
      if (state.ui.activeTicketId === ticketId) state.ui.activeTicketId = null;
    }

    state.columns.splice(idx, 1);
    return { ok: true };
  }

  function addUser(name: string): { ok: true } | { ok: false; error: string } {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return { ok: false, error: "El nombre es obligatorio." };

    const exists = state.users.some(
      (u) => normalizeFullName(u.name) === normalizeFullName(clean),
    );
    if (exists) return { ok: false, error: "Ese participante ya existe." };

    state.users.push({
      id: uid(),
      name: clean,
      avatar: initialsFromName(clean),
    });

    return { ok: true };
  }

  function addTicket(
    columnId: Id,
    title: string,
    description = "",
    priority: Priority = "MEDIUM",
  ) {
    const t: Ticket = {
      id: uid(),
      title,
      description,
      priority,
      createdAt: Date.now(),
    };

    state.tickets[t.id] = t;

    const col = state.columns.find((c) => c.id === columnId);
    if (!col) return;
    col.ticketIds.push(t.id);
  }

  function setPriority(ticketId: Id, priority: Priority) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.priority = priority;
  }

  function openTicket(ticketId: Id) {
    state.ui.activeTicketId = ticketId;
  }

  function closeTicket() {
    state.ui.activeTicketId = null;
  }

  function setAssignee(ticketId: Id, assigneeId: Id | undefined) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.assigneeId = assigneeId;
  }

  function setDescription(ticketId: Id, description: string) {
    const t = state.tickets[ticketId];
    if (!t) return;
    t.description = description;
  }

  function moveTicket(ticketId: Id, fromColumnId: Id, toColumnId: Id) {
    if (fromColumnId === toColumnId) return;

    const from = state.columns.find((c) => c.id === fromColumnId);
    const to = state.columns.find((c) => c.id === toColumnId);
    if (!from || !to) return;

    const idx = from.ticketIds.indexOf(ticketId);
    if (idx === -1) return;

    from.ticketIds.splice(idx, 1);
    to.ticketIds.push(ticketId);

    state.events.push({
      type: "MOVED",
      ticketId,
      fromColumnId,
      toColumnId,
      at: Date.now(),
    });

    if (toColumnId === DONE_COLUMN_ID) {
      state.events.push({ type: "COMPLETED", ticketId, at: Date.now() });
    }
  }

  function deleteTicket(ticketId: Id) {
    const t = state.tickets[ticketId];
    if (!t) return;

    delete state.tickets[ticketId];

    for (const col of state.columns) {
      const idx = col.ticketIds.indexOf(ticketId);
      if (idx !== -1) col.ticketIds.splice(idx, 1);
    }

    if (state.ui.activeTicketId === ticketId) {
      state.ui.activeTicketId = null;
    }

    state.events.push({ type: "DELETED" as any, ticketId, at: Date.now() });
  }

  function resetBoard() {
    const fresh = defaultState();
    Object.assign(state, fresh);
    saveToLocalStorage(state);
  }

  return {
    // state
    ...state,

    // getters
    activeTicket,
    doneColumnId,

    // actions
    addColumn,
    deleteColumn,
    addUser,
    addTicket,
    setPriority,
    openTicket,
    closeTicket,
    setAssignee,
    setDescription,
    moveTicket,
    deleteTicket,
    resetBoard,
  };
});
