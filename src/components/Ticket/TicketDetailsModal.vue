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

const assigneeId = ref<string | undefined>(undefined);
const description = ref("");
const priority = ref("MEDIUM");

const modalEl = ref<HTMLElement | null>(null);

watch(
  ticket,
  (t) => {
    assigneeId.value = t?.assigneeId;
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

function save() {
  if (!ticket.value) return;

  board.setAssignee(ticket.value.id, assigneeId.value);
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
    role="dialog"
    aria-modal="true"
    @click.self="board.closeTicket()"
  >
    <div ref="modalEl" tabindex="-1">
      <header>
        <div>
          <h2>{{ ticket?.title }}</h2>
          <p>Edita los detalles del ticket</p>
        </div>

        <button type="button" aria-label="Cerrar" @click="board.closeTicket()">
          ✕
        </button>
      </header>

      <section>
        <div>
          <div>Asignado a</div>
          <select v-model="assigneeId">
            <option :value="undefined">Sin asignar</option>
            <option v-for="u in board.users" :key="u.id" :value="u.id">
              {{ u.name }}
            </option>
          </select>
        </div>

        <div>
          <div>Prioridad</div>
          <select v-model="priority">
            <option value="LOW">{{ PRIORITY_LABEL_ES.LOW }}</option>
            <option value="MEDIUM">{{ PRIORITY_LABEL_ES.MEDIUM }}</option>
            <option value="HIGH">{{ PRIORITY_LABEL_ES.HIGH }}</option>
            <option value="URGENT">{{ PRIORITY_LABEL_ES.URGENT }}</option>
          </select>
        </div>

        <div>
          <div>Descripción</div>
          <textarea
            v-model="description"
            rows="6"
            placeholder="Añade una descripción (opcional)…"
          />
        </div>
      </section>

      <footer>
        <button type="button" @click="board.closeTicket()">Cancelar</button>
        <button type="button" @click="save">Guardar</button>
      </footer>
    </div>
  </div>
</template>
