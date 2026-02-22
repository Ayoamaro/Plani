<script setup lang="ts">
import { computed, ref } from "vue";
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
}
</script>

<template>
  <section>
    <div>
      <div>
        <h2>Planning Semanal</h2>
        <p>Organiza tus tareas por columnas y prioridades</p>
      </div>

      <div>
        <div>
          <button type="button" @click="toggleTab('column')">+ Columna</button>

          <button type="button" @click="toggleTab('user')">
            + Participante
          </button>
        </div>

        <div v-if="activeActionTab">
          <div v-if="activeActionTab === 'column'">
            <input
              v-model="newColumnTitle"
              placeholder="Nueva columna…"
              aria-label="Nueva columna"
            />

            <select v-model="insertMode" aria-label="Posición de la columna">
              <option value="end">Al final</option>
              <option value="before">Antes de…</option>
              <option value="after">Después de…</option>
            </select>

            <select
              v-if="insertMode !== 'end'"
              v-model="relativeColumnId"
              aria-label="Columna de referencia"
            >
              <option v-for="c in columns" :key="c.id" :value="c.id">
                {{ columnLabel(c.title) }}
              </option>
            </select>

            <button type="button" @click="addColumn">Añadir</button>
          </div>

          <div v-else-if="activeActionTab === 'user'">
            <input
              v-model="newUserName"
              placeholder="Nuevo participante…"
              aria-label="Nuevo participante"
            />
            <button type="button" @click="addUser">Añadir participante</button>
          </div>

          <div v-if="columnError || userError">
            <p v-if="columnError">{{ columnError }}</p>
            <p v-if="userError">{{ userError }}</p>
          </div>
        </div>
      </div>
    </div>

    <div>
      <ColumnView v-for="c in columns" :key="c.id" :column-id="c.id" />
    </div>
  </section>
</template>
