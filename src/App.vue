<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div>
    <header>
      <div>
        <div>Plani</div>

        <nav>
          <RouterLink to="/board">Tablero</RouterLink>
          <RouterLink to="/progress">Progreso</RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
