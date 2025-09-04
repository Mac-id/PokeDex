import { createRouter, createWebHistory } from "vue-router";
import PokemonTable from "../components/PokemonTable.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: PokemonTable,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;