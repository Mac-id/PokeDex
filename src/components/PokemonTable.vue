<script setup lang="ts">
import { ref, computed } from "vue";
import type { Pokemon } from "../types";
import { inject } from "@vercel/analytics"

const props = defineProps<{
  pokemonList: Pokemon[];
  yourTeam: Pokemon[];
  opponentTeam: Pokemon[];
  showEditForm: boolean;
  editingPokemon: Pokemon | null;
  showBattle: boolean;
  loadMoveDetails: (pokemon: Pokemon) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: 'edit', pokemon: Pokemon): void;
  (e: 'add-to-team', pokemon: Pokemon): void;
  (e: 'remove-from-team', index: number): void;
  (e: 'add-to-opponent-team', pokemon: Pokemon): void;
  (e: 'remove-from-opponent', index: number): void;
  (e: 'update-enemy-team', team: Pokemon[]): void;
  (e: 'update-your-team', team: Pokemon[]): void; // NEU
  (e: 'start-battle'): void;
  (e: 'save', pokemon: Pokemon): void;
  (e: 'cancel'): void;
  (e: 'switch-pokemon', index: number): void;
}>();

const searchQuery = ref("");

const filteredPokemon = computed(() => {
  if (!searchQuery.value) return props.pokemonList;
  const query = searchQuery.value.toLowerCase();
  return props.pokemonList.filter(
    (pokemon) =>
      pokemon.name.toLowerCase().includes(query) ||
      pokemon.type.toLowerCase().includes(query)
  );
});

const addToTeam = (pokemon: Pokemon) => emit('add-to-team', pokemon);
const removeFromTeam = (index: number) => emit('remove-from-team', index);
const addToOpponentTeam = (pokemon: Pokemon) => emit('add-to-opponent-team', pokemon);
const removeFromOpponent = (index: number) => emit('remove-from-opponent', index);

const shuffleOpponentTeam = () => {
  const shuffled = [...props.pokemonList].sort(() => 0.5 - Math.random());
  emit('update-enemy-team', shuffled.slice(0, 3));
};

// NEUE Funktion zum Mischen des eigenen Teams
const shuffleYourTeam = () => {
  // Sicherheitsabfrage, wenn das Team bereits gefüllt ist
  if (props.yourTeam.length > 0) {
    if (!confirm('Möchtest du dein aktuelles Team wirklich durch ein zufälliges ersetzen?')) {
      return;
    }
  }
  const shuffled = [...props.pokemonList].sort(() => 0.5 - Math.random());
  emit('update-your-team', shuffled.slice(0, 3));
};

const handleEdit = (pokemon: Pokemon) => emit('edit', pokemon);
const handleSave = (pokemon: Pokemon) => emit('save', pokemon);
const handleCancel = () => emit('cancel');

const entwicklePokemon = () => {
  alert("Kakuna entwickelt sich zu Beedrill!");
};
</script>

<template>
  <div class="page-container">
    <header class="header">
      <img alt="Pokemon" class="logo" src="@/assets/pokemon-logo.png" />
    </header>

    <div class="main-content">
      <div class="team-column">
        <div class="team-box">
          <div class="team-header">
            <h3>Dein Team ({{ yourTeam.length }}/3)</h3>
            <button @click="shuffleYourTeam" class="shuffle-btn small" title="Zufälliges Team erstellen">
              Shuffle
            </button>
          </div>
          <div v-if="yourTeam.length === 0" class="team-placeholder">
            Erstelle dein Team
          </div>
          <div v-else class="team-members">
            <div
              v-for="(pokemon, index) in yourTeam"
              :key="'your-team-' + index"
              class="pokemon-container"
              @contextmenu.prevent="removeFromTeam(index)"
            >
              <img
                :src="pokemon.image"
                :alt="pokemon.name"
                class="team-pokemon"
                :title="pokemon.name"
              />
            </div>
          </div>
        </div>

        <div class="team-box">
          <div class="team-header">
            <h3>Gegnerteam</h3>
            <button
              @click="shuffleOpponentTeam"
              class="shuffle-btn small"
              title="Zufälliges Gegnerteam erstellen"
            >
              Shuffle
            </button>
          </div>
          <div v-if="opponentTeam.length === 0" class="team-placeholder">
            Kein Gegnerteam
          </div>
          <div v-else class="team-members">
            <div
              v-for="(pokemon, index) in opponentTeam"
              :key="'opponent-team-' + index"
              class="pokemon-container"
              @contextmenu.prevent="removeFromOpponent(index)"
            >
              <img
                :src="pokemon.image"
                :alt="pokemon.name"
                class="team-pokemon"
                :title="pokemon.name"
              />
            </div>
          </div>
        </div>

        <button 
          v-if="yourTeam.length > 0 && opponentTeam.length > 0"
          class="battle-btn"
          @click="$emit('start-battle')"
        >
          <span class="battle-text">START BATTLE</span>
        </button>
      </div>

      <div class="table-column">
        <div class="search-container">
          <input
            v-model="searchQuery"
            placeholder="Suche nach Name oder Typ..."
            class="search-input"
          />
        </div>

        <div class="tabelle-container">
          <table class="tabelle" v-if="filteredPokemon.length">
            <thead>
              <tr>
                <th>Name</th>
                <th>Typ</th>
                <th>Bild</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(pokemon, index) in filteredPokemon"
                :key="index"
                @click="handleEdit(pokemon)"
                class="pokemon-row"
              >
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
                <td>{{ pokemon.type }}</td>
                <td>
                  <img
                    :src="pokemon.image"
                    :alt="pokemon.name"
                    class="pokemon-image"
                    loading="lazy"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else>Keine Pokémon gefunden</p>
        </div>
      </div>
    </div>
    <h1 class="dev">by Mac-ID</h1>
    <img src="@/assets/pikachu.gif" alt="Pikachu" class="pikachu" />
  </div>
</template>

<style scoped>
.page-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1rem;
}

header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  height: 100px;
  margin-top: -12rem;
  margin-bottom: -70px;
}

h3 {
  color: white;
}

.team-placeholder {
  text-align: center;
  padding: 20px;
  color: #ffffff;
  font-style: italic;
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  align-items: center;
  flex-grow: 1;
}

.pokemon-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pokemon-name {
  font-size: 0.9rem;
  font-weight: bold;
  color: #2070cc;
  text-align: center;
  margin-top: 5px;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* NEU: Generische Klasse für die Team-Überschriften */
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.shuffle-btn {
  background-color: #2070cc;
  color: #e4c932;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.shuffle-btn:hover {
  background-color: #1a5ca1;
}

.shuffle-btn.small {
  padding: 4px 8px;
  font-size: 0.8rem;
}

.main-content {
  display: flex;
  gap: 30px;
  width: 98vw;
  max-width: none;
  margin: 0;
  padding: 0 20px;
}

.team-column {
  width: 300px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-right: 20px;
}

.team-box {
  background: linear-gradient(#9c9c9c), url("@/assets/teams-bg.jpg");
  background-size: cover;
  background-blend-mode: overlay;
  border: 6px solid #2070cc;
  border-radius: 8px;
  padding: 15px;
  padding-right: 15px;
  height: auto;
  min-height: 200px;
  display: flex;
  margin-right: -2rem;
  margin-left: 1rem;
  margin-top: 1.2rem;
  flex-direction: column;
}

.team-members {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  padding: 5px;
}

.team-pokemon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  transition: transform 0.2s;
  cursor: pointer;
}

.team-pokemon:hover {
  transform: scale(1.1);
}

.battle-btn {
  background: linear-gradient(to bottom, #ff3e3e, #c00000);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 15px 0;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 10px;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-right: -2rem;
  margin-left: 1.5rem;
}

.battle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  background: linear-gradient(to bottom, #ff4e4e, #d10000);
}

.battle-text {
  font-size: 1.1rem;
}

.battle-icon {
  font-size: 1.5rem;
  margin-top: 5px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.table-column {
  flex-grow: 1;
  min-width: 0;
  margin-right: 20px;
}

.dev {
  position: absolute;
  bottom: 8rem;
  right: 0;
  color: rgb(255, 215, 5);
  font-size: large;
  margin-bottom: 15px;
  margin-right: 15px;
  border: 2px black solid;
  background-color: black;
  padding: 3px;
}

.pikachu {
  position: fixed;
  bottom: 0;
  left: 0;
  height: 80px;
  animation: move-pikachu 8s linear infinite;
  pointer-events: none;
  z-index: 9999;
}

.search-container {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin: 0 auto 15px;
}

.search-input {
  padding: 8px 12px;
  border: 5px solid #2070cc;
  border-radius: 10px;
  background-color: rgb(255, 215, 5);
  color: #2070cc;
  font-weight: bold;
  width: 250px;
  margin-top: -38px;
}

.search-input::placeholder {
  color: #2070cc;
  opacity: 0.7;
}

.pokemon-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.pokemon-row:hover {
  background-color: rgba(231, 94, 3, 0.103);
}

@keyframes move-pikachu {
  0% {
    left: calc(0% - 40px);
    transform: scaleX(1);
  }
  49.999% {
    left: calc(100% - 100px);
    transform: scaleX(1);
  }
  50% {
    left: calc(100% - 90px);
    transform: scaleX(-1);
  }
  99.999% {
    left: 0;
    transform: scaleX(-1);
  }
  100% {
    left: 0;
    transform: scaleX(1);
  }
}

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
}

.btn:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
}

.tabelle-container {
  border-radius: 10px;
  border: 6px solid #2070cc;
  width: 100%;
  height: 70vh;
  overflow-y: auto;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  background: linear-gradient(#c0a612), url("@/assets/table-bg.jpg");
  background-size: cover;
  background-blend-mode: overlay;
}

.tabelle-container::-webkit-scrollbar {
  width: 6px;
}

.tabelle-container::-webkit-scrollbar-thumb {
  background-color: #2e6ac4;
  border-radius: 3px;
}

.tabelle {
  width: 100%;
  border-collapse: collapse;
  background-color: transparent;
  color: rgb(0, 0, 0);
  table-layout: fixed;
}

.tabelle th,
.tabelle td {
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}

.tabelle td:first-child,
.tabelle th:first-child {
  border-right: 1px solid rgba(0, 0, 0, 0.3);
}

.tabelle td:first-child {
  font-size: 1.3rem;
}

.tabelle td:nth-child(2) {
  font-size: 1.3rem;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.tabelle th {
  font-size: 1.4rem;
  font-weight: bold;
  border-bottom: 2px solid black;
}

.tabelle th:last-child {
  border-left: 1px solid rgba(0, 0, 0, 0.3);
}

.tabelle td:last-child {
  border-left: 1px solid rgba(0, 0, 0, 0.3);
}

.tabelle tr:last-child td {
  border-bottom: none;
}
</style>