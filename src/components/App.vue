<script setup lang="ts">
import { ref, onMounted } from "vue";
import { usePokemonStore } from '../store/pokemonStore';
import EditPokemon from "./EditPokemon.vue";
import PokemonTable from "./PokemonTable.vue";
import BattleField from "./BattleField.vue";
import type { Pokemon } from "../types/index.ts";

const store = usePokemonStore();

// Lokaler UI-Zustand für das Bearbeiten-Modal
const showEditForm = ref(false);
const editingPokemon = ref<Pokemon | null>(null);

// Beim Starten der App die Pokémon laden
onMounted(() => {
  store.loadInitialPokemon();
});

// Funktionen zur Steuerung des Modals
const handleEdit = (pokemon: Pokemon) => {
  editingPokemon.value = { ...pokemon };
  showEditForm.value = true;
};

const handleSave = (updatedPokemon: Pokemon) => {
  store.updatePokemonInList(updatedPokemon, editingPokemon.value!.name);
  showEditForm.value = false;
  editingPokemon.value = null;
};

const handleCancel = () => {
  showEditForm.value = false;
  editingPokemon.value = null;
};
</script>

<template>
  <div class="app-container">
    <BattleField v-if="store.showBattle" />
    
    <PokemonTable v-if="!store.showBattle" @edit="handleEdit" />
    
    <EditPokemon
      v-if="showEditForm && editingPokemon"
      :initial-pokemon="editingPokemon"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<style>
/* Globale Styles bleiben hier */
body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
.pokemon-table, .team-column { transition: opacity 0.3s ease; }
.v-enter-active, .v-leave-active { transition: opacity 0.3s; }
.v-enter-from, .v-leave-to { opacity: 0; }
.app-container { position: relative; min-height: 100vh; background-image: url("@/assets/pokemon-bg.jpg"); background-size: cover; background-position: center; background-attachment: fixed; padding-top: 120px; box-sizing: border-box; }
</style>