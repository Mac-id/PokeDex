<script setup lang="ts">
import { ref, onMounted } from "vue";
import EditPokemon from "./EditPokemon.vue";
import PokemonTable from "./PokemonTable.vue";
import BattleField from "./BattleField.vue";
import { Analytics } from "@vercel/analytics/next"
import type { Pokemon } from "../types";

// Reaktive Zustände
const pokemonList = ref<Pokemon[]>([]);
const showEditForm = ref(false);
const editingPokemon = ref<Pokemon | null>(null);
const yourTeam = ref<Pokemon[]>([]);
const opponentTeam = ref<Pokemon[]>([]);
const showBattle = ref(false);

// Move-Details Lade-Funktion
const loadMoveDetails = async (pokemon: Pokemon): Promise<void> => {
  if (!pokemon.moveUrls || pokemon.moves) return;
  
  try {
    pokemon.moves = [];
    for (const url of pokemon.moveUrls) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const moveRes = await fetch(url);
      const moveData = await moveRes.json();
      pokemon.moves.push({
        name: moveData.name,
        power: moveData.power || 0,
        accuracy: moveData.accuracy || 0,
        pp: moveData.pp || 0,
        type: moveData.type?.name || 'normal',
        damageClass: moveData.damage_class?.name || 'status'
      });
    }
    delete pokemon.moveUrls;
  } catch (e) {
    console.error("Failed to load moves", e);
    pokemon.moves = pokemon.moveUrls?.map(url => ({
      name: url.split('/').slice(-2)[0],
      power: 0,
      accuracy: 0,
      pp: 0,
      type: 'normal',
      damageClass: 'status'
    })) || [];
  }
};

// Team-Funktionen
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

const removeFromTeam = (index: number) => {
  yourTeam.value.splice(index, 1);
};

const removeFromOpponent = (index: number) => {
  opponentTeam.value.splice(index, 1);
};

const updateEnemyTeam = (shuffled: Pokemon[]) => {
  opponentTeam.value = shuffled;
};

// NEUE Funktion zum Aktualisieren deines Teams
const updateYourTeam = (shuffled: Pokemon[]) => {
  yourTeam.value = shuffled;
};

// Bearbeitungsfunktionen
const handleEdit = (pokemon: Pokemon) => {
  editingPokemon.value = { ...pokemon };
  showEditForm.value = true;
};

const handleSave = (updatedPokemon: Pokemon) => {
  const index = pokemonList.value.findIndex(p => p.name === editingPokemon.value?.name);
  if (index !== -1) {
    pokemonList.value[index] = updatedPokemon;
  }
  showEditForm.value = false;
};

const handleCancel = () => {
  showEditForm.value = false;
  editingPokemon.value = null;
};

// Kampffunktionen
const startBattle = () => {
  showBattle.value = true;
};

const handleSwitchPokemon = (index: number) => {
  if (index > 0 && index < yourTeam.value.length) {
    const [pokemon] = yourTeam.value.splice(index, 1);
    yourTeam.value.unshift(pokemon);
  }
};

const handleCloseBattle = () => {
  showBattle.value = false;
};

// Pokémon-Daten laden
onMounted(async () => {
  try {
    const listResponse = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
    const listData = await listResponse.json();

    const loadPokemonDetails = async (pokemon: { name: string; url: string }, delay: number): Promise<Pokemon> => {
      await new Promise(resolve => setTimeout(resolve, delay));
      const res = await fetch(pokemon.url);
      const details = await res.json();
      
      const spriteList = [];
      const spriteData = details.sprites;
      for (const key in spriteData) {
        if (spriteData[key] && typeof spriteData[key] === "string") {
          spriteList.push(spriteData[key]);
        }
      }
      const sprites = spriteList.filter(Boolean);

      return {
        name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
        type: details.types
          .map((t: { type: { name: string } }) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1))
          .join(" / "),
        image: details.sprites.front_default,
        stats: {
          hp: details.stats.find((s: { stat: { name: string } }) => s.stat.name === 'hp')?.base_stat || 0,
          attack: details.stats.find((s: { stat: { name: string } }) => s.stat.name === 'attack')?.base_stat || 0,
          defense: details.stats.find((s: { stat: { name: string } }) => s.stat.name === 'defense')?.base_stat || 0,
          speed: details.stats.find((s: { stat: { name: string } }) => s.stat.name === 'speed')?.base_stat || 0
        },
        moveUrls: details.moves.slice(0, 4).map((m: { move: { url: string } }) => m.move.url),
        sprites: sprites
      };
    };

    const batchSize = 100;
    for (let i = 0; i < listData.results.length; i += batchSize) {
      const batch = listData.results.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((p: { name: string; url: string }, idx: number) => 
          loadPokemonDetails(p, idx * 100))
      );
      pokemonList.value.push(...batchResults);
    }

    for (let i = 0; i < Math.min(20, pokemonList.value.length); i++) {
      await loadMoveDetails(pokemonList.value[i]);
    }

  } catch (error) {
    console.error("Initial load failed:", error);
  }
});
</script>

<template>
  <div class="app-container">
    <BattleField
      v-if="showBattle"
      :your-team="yourTeam"
      :opponent-team="opponentTeam"
      :load-move-details="loadMoveDetails"
      @close-battle="handleCloseBattle"
      @switch-pokemon="handleSwitchPokemon"
    />
    
    <PokemonTable
      v-if="!showBattle"
      :pokemon-list="pokemonList"
      :your-team="yourTeam"
      :opponent-team="opponentTeam"
      :show-edit-form="showEditForm"
      :editing-pokemon="editingPokemon"
      :show-battle="showBattle"
      :load-move-details="loadMoveDetails"
      @edit="handleEdit"
      @add-to-team="addToTeam"
      @remove-from-team="removeFromTeam"
      @add-to-opponent-team="addToOpponentTeam"
      @remove-from-opponent="removeFromOpponent"
      @update-enemy-team="updateEnemyTeam"
      @update-your-team="updateYourTeam"
      @start-battle="startBattle"
      @save="handleSave"
      @cancel="handleCancel"
      @switch-pokemon="handleSwitchPokemon"
    />
    
    <EditPokemon
      v-if="showEditForm && editingPokemon"
      :initial-pokemon="editingPokemon"
      :your-team="yourTeam"
      :opponent-team="opponentTeam"
      :load-move-details="loadMoveDetails"
      @save="handleSave"
      @cancel="handleCancel"
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