<script setup lang="ts">
import { computed } from "vue";
import { useBoardStore } from "../stores/board";

const board = useBoardStore();

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // lunes=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function endOfWeek(startMs: number) {
  const end = new Date(startMs);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

function formatRange(startMs: number, endMs: number) {
  const start = new Date(startMs);
  const end = new Date(endMs);

  const sameYear = start.getFullYear() === end.getFullYear();

  const fmtStart = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(start);

  const fmtEnd = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(end);

  return `${fmtStart} — ${fmtEnd}`;
}

function pctDelta(curr: number, prev: number) {
  if (prev === 0 && curr === 0) return 0;
  if (prev === 0) return 100;
  return Math.round(((curr - prev) / prev) * 100);
}

const weekStart = computed(() => startOfWeek(new Date()));
const weekEnd = computed(() => endOfWeek(weekStart.value));

const lastWeekStart = computed(() => {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() - 7);
  return d.getTime();
});
const lastWeekEnd = computed(() => endOfWeek(lastWeekStart.value));

const weekEvents = computed(() =>
  board.events.filter((e) => e.at >= weekStart.value && e.at <= weekEnd.value),
);

const lastWeekEvents = computed(() =>
  board.events.filter(
    (e) => e.at >= lastWeekStart.value && e.at <= lastWeekEnd.value,
  ),
);

const completedThisWeek = computed(
  () => weekEvents.value.filter((e) => e.type === "COMPLETED").length,
);

const movedThisWeek = computed(
  () => weekEvents.value.filter((e) => e.type === "MOVED").length,
);

const completedLastWeek = computed(
  () => lastWeekEvents.value.filter((e) => e.type === "COMPLETED").length,
);

const movedLastWeek = computed(
  () => lastWeekEvents.value.filter((e) => e.type === "MOVED").length,
);

const deltaCompleted = computed(() =>
  pctDelta(completedThisWeek.value, completedLastWeek.value),
);

const deltaMoved = computed(() =>
  pctDelta(movedThisWeek.value, movedLastWeek.value),
);

const totalTickets = computed(() => Object.keys(board.tickets).length);

const completionPct = computed(() => {
  if (totalTickets.value === 0) return 0;
  return Math.round((completedThisWeek.value / totalTickets.value) * 100);
});

const rangeLabel = computed(() => formatRange(weekStart.value, weekEnd.value));

function badgeClass(delta: number) {
  if (delta > 0) return "badge badge-pos";
  if (delta < 0) return "badge badge-neg";
  return "badge badge-neutral";
}
</script>

<template>
  <main class="space-y-8">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="h1">Progreso Semanal</h1>
      <p class="muted text-sm">
        Visualización de métricas del {{ rangeLabel }}
      </p>
    </div>

    <!-- Cards -->
    <section class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Tickets complete -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-semibold uppercase tracking-wider muted"
          >
            Tickets totales
          </span>

          <span :class="badgeClass(deltaCompleted)">
            {{ deltaCompleted >= 0 ? "+" : "" }}{{ deltaCompleted }}%
          </span>
        </div>

        <div class="mt-4 flex items-baseline gap-2">
          <div class="text-4xl font-semibold text-(--text)">
            {{ completedThisWeek }}
          </div>
        </div>

        <p class="mt-2 text-sm muted">
          vs. {{ completedLastWeek }} la semana pasada
        </p>
      </div>

      <!-- Movimientos -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-semibold uppercase tracking-wider muted"
          >
            Velocidad (movimientos)
          </span>

          <span :class="badgeClass(deltaMoved)">
            {{ deltaMoved >= 0 ? "+" : "" }}{{ deltaMoved }}%
          </span>
        </div>

        <div class="mt-4 flex items-baseline gap-2">
          <div class="text-4xl font-semibold text-(--text)">
            {{ movedThisWeek }}
          </div>
          <span class="text-sm muted">mov/sem</span>
        </div>

        <p class="mt-2 text-sm muted">
          vs. {{ movedLastWeek }} la semana pasada
        </p>
      </div>

      <!-- % complete -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-semibold uppercase tracking-wider muted"
          >
            Completado
          </span>

          <span class="badge badge-neutral"> {{ completionPct }}% </span>
        </div>

        <div class="mt-4 flex items-baseline gap-2">
          <div class="text-4xl font-semibold text-(--text)">
            {{ completionPct }}%
          </div>
        </div>

        <p class="mt-2 text-sm muted">
          {{ completedThisWeek }} de {{ totalTickets }} tareas completadas
        </p>
      </div>
    </section>
  </main>
</template>
