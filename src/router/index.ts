import { createRouter, createWebHistory } from "vue-router";
import BoardPage from "../pages/BoardPage.vue";
import ProgressPage from "../pages/ProgressPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/board" },
    { path: "/board", component: BoardPage },
    { path: "/progress", component: ProgressPage },
  ],
});
