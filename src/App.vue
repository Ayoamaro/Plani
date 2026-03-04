<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="min-h-screen bg-(--bg)">
    <!-- Topbar -->
    <header class="sticky top-0 z-30">
      <div class="container-app py-4">
        <div class="card px-5 py-4">
          <div class="flex items-center justify-between gap-6">
            <!-- Brand -->
            <div class="flex items-center gap-3">
              <div
                class="grid h-10 w-10 place-items-center rounded-xl bg-white/5 border border-(--border)"
                aria-hidden="true"
              >
                <img
                  src="/favicon.png"
                  alt="Plani logo"
                  class="h-7 w-7 object-contain"
                />
              </div>

              <div class="leading-tight">
                <div class="text-sm font-semibold text-(--text)">Plani</div>
                <div class="text-xs text-(--muted)">Dashboard</div>
              </div>
            </div>

            <!-- Nav -->
            <nav class="hidden items-center gap-8 sm:flex">
              <RouterLink
                to="/board"
                class="relative pb-2 text-sm font-medium text-(--muted) transition hover:text-(--text)"
                active-class="text-[color:var(--primary)] after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:rounded-full after:bg-[color:var(--primary)]"
              >
                Tablero
              </RouterLink>

              <RouterLink
                to="/progress"
                class="relative pb-2 text-sm font-medium text-(--muted) transition hover:text-(--text)"
                active-class="text-[color:var(--primary)] after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:rounded-full after:bg-[color:var(--primary)]"
              >
                Progreso
              </RouterLink>
            </nav>

            <!-- Mobile nav -->
            <nav class="flex items-center gap-3 sm:hidden">
              <RouterLink
                to="/board"
                class="btn-soft px-3 py-2"
                active-class="ring-2 ring-[color:var(--primary)]/25"
              >
                Tablero
              </RouterLink>
              <RouterLink
                to="/progress"
                class="btn-soft px-3 py-2"
                active-class="ring-2 ring-[color:var(--primary)]/25"
              >
                Progreso
              </RouterLink>
            </nav>
          </div>
        </div>
      </div>
      <div class="h-px w-full bg-(--border)"></div>
    </header>

    <!-- Content -->
    <main class="container-app py-6 sm:py-8">
      <RouterView />
    </main>
  </div>
</template>
