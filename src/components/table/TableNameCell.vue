<script setup lang="ts">
import type { Pokemon } from '../../types';
defineProps<{ pokemon: Pokemon }>();

// Die Logik, die spezifisch für diese Spalte ist, zieht hierher um.
const entwicklePokemon = () => {
  alert("Kakuna entwickelt sich zu Beedrill!");
};
</script>

<template>
  <td :class="{ pid: pokemon.name.toLowerCase().includes('pid') }">
    {{ pokemon.name }}
    <button
      class="btn"
      v-if="pokemon.name === 'Kakuna'"
      @click.stop="entwicklePokemon"
    >
      Entwickeln
    </button>
  </td>
</template>

<style scoped>
/* Styles, die nur diese Spalte betreffen */
.pid {
  color: #2070cc;
  font-weight: bold;
}
.btn {
  background-color: #2070cc;
  border-radius: 4px;
  border: black solid 1px;
  color: #e4c932;
  box-shadow: black 0px 2px 2px;
  font-family: monaco, monospace;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: 8px; /* Kleiner Abstand */
}
.btn:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
}
td {
  font-size: 1.3rem;
  border-right: 1px solid rgba(0, 0, 0, 0.3);
}
</style>