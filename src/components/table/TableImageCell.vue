<script setup lang="ts">
import type { Pokemon } from '../../types';
defineProps<{ pokemon: Pokemon }>();
</script>

<template>
  <td>
    <img
      :src="pokemon.image"
      :alt="pokemon.name"
      class="pokemon-image"
      loading="lazy"
    />
  </td>
</template>

<style scoped>
.pokemon-image {
  width: 50px;  /* Feste Größe für Konsistenz */
  height: 50px;
  object-fit: contain;
}
td {
  border-left: 1px solid rgba(0, 0, 0, 0.3);
}
</style>