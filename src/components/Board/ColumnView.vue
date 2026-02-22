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
let cleanup: null | (() => void) = null;

onMounted(() => {
  if (!dropZoneEl.value) return;

  cleanup = dropTargetForElements({
    element: dropZoneEl.value,
    getData: () => ({
      kind: "column",
      columnId: props.columnId,
    }),
    onDrop: ({ source }) => {
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
  <article>
    <div>
      <div>
        <h3>{{ columnTitleLabel }}</h3>

        <button
          v-if="canDeleteColumn"
          @click="deleteThisColumn"
          title="Borrar columna"
        >
          🗑️
        </button>
      </div>

      <span>{{ column.ticketIds.length }}</span>
    </div>

    <div>
      <input v-model="newTitle" placeholder="Nuevo ticket…" />
      <button @click="addTicket">+</button>
    </div>

    <div ref="dropZoneEl">
      <TicketCard
        v-for="t in tickets"
        :key="t.id"
        :ticket-id="t.id"
        :column-id="props.columnId"
      />
    </div>
  </article>
</template>
