<script setup lang="ts">
import type { Pokemon } from '../../types';
defineProps<{ pokemon: Pokemon }>();
</script>

<template>
  <td>{{ pokemon.type }}</td>
</template>

<style scoped>
td {
  font-size: 1.3rem;
}
</style>