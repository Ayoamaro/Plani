<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { useBoardStore } from "../../stores/board";
import { PRIORITY_LABEL_ES } from "../../app/types/board";

const board = useBoardStore();
const isOpen = computed(() => !!board.ui.activeTicketId);
const ticket = computed(() => board.activeTicket);
const assigneeId = ref<string>("");
const description = ref("");
const priority = ref<any>("MEDIUM");
const modalEl = ref<HTMLElement | null>(null);

watch(
  ticket,
  (t) => {
    assigneeId.value = t?.assigneeId ?? "";
    description.value = t?.description ?? "";
    priority.value = (t?.priority ?? "MEDIUM") as any;
  },
  { immediate: true },
);

watch(isOpen, async (open) => {
  if (!open) return;
  await nextTick();
  modalEl.value?.focus();
});

const assignee = computed(() => {
  if (!assigneeId.value) return null;
  return board.users.find((u) => u.id === assigneeId.value) ?? null;
});

const assigneeBadge = computed(() => {
  if (!assignee.value) return "?";
  const a: any = assignee.value as any;
  if (a?.avatar) return a.avatar;
  const name = String((assignee.value as any)?.name ?? "").trim();
  return name ? name.charAt(0).toUpperCase() : "?";
});

const ticketCode = computed(() => {
  const raw = String(ticket.value?.id ?? "");
  if (!raw) return "PLN-—";
  const digits = raw.replace(/\D/g, "");
  if (digits) return `PLN-${digits.slice(-3).padStart(3, "0")}`;
  return `PLN-${raw.slice(-3).toUpperCase()}`;
});

const priorityKey = computed<"LOW" | "MEDIUM" | "HIGH" | "URGENT">(() => {
  const s = String(priority.value ?? "").toUpperCase();
  if (s.includes("URG")) return "URGENT";
  if (s.includes("HIG") || s.includes("ALTA")) return "HIGH";
  if (s.includes("MED")) return "MEDIUM";
  return "LOW";
});

function setPriority(p: "LOW" | "MEDIUM" | "HIGH" | "URGENT") {
  priority.value = p as any;
}

function save() {
  if (!ticket.value) return;

  const nextAssignee = assigneeId.value ? assigneeId.value : undefined;

  board.setAssignee(ticket.value.id, nextAssignee);
  board.setDescription(ticket.value.id, description.value);
  board.setPriority(ticket.value.id, priority.value as any);

  board.closeTicket();
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") board.closeTicket();
}

onMounted(() => window.addEventListener("keydown", onKeyDown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeyDown));
</script>

<template>
  <div
    v-if="isOpen"
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    @click.self="board.closeTicket()"
  >
    <!-- Modal -->
    <div
      ref="modalEl"
      class="modal"
      tabindex="-1"
      aria-label="Detalles del ticket"
    >
      <!-- Top row: breadcrumb + close -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-xs font-medium text-(--muted)">
          <!-- Folder icon -->
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 7a2 2 0 0 1 2-2h5l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </svg>
          <span>Proyectos</span>
          <span class="text-(--muted)">/</span>
          <span class="text-(--text)">{{ ticketCode }}</span>
        </div>

        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-(--border) bg-(--surface) text-(--muted) transition hover:bg-black/5 hover:text-(--text)"
          aria-label="Cerrar"
          @click="board.closeTicket()"
        >
          ✕
        </button>
      </div>

      <!-- Title -->
      <div class="mt-4">
        <h2
          class="text-2xl sm:text-3xl font-semibold tracking-tight text-(--text)"
        >
          {{ ticket?.title }}
        </h2>
      </div>

      <!-- Content -->
      <section class="mt-6 grid gap-6 lg:grid-cols-3">
        <!-- Left: Description -->
        <div class="lg:col-span-2 space-y-2">
          <div
            class="text-xs font-semibold uppercase tracking-wide text-(--muted)"
          >
            Descripción
          </div>

          <!-- Without toolbar -->
          <div class="rounded-2xl border border-(--border) bg-(--surface)">
            <textarea
              v-model="description"
              class="w-full resize-none rounded-2xl bg-transparent px-4 py-4 text-sm text-(--text) outline-none placeholder:text-(--muted) min-h-90 leading-6"
              placeholder="Añade una descripción (opcional)…"
            />
          </div>
        </div>

        <!-- Right: Assignee + Priority -->
        <div class="space-y-5">
          <!-- Assignee -->
          <div class="space-y-2">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-(--muted)"
            >
              Asignado a
            </div>

            <div
              class="rounded-2xl border border-(--border) bg-(--surface) p-3"
            >
              <div class="flex items-center gap-3">
                <div
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/5 text-sm font-semibold text-(--text)"
                  aria-hidden="true"
                >
                  {{ assigneeBadge }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-semibold text-(--text)">
                    {{ assignee?.name ?? "Sin asignar" }}
                  </div>
                  <div class="text-xs text-(--muted)">Responsable</div>
                </div>
              </div>

              <div class="relative mt-3">
                <select
                  v-model="assigneeId"
                  class="w-full appearance-none rounded-xl border border-(--border) bg-(--surface) px-3 py-2 pr-9 text-sm text-(--text) outline-none transition hover:bg-black/5 focus:ring-2 focus:ring-(--primary)/20"
                >
                  <option value="">Sin asignar</option>
                  <option v-for="u in board.users" :key="u.id" :value="u.id">
                    {{ u.name }}
                  </option>
                </select>

                <!-- Chevron -->
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
              </div>
            </div>
          </div>

          <!-- Priority -->
          <div class="space-y-2">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-(--muted)"
            >
              Prioridad
            </div>

            <div class="space-y-2">
              <!-- HIGH -->
              <button
                type="button"
                class="w-full rounded-2xl border px-3 py-3 text-left transition"
                :class="
                  priorityKey === 'HIGH'
                    ? 'border-(--primary) ring-2 ring-(--primary)/20 bg-(--surface)'
                    : 'border-(--border) bg-(--surface) hover:bg-black/5'
                "
                @click="setPriority('HIGH')"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span
                      class="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"
                    >
                      ↑
                    </span>
                    <div class="text-sm font-semibold text-(--text)">
                      {{ PRIORITY_LABEL_ES.HIGH ?? "Alta" }}
                    </div>
                  </div>
                  <span
                    class="h-4 w-4 rounded-full border"
                    :class="
                      priorityKey === 'HIGH'
                        ? 'border-(--primary) bg-(--primary)'
                        : 'border-(--border) bg-(--surface)'
                    "
                  />
                </div>
              </button>

              <!-- MEDIUM -->
              <button
                type="button"
                class="w-full rounded-2xl border px-3 py-3 text-left transition"
                :class="
                  priorityKey === 'MEDIUM'
                    ? 'border-(--primary) ring-2 ring-(--primary)/20 bg-(--surface)'
                    : 'border-(--border) bg-(--surface) hover:bg-black/5'
                "
                @click="setPriority('MEDIUM')"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span
                      class="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700"
                    >
                      —
                    </span>
                    <div class="text-sm font-semibold text-(--text)">
                      {{ PRIORITY_LABEL_ES.MEDIUM ?? "Media" }}
                    </div>
                  </div>
                  <span
                    class="h-4 w-4 rounded-full border"
                    :class="
                      priorityKey === 'MEDIUM'
                        ? 'border-(--primary) bg-(--primary)'
                        : 'border-(--border) bg-(--surface)'
                    "
                  />
                </div>
              </button>

              <!-- LOW -->
              <button
                type="button"
                class="w-full rounded-2xl border px-3 py-3 text-left transition"
                :class="
                  priorityKey === 'LOW'
                    ? 'border-(--primary) ring-2 ring-(--primary)/20 bg-(--surface)'
                    : 'border-(--border) bg-(--surface) hover:bg-black/5'
                "
                @click="setPriority('LOW')"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span
                      class="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"
                    >
                      ↓
                    </span>
                    <div class="text-sm font-semibold text-(--text)">
                      {{ PRIORITY_LABEL_ES.LOW ?? "Baja" }}
                    </div>
                  </div>
                  <span
                    class="h-4 w-4 rounded-full border"
                    :class="
                      priorityKey === 'LOW'
                        ? 'border-(--primary) bg-(--primary)'
                        : 'border-(--border) bg-(--surface)'
                    "
                  />
                </div>
              </button>

              <!-- URGENT -->
              <button
                type="button"
                class="w-full rounded-2xl border px-3 py-3 text-left transition"
                :class="
                  priorityKey === 'URGENT'
                    ? 'border-(--primary) ring-2 ring-(--primary)/20 bg-(--surface)'
                    : 'border-(--border) bg-(--surface) hover:bg-black/5'
                "
                @click="setPriority('URGENT')"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span
                      class="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-700"
                    >
                      !
                    </span>
                    <div class="text-sm font-semibold text-(--text)">
                      {{ PRIORITY_LABEL_ES.URGENT ?? "Urgente" }}
                    </div>
                  </div>
                  <span
                    class="h-4 w-4 rounded-full border"
                    :class="
                      priorityKey === 'URGENT'
                        ? 'border-(--primary) bg-(--primary)'
                        : 'border-(--border) bg-(--surface)'
                    "
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-8 flex items-center justify-end gap-3">
        <button type="button" class="btn-soft" @click="board.closeTicket()">
          Cancelar
        </button>

        <button type="button" class="btn-primary px-6" @click="save">
          Guardar cambios
        </button>
      </footer>
    </div>
  </div>
</template>
