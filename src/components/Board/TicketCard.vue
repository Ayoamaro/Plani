<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useBoardStore } from "../../stores/board";
import { PRIORITY_LABEL_ES } from "../../app/types/board";

const props = defineProps<{ ticketId: string; columnId: string }>();
const board = useBoardStore();

const ticket = computed(() => board.tickets[props.ticketId]);

const priorityLabel = computed(() => {
  if (!ticket.value) return "";
  return PRIORITY_LABEL_ES[ticket.value.priority];
});

const assignee = computed(() => {
  if (!ticket.value?.assigneeId) return null;
  return board.users.find((u) => u.id === ticket.value!.assigneeId) ?? null;
});

const priorityClass = computed(() => {
  const p = ticket.value?.priority;
  if (!p) return "";
  return p.toLowerCase();
});

const el = ref<HTMLElement | null>(null);
const isDragging = ref(false);
let cleanup: null | (() => void) = null;

onMounted(() => {
  if (!el.value) return;

  cleanup = draggable({
    element: el.value,
    getInitialData: () => ({
      kind: "ticket",
      ticketId: props.ticketId,
      fromColumnId: props.columnId,
    }),
    onDragStart: () => {
      isDragging.value = true;
    },
    onDrop: () => {
      queueMicrotask(() => {
        isDragging.value = false;
      });
    },
  });
});

onBeforeUnmount(() => {
  cleanup?.();
  cleanup = null;
});

function onClickCard() {
  if (isDragging.value) return;
  board.openTicket(props.ticketId);
}
</script>

<template>
  <div
    v-if="ticket"
    ref="el"
    class="ticket"
    role="button"
    tabindex="0"
    @click="onClickCard"
  >
    <div>
      <div>{{ ticket.title }}</div>

      <button
        type="button"
        title="Borrar ticket"
        aria-label="Borrar ticket"
        @click.stop="board.deleteTicket(ticketId)"
      >
        🗑️
      </button>
    </div>

    <div>
      <span :class="priorityClass">{{ priorityLabel }}</span>

      <span v-if="assignee">
        {{ assignee.avatar }}
      </span>
    </div>
  </div>
</template>
