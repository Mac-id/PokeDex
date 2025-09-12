<script setup lang="ts">
import { usePokemonStore } from '../store/pokemonStore';
import { storeToRefs } from 'pinia';

const store = usePokemonStore();
const { loadingProgress, loadingStatusText } = storeToRefs(store);
</script>

<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <img src="@/assets/pokeball.png" alt="Loading..." class="pokeball-spinner" />
      <h2 class="loading-title">Lade Pokédex...</h2>
      <v-progress-linear
        :model-value="loadingProgress"
        color="secondary"
        height="20"
        striped
        class="progress-bar"
      >
        <strong>{{ loadingProgress }}%</strong>
      </v-progress-linear>
      <p class="status-text">{{ loadingStatusText }}</p>
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #1d3e70; 
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
  font-family: Consolas, 'Courier New', monospace;
}
.loading-content {
  text-align: center;
  width: 80%;
  max-width: 400px;
}
.pokeball-spinner {
  width: 100px;
  height: 100px;
  animation: spin 2s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.loading-title {
  color: #ffcc24;
  margin-top: 20px;
  margin-bottom: 25px;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}
.progress-bar {
  border-radius: 10px;
  border: 3px solid #ffcc24;
  background-color: rgba(0,0,0,0.3);
}
.status-text {
  margin-top: 15px;
  font-size: 0.9rem;
  min-height: 20px; 
  color: rgba(255, 255, 255, 0.8);
}
</style>