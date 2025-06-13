<script setup lang="ts">
import { ref, onMounted } from "vue";
import EditPokemon from "./EditPokemon.vue";
import PokemonTable from "./PokemonTable.vue";
import BattleField from "./BattleField.vue";
import type { Pokemon } from "../types";

/**
 * Hauptkomponente der Pokémon-Anwendung
 * Verantwortlich für:
 * - Laden der Pokémon-Daten
 * - Verwaltung des Teams
 * - Steuerung des Bearbeitungsmodus
 */

// Reaktive Zustände der Applikation
const pokemonList = ref<Pokemon[]>([]);
const showEditForm = ref(false);
const editingPokemon = ref<Pokemon | null>(null);
const yourTeam = ref<Pokemon[]>([]);
const opponentTeam = ref<Pokemon[]>([]);
const showBattle = ref(false); 

const startBattle = () => {
  showBattle.value = true;
};

/**
 * Lädt Pokémon-Daten von der PokeAPI beim Initialisieren der Komponente
 * Führt folgende Schritte aus:
 * 1. Abruf der Basisliste aller Pokémon
 * 2. Parallelisierung der Detailabfragen
 * 3. Formatierung der Daten für die Anwendung
 */

onMounted(async () => {
  try {
    const response = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=1025"
    );
    const data = await response.json();

    pokemonList.value = await Promise.all(
      data.results.map(async (pokemon: { name: string; url: string }) => {
        const res = await fetch(pokemon.url);
        const details = await res.json();

        return {
          name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
          type: details.types
            .map(
              (t: any) =>
                t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)
            )
            .join(" / "),
          image: details.sprites.front_default,
        };
      })
    );
  } catch (error) {
    console.error("Fehler beim Laden:", error);
  }
});

/**
 * Fügt ein Pokémon zum Team hinzu
 * @param pokemon - Das hinzuzufügende Pokémon
 * @throws Alert wenn Team bereits voll ist
 */
const addToTeam = (pokemon: Pokemon) => {
  if (yourTeam.value.length >= 3) {
    alert("Dein Team ist bereits voll (max. 3 Pokémon)!");
    return;
  }
  yourTeam.value.push({ ...pokemon });
};

const addToOpponentTeam = (pokemon: Pokemon) => {
  if (opponentTeam.value.length >= 3) {
    alert("Das gegnerische Team ist bereits voll (max. 3 Pokémon)!");
    return;
  }
  opponentTeam.value.push({ ...pokemon });
};

/**
 * Entfernt ein Pokémon aus dem Team
 * @param index - Position im Team-Array
 */
const removeFromTeam = (index: number) => {
  yourTeam.value.splice(index, 1);
};

const removeFromOpponent = (index: number) => {
  opponentTeam.value.splice(index, 1);
};

const updateEnemyTeam = (shuffled: Pokemon[]) => {
  opponentTeam.value = shuffled;
};

/**
 * Startet den Bearbeitungsmodus für ein Pokémon
 * @param pokemon - Das zu bearbeitende Pokémon
 */
function handleEdit(pokemon: Pokemon) {
  editingPokemon.value = JSON.parse(JSON.stringify(pokemon));
  showEditForm.value = true;
}

const handleSwitchPokemon = (index: number) => {
  if (index > 0 && index < yourTeam.value.length) {
    const [pokemon] = yourTeam.value.splice(index, 1);
    yourTeam.value.unshift(pokemon);
  }
};

// In App.vue
const handleCancel = () => {
  showEditForm.value = false;
  editingPokemon.value = null;
};

const emit = defineEmits<{
  (e: 'close-battle'): void;
}>();


function handleCloseBattle() {
  emit('close-battle'); // 👈 Elternkomponente (`App.vue`) kümmert sich um `showBattle = false`
}

/**
 * Speichert Änderungen an einem Pokémon
 * @param updatedPokemon - Die aktualisierten Pokémon-Daten
 */
function handleSave(updatedPokemon: Pokemon) {
  const index = pokemonList.value.findIndex(
    (p) => p.name === editingPokemon.value?.name
  );
  if (index !== -1) {
    pokemonList.value[index] = updatedPokemon;
  }
  showEditForm.value = false;
}
</script>

<template>
  <!-- Hauptcontainer mit Pokémon-Hintergrund -->
  <div class="app-container">
    <BattleField
    v-if="showBattle"
    :your-team="yourTeam"
    :opponent-team="opponentTeam"
    @close-battle="showBattle = false"
    @switch-pokemon="handleSwitchPokemon"
    />
    <!-- Pokémon-Tabelle mit Suchfunktion und Teamverwaltung -->
    <PokemonTable
    v-if="!showBattle"
    :pokemon-list="pokemonList"
    :your-team="yourTeam"
    :opponent-team="opponentTeam"
    :show-edit-form="showEditForm"
    :editing-pokemon="editingPokemon"
    :show-battle="showBattle"
    @edit="handleEdit"
    @add-to-team="addToTeam"
    @remove-from-team="removeFromTeam"
    @add-to-opponent-team="addToOpponentTeam"
    @remove-from-opponent="removeFromOpponent"
    @update-enemy-team="updateEnemyTeam"
    @start-battle="startBattle"
    @save="handleSave"
    @cancel="handleCancel"
    @switch-pokemon="handleSwitchPokemon"
    />
    
    <!-- Bearbeitungsdialog (modal) -->
    <EditPokemon
    v-if="showEditForm && editingPokemon"
    :initialPokemon="editingPokemon"
    :yourTeam="yourTeam"
    :opponentTeam="opponentTeam"
    @save="handleSave"
    @cancel="showEditForm = false"
    @add-to-team="addToTeam"
    @add-to-opponent="addToOpponentTeam"
    />
    
    </div>
  </template>

<style>
/* Grundlegende Styles für die App */
body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

/* In App.vue */
.pokemon-table, .team-column {
  transition: opacity 0.3s ease;
}

.v-enter-active, .v-leave-active {
  transition: opacity 0.3s;
}
.v-enter-from, .v-leave-to {
  opacity: 0;
}

/* Container mit Pokémon-Hintergrund */
.app-container {
  position: relative;
  min-height: 100vh;
  background-image: url("@/assets/pokemon-bg.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding-top: 120px;
  box-sizing: border-box;
}
</style>
