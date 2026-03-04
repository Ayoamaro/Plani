<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useBoardStore } from "../../stores/board";
import { COLUMN_TITLE_ES_BY_EN } from "../../app/types/board";
import TicketCard from "./TicketCard.vue";

const props = defineProps<{ columnId: string }>();
const board = useBoardStore();

const column = computed(
  () => board.columns.find((c) => c.id === props.columnId)!,
);

const columnTitleLabel = computed(() => {
  return COLUMN_TITLE_ES_BY_EN[column.value.title] ?? column.value.title;
});

const tickets = computed(() =>
  column.value.ticketIds
    .map((id) => board.tickets[id])
    .filter((t): t is NonNullable<typeof t> => Boolean(t)),
);

const newTitle = ref("");

function addTicket() {
  const t = newTitle.value.trim();
  if (!t) return;
  board.addTicket(props.columnId, t);
  newTitle.value = "";
}

const canDeleteColumn = computed(() => !column.value.id.startsWith("c_"));

function deleteThisColumn() {
  if (!confirm("¿Borrar columna y todos sus tickets?")) return;
  const res = board.deleteColumn(column.value.id);
  if (!res.ok) alert(res.error);
}

const dropZoneEl = ref<HTMLElement | null>(null);
const isOver = ref(false);

let cleanup: null | (() => void) = null;

onMounted(() => {
  if (!dropZoneEl.value) return;

  cleanup = dropTargetForElements({
    element: dropZoneEl.value,
    getData: () => ({
      kind: "column",
      columnId: props.columnId,
    }),
    onDragEnter: () => {
      isOver.value = true;
    },
    onDragLeave: () => {
      isOver.value = false;
    },
    onDrop: ({ source }) => {
      isOver.value = false;

      const data = source.data as any;
      if (!data || data.kind !== "ticket") return;

      const ticketId = String(data.ticketId ?? "");
      const fromColumnId = String(data.fromColumnId ?? "");
      if (!ticketId || !fromColumnId) return;

      board.moveTicket(ticketId, fromColumnId, props.columnId);
    },
  });
});

onBeforeUnmount(() => {
  cleanup?.();
  cleanup = null;
});
</script>

<template>
  <!-- Column shell -->
  <article
    class="w-[320px] shrink-0 rounded-2xl border p-3 sm:p-4"
    :class="['bg-(--surface-2) border-(--border)', 'shadow-(--shadow-soft)']"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h3
            class="text-xs font-semibold uppercase tracking-wide text-(--text)"
          >
            {{ columnTitleLabel }}
          </h3>

          <!-- Count pill -->
          <span
            class="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold"
            :class="[
              'border border-(--border)',
              'bg-(--surface) text-(--text)',
            ]"
          >
            {{ column.ticketIds.length }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <button
          v-if="canDeleteColumn"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-xl border text-sm transition"
          :class="[
            'border-(--border) bg-(--surface) text-(--muted)',
            'hover:text-(--text) hover:bg-(--surface)',
          ]"
          @click="deleteThisColumn"
          title="Borrar columna"
          aria-label="Borrar columna"
        >
          <!-- Trash icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M8 6V4h8v2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M19 6l-1 16H6L5 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M10 11v6M14 11v6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <!-- Optional -->
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-xl border text-sm transition"
          :class="[
            'border-(--border) bg-(--surface) text-(--muted)',
            'hover:text-(--text) hover:bg-(--surface)',
          ]"
          title="Opciones"
          aria-label="Opciones"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 12h.01M12 12h.01M18 12h.01"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Add ticket -->
    <div class="mt-3 flex items-center gap-2">
      <input
        v-model="newTitle"
        class="input flex-1"
        placeholder="Nuevo ticket…"
        aria-label="Nuevo ticket"
        @keydown.enter.prevent="addTicket"
      />
      <button
        type="button"
        class="btn-soft h-10 w-10 px-0"
        @click="addTicket"
        aria-label="Añadir ticket"
      >
        +
      </button>
    </div>

    <!-- Tickets -->
    <div
      ref="dropZoneEl"
      class="mt-3 space-y-3 rounded-2xl p-1 transition"
      :class="
        isOver ? 'bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]' : ''
      "
    >
      <TicketCard
        v-for="t in tickets"
        :key="t.id"
        :ticket-id="t.id"
        :column-id="props.columnId"
      />

      <!-- Empty state -->
      <div
        v-if="tickets.length === 0"
        class="grid place-items-center rounded-2xl border border-dashed px-4 py-8 text-center text-xs"
        :class="[
          'border-(--border) text-(--muted)',
          isOver
            ? 'bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]'
            : 'bg-transparent',
        ]"
      >
        <div class="space-y-2">
          <div
            class="mx-auto grid h-8 w-8 place-items-center rounded-xl border border-(--border) bg-(--surface)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div>Arrastra tareas aquí o crea una nueva</div>
        </div>
      </div>
    </div>
  </article>
</template>
