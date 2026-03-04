<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useBoardStore } from "../../stores/board";
import ColumnView from "./ColumnView.vue";
import { COLUMN_TITLE_ES_BY_EN } from "../../app/types/board";

function columnLabel(title: string) {
  return COLUMN_TITLE_ES_BY_EN[title] ?? title;
}

const board = useBoardStore();
const columns = computed(() => board.columns);

const activeActionTab = ref<"column" | "user" | null>(null);

function toggleTab(tab: "column" | "user") {
  activeActionTab.value = activeActionTab.value === tab ? null : tab;
}

// Crear columna
const newColumnTitle = ref("");
const insertMode = ref<"end" | "before" | "after">("end");
const relativeColumnId = ref<string>("");
const columnError = ref("");

// Dropdown custom
const relativeOpen = ref(false);
const relativeWrapEl = ref<HTMLElement | null>(null);

const relativeSelectedLabel = computed(() => {
  const c = columns.value.find((x) => x.id === relativeColumnId.value);
  return c ? columnLabel(c.title) : "Selecciona columna…";
});

function ensureRelativeSelected() {
  if (insertMode.value === "end") return;
  if (!relativeColumnId.value && columns.value.length > 0) {
    relativeColumnId.value = columns.value[0]?.id ?? "";
  }
}

function toggleRelative() {
  ensureRelativeSelected();
  relativeOpen.value = !relativeOpen.value;
}

function pickRelative(id: string) {
  relativeColumnId.value = id;
  relativeOpen.value = false;
}

function closeRelative() {
  relativeOpen.value = false;
}

function addColumn() {
  columnError.value = "";

  const t = newColumnTitle.value.trim();
  let insertIndex = columns.value.length;

  if (
    (insertMode.value === "before" || insertMode.value === "after") &&
    relativeColumnId.value
  ) {
    const idx = columns.value.findIndex((c) => c.id === relativeColumnId.value);
    if (idx !== -1) insertIndex = insertMode.value === "before" ? idx : idx + 1;
  }

  const res = board.addColumn(t, insertIndex);
  if (!res.ok) {
    columnError.value = res.error;
    return;
  }

  newColumnTitle.value = "";
  activeActionTab.value = null;
  closeRelative();
}

// Crear participante
const newUserName = ref("");
const userError = ref("");

function addUser() {
  userError.value = "";

  const res = board.addUser(newUserName.value);
  if (!res.ok) {
    userError.value = res.error;
    return;
  }

  newUserName.value = "";
  activeActionTab.value = null;
  closeRelative();
}

watch(insertMode, () => {
  closeRelative();
  ensureRelativeSelected();
});

watch(activeActionTab, (v) => {
  if (!v) closeRelative();
});

function onDocMouseDown(e: MouseEvent) {
  if (!relativeOpen.value) return;
  const target = e.target as Node | null;
  if (!target) return;

  const wrap = relativeWrapEl.value;
  if (wrap && !wrap.contains(target)) {
    closeRelative();
  }
}

onMounted(() => document.addEventListener("mousedown", onDocMouseDown));
onBeforeUnmount(() =>
  document.removeEventListener("mousedown", onDocMouseDown),
);
</script>

<template>
  <section class="space-y-6">
    <!-- Hero / Header -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div class="max-w-2xl">
        <h1 class="text-4xl font-semibold tracking-tight text-(--text)">
          Planning Semanal
        </h1>
        <p class="text-base text-(--muted) mt-2">
          Organiza tus tareas por columnas y prioridades para mantener el flujo
          de trabajo optimizado.
        </p>
      </div>

      <div class="w-full sm:w-auto">
        <div class="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="btn-primary w-full sm:w-auto"
            @click="toggleTab('column')"
          >
            <span class="inline-flex items-center gap-2">
              <span
                class="grid h-6 w-6 place-items-center rounded-lg bg-white/5"
              >
                <!-- Icon: columns -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h5v12H4V6Zm7 0h5v12h-5V6Zm7 0h2v12h-2V6Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              + Columna
            </span>
          </button>

          <button
            type="button"
            class="btn-primary w-full sm:w-auto"
            @click="toggleTab('user')"
          >
            <span class="inline-flex items-center gap-2">
              <span
                class="grid h-6 w-6 place-items-center rounded-lg bg-white/5"
              >
                <!-- Icon: user -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M20 8v6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M23 11h-6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              + Participante
            </span>
          </button>
        </div>

        <!-- Action panel (toggle) -->
        <div v-if="activeActionTab" class="mt-3 card p-3 sm:p-4">
          <!-- Column tab -->
          <div v-if="activeActionTab === 'column'" class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold text-text">Nueva columna</div>
              <button
                type="button"
                class="btn-ghost px-3 py-1.5"
                @click="activeActionTab = null"
              >
                Cerrar
              </button>
            </div>

            <div class="grid gap-2 sm:grid-cols-3">
              <input
                v-model="newColumnTitle"
                class="input sm:col-span-3"
                placeholder="Nueva columna…"
                aria-label="Nueva columna"
              />

              <select v-model="insertMode" class="select pr-9">
                <option value="end">Al final</option>
                <option value="before">Antes de…</option>
                <option value="after">Después de…</option>
              </select>

              <svg
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--muted)"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <!-- Dropdown custom -->
              <div
                v-if="insertMode !== 'end'"
                ref="relativeWrapEl"
                class="relative sm:col-span-2"
              >
                <button
                  type="button"
                  class="select w-full flex items-center justify-between"
                  aria-label="Columna de referencia"
                  @click="toggleRelative"
                >
                  <span class="truncate">{{ relativeSelectedLabel }}</span>

                  <svg
                    class="ml-2 shrink-0 text-(--muted)"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>

                <div
                  v-if="relativeOpen"
                  class="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-lg"
                >
                  <button
                    v-for="c in columns"
                    :key="c.id"
                    type="button"
                    class="w-full px-3 py-2 text-left text-sm text-(--text) hover:bg-black/5 transition flex items-center justify-between"
                    @click="pickRelative(c.id)"
                  >
                    <span class="truncate">{{ columnLabel(c.title) }}</span>

                    <span
                      v-if="c.id === relativeColumnId"
                      class="ml-3 text-xs text-(--muted)"
                    >
                      ✓
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="btn-ghost"
                @click="activeActionTab = null"
              >
                Cancelar
              </button>
              <button type="button" class="btn-primary" @click="addColumn">
                Añadir
              </button>
            </div>
          </div>

          <!-- User tab -->
          <div v-else-if="activeActionTab === 'user'" class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold text-text">
                Nuevo participante
              </div>
              <button
                type="button"
                class="btn-ghost px-3 py-1.5"
                @click="activeActionTab = null"
              >
                Cerrar
              </button>
            </div>

            <div class="grid gap-2 sm:grid-cols-3">
              <input
                v-model="newUserName"
                class="input sm:col-span-2"
                placeholder="Nuevo participante…"
                aria-label="Nuevo participante"
              />

              <button
                type="button"
                class="btn-primary sm:col-span-1"
                @click="addUser"
              >
                Añadir
              </button>
            </div>

            <div class="flex items-center justify-end">
              <button
                type="button"
                class="btn-ghost"
                @click="activeActionTab = null"
              >
                Cancelar
              </button>
            </div>
          </div>

          <!-- Errors -->
          <div v-if="columnError || userError" class="mt-3">
            <div
              class="rounded-xl border border-(--border) bg-white/5 p-3 text-sm"
            >
              <p v-if="columnError" class="text-danger">{{ columnError }}</p>
              <p v-if="userError" class="text-danger">{{ userError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Columns row -->
    <div class="board-bleed">
      <div class="board-rail">
        <div class="board-columns">
          <div class="board-columnsTrack">
            <ColumnView v-for="c in columns" :key="c.id" :column-id="c.id" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
