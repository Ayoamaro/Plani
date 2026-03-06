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
  return (
    PRIORITY_LABEL_ES[
      ticket.value.priority as keyof typeof PRIORITY_LABEL_ES
    ] ?? String(ticket.value.priority)
  );
});

const assignee = computed(() => {
  if (!ticket.value?.assigneeId) return null;
  return board.users.find((u) => u.id === ticket.value!.assigneeId) ?? null;
});

const priorityKey = computed(() => {
  const s = String(ticket.value?.priority ?? "").toLowerCase();

  if (s.includes("crit")) return "critical";
  if (s.includes("high") || s.includes("alta")) return "high";
  if (s.includes("med")) return "medium";
  if (s.includes("urg")) return "urgent";
  if (s.includes("low") || s.includes("baja")) return "low";

  return "medium";
});

const codeLabel = computed(() => {
  const raw = String(ticket.value?.id ?? props.ticketId);
  const digits = raw.replace(/\D/g, "");
  const n = digits ? Number(digits.slice(-3)) : 0;
  const safe = Number.isFinite(n) && n > 0 ? n : 100;
  return `PLN-${String(safe).padStart(3, "0")}`;
});

const priorityStyles = computed(() => {
  switch (priorityKey.value) {
    case "high":
      return {
        bar: "bg-rose-500",
        badge: "border-rose-200 bg-rose-50 text-rose-700",
      };

    case "medium":
      return {
        bar: "bg-amber-500",
        badge: "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "urgent":
      return {
        bar: "bg-red-600",
        badge: "border-red-200 bg-red-50 text-red-700",
      };

    case "low":
      return {
        bar: "bg-emerald-500",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    default:
      return {
        bar: "bg-blue-500",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
      };
  }
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
    role="button"
    tabindex="0"
    @click="onClickCard"
    class="group relative overflow-hidden rounded-2xl border bg-(--surface) p-3 shadow-(--shadow-soft) transition"
    :class="[
      'border-(--border)',
      isDragging
        ? 'opacity-70 cursor-grabbing'
        : 'cursor-pointer hover:-translate-y-px hover:shadow-(--shadow-card)',
    ]"
  >
    <!-- Priority left bar -->
    <div
      class="absolute left-0 top-0 h-full w-1.5"
      :class="priorityStyles.bar"
    ></div>

    <!-- Top -->
    <div class="flex items-start justify-between gap-3 pl-2">
      <div class="min-w-0">
        <div
          class="text-[11px] font-semibold uppercase tracking-wide text-(--muted)"
        >
          {{ codeLabel }}
        </div>

        <div class="mt-1 line-clamp-2 text-sm font-semibold text-(--text)">
          {{ ticket.title }}
        </div>
      </div>

      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-xl border bg-white/60 text-(--muted) opacity-0 transition group-hover:opacity-100"
        :class="['border-(--border) hover:text-(--text)']"
        title="Borrar ticket"
        aria-label="Borrar ticket"
        @click.stop="board.deleteTicket(ticketId)"
      >
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
    </div>

    <!-- Bottom -->
    <div class="mt-3 flex items-center justify-between gap-2 pl-2">
      <span
        class="inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-semibold"
        :class="priorityStyles.badge"
      >
        {{ priorityLabel }}
      </span>

      <span v-if="assignee" class="user-chip">
        <span class="avatar">{{ assignee.avatar }}</span>
        <span
          class="hidden text-xs font-medium sm:inline"
          :style="{ color: 'var(--text)' }"
        >
          {{ assignee.name }}
        </span>
      </span>

      <span v-else class="text-xs text-(--muted)">Sin asignar</span>
    </div>
  </div>
</template>
