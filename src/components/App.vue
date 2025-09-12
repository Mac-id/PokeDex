<script setup lang="ts">
import { ref, onMounted } from "vue";
import { usePokemonStore } from '../store/pokemonStore';
import PokedexEntry from "./PokedexEntry.vue";
import PokemonTable from "./PokemonTable.vue";
import BattleField from "./BattleField.vue";
import LoadingScreen from "./LoadingScreen.vue";
import type { Pokemon } from "../types/index.ts";

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const store = usePokemonStore();
const showPokedex = ref(false);
const selectedPokemon = ref<Pokemon | null>(null);
onMounted(() => { store.loadInitialPokemon();

  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Light });

    StatusBar.setBackgroundColor({ color: '#1d3e70' });
  }
});

const openPokedex = (pokemon: Pokemon) => {
  selectedPokemon.value = pokemon;
  showPokedex.value = true;
};
const closePokedex = () => { showPokedex.value = false; };
</script>

<template>
  <v-app>
    <v-main class="app-container">
      <LoadingScreen v-if="store.isLoading" />

      <div v-else>
        <header class="header">
          <img alt="Pokemon" class="logo" src="@/assets/custom-logo.png" />
        </header>
        <BattleField v-if="store.showBattle" />
        <PokemonTable v-if="!store.showBattle" @open-pokedex="openPokedex" />
        <PokedexEntry
          v-if="showPokedex && selectedPokemon"
          :pokemon="selectedPokemon"
          :show="showPokedex"
          @close="closePokedex"
        />
        <img
          v-if="!store.showBattle"
          src="@/assets/pikachu.gif"
          alt="Pika"
          class="pikachu"
        />
      </div>
    </v-main>
  </v-app>
</template>

<style>
.v-application {
  font-family: Consolas, 'Courier New', monospace;
  -webkit-font-smoothing: none;
  font-smooth: never;
}
.app-container {
  background-image: url("@/assets/pokemon-bg.jpg") !important;
  background-size: cover;
  background-position: center;
}

.header {
  position: relative;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.logo {
  height: 85px;
  position: absolute;
  top: 30px;
}
.pikachu {
  position: fixed;
  bottom: 0;
  left: 0;
  height: 80px;
  animation: move-pikachu 10s linear infinite;
  pointer-events: none;
  z-index: 9999;
}

@keyframes move-pikachu {
  0% {
    transform: translateX(0) scaleX(1);
  }
  49.9% {
    transform: translateX(calc(100vw - 80px)) scaleX(1);
  }
  50% {
    transform: translateX(calc(100vw - 80px)) scaleX(-1);
  }
  99.9% {
    transform: translateX(0) scaleX(-1);
  }
  100% {
    transform: translateX(0) scaleX(1);
  }
}

@media (max-width: 960px) {
  .header {
    height: 60px;
  }
  .logo {
    height: 75px;
    top: 25px;
  }
}
</style>