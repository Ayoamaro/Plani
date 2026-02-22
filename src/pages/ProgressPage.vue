<script setup lang="ts">
import { computed } from "vue";
import { useBoardStore } from "../stores/board";

const board = useBoardStore();

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

const weekStart = computed(() => startOfWeek(new Date()));

const weekEvents = computed(() =>
  board.events.filter((e) => e.at >= weekStart.value),
);

const completedThisWeek = computed(
  () => weekEvents.value.filter((e) => e.type === "COMPLETED").length,
);

const movedThisWeek = computed(
  () => weekEvents.value.filter((e) => e.type === "MOVED").length,
);

const totalTickets = computed(() => Object.keys(board.tickets).length);

const completionPct = computed(() => {
  if (totalTickets.value === 0) return 0;
  return Math.round((completedThisWeek.value / totalTickets.value) * 100);
});
</script>

<template>
  <main>
    <h2>Progreso Semanal</h2>

    <div>
      <div>
        <div>Completadas (esta semana)</div>
        <div>{{ completedThisWeek }}</div>
      </div>

      <div>
        <div>Movimientos (esta semana)</div>
        <div>{{ movedThisWeek }}</div>
      </div>

      <div>
        <div>Completado</div>
        <div>{{ completionPct }}%</div>
      </div>
    </div>
  </main>
</template>
