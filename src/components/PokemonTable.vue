<script setup lang="ts">
import { ref } from "vue";
import { usePokemonStore } from "../store/pokemonStore";
import { useSearch } from "../composables/useSearch";
import { storeToRefs } from "pinia";
import type { Pokemon } from "../types";

const store = usePokemonStore();
const { pokemonList, yourTeam, opponentTeam } = storeToRefs(store);
const { searchQuery, filteredPokemon } = useSearch(pokemonList);
const emit = defineEmits<{ (e: "open-pokedex", pokemon: Pokemon): void }>();

const headers = [
  { title: "Name", key: "name", sortable: true, width: "35%" },
  { title: "Typ", key: "type", sortable: true, width: "35%" },
  { title: "Bild", key: "image", sortable: false, align: "center" as const },
];

const shuffleOpponentTeam = () => {
  const shuffled = [...pokemonList.value].sort(() => 0.5 - Math.random());
  store.updateEnemyTeam(shuffled.slice(0, 3));
};
const shuffleYourTeam = () => {
  if (
    yourTeam.value.length > 0 &&
    !confirm(
      "Möchtest du dein aktuelles Team wirklich durch ein zufälliges ersetzen?"
    )
  ) {
    return;
  }
  const shuffled = [...pokemonList.value].sort(() => 0.5 - Math.random());
  store.updateYourTeam(shuffled.slice(0, 3));
};
</script>

<template>
  <div id="pokemon-table-component">
    <div class="main-content">
      <div class="team-column">
        <div class="team-box">
          <div class="team-header">
            <h3>Dein Team ({{ yourTeam.length }}/3)</h3>
            <v-btn @click="shuffleYourTeam" size="x-small" color="primary"
              >Shuffle</v-btn
            >
          </div>
          <div v-if="yourTeam.length === 0" class="team-placeholder">
            Erstelle dein Team
          </div>
          <div v-else class="team-members">
            <div
              v-for="(pokemon, index) in yourTeam"
              :key="'your-team-' + index"
              class="pokemon-container"
              @contextmenu.prevent="store.removeFromTeam(index)"
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
            <h3>Gegnerteam ({{ opponentTeam.length }}/3)</h3>
            <v-btn
              @click="shuffleOpponentTeam"
              size="x-small"
              color="orange-darken-2"
              >Shuffle</v-btn
            >
          </div>
          <div v-if="opponentTeam.length === 0" class="team-placeholder">
            Kein Gegnerteam
          </div>
          <div v-else class="team-members">
            <div
              v-for="(pokemon, index) in opponentTeam"
              :key="'opponent-team-' + index"
              class="pokemon-container"
              @contextmenu.prevent="store.removeFromOpponent(index)"
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
        <v-btn
          v-if="yourTeam.length > 0 && opponentTeam.length > 0"
          @click="store.startBattle"
          class="battle-btn"
        >
          START BATTLE
        </v-btn>
      </div>

      <div class="table-column">
        <div class="search-container">
          <div class="search-wrapper">
            <v-text-field
              v-model="searchQuery"
              label="Suche..."
              variant="solo"
              rounded
              dense
              hide-details
              prepend-inner-icon="mdi-magnify"
              class="search-input-custom"
            ></v-text-field>
          </div>
        </div>

        <div class="tabelle-container">
          <v-data-table
            :headers="headers"
            :items="filteredPokemon"
            hide-default-footer
            :items-per-page="-1"
            class="pokedex-table"
          >
            <template v-slot:item="{ item }">
              <tr @click="emit('open-pokedex', item)" class="pokemon-row">
                <td>{{ item.name }}</td>
                <td>{{ item.type }}</td>
                <td class="text-center">
                  <v-img :src="item.image" height="80" contain></v-img>
                </td>
              </tr>
            </template>
          </v-data-table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Durch die ID #pokemon-table-component am Anfang jeder Regel,
   wird unser CSS jetzt extrem spezifisch und gewinnt gegen Vuetify. */

#pokemon-table-component .main-content {
  display: flex;
  gap: 30px;
  width: 95vw;
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 20px;
  align-items: flex-start;
}
#pokemon-table-component .table-column {
  flex-grow: 1;
  min-width: 0;
}
#pokemon-table-component .team-column {
  width: 300px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-top: 70px;
}

#pokemon-table-component .team-box {
  background: linear-gradient(#9c9c9c, #9c9c9c), url("@/assets/teams-bg.jpg");
  background-size: cover;
  background-blend-mode: overlay;
  border: 6px solid #2070cc;
  border-radius: 8px;
  padding: 15px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}
#pokemon-table-component h3 {
  color: white;
  text-shadow: 1px 1px 2px black;
  font-size: 1.1rem;
}
#pokemon-table-component .team-placeholder {
  text-align: center;
  padding: 20px;
  color: #ffffff;
  font-style: italic;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
}
#pokemon-table-component .team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
#pokemon-table-component .team-members {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  padding: 5px;
}
#pokemon-table-component .team-pokemon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  transition: transform 0.2s;
  cursor: pointer;
  filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.5));
}
#pokemon-table-component .team-pokemon:hover {
  transform: scale(1.1);
}
#pokemon-table-component .battle-btn {
  background: linear-gradient(to bottom, #ff3e3e, #c00000);
  color: white !important;
  border: 2px solid #fff !important;
  border-radius: 8px !important;
  font-size: 1.2rem !important;
  font-weight: bold;
  letter-spacing: 1px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  padding: 22px 24px !important;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
#pokemon-table-component .battle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

#pokemon-table-component .search-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  height: 48px;
}
#pokemon-table-component .search-wrapper {
  width: 250px;
  border: 5px solid #2070cc;
  border-radius: 28px;
  margin-top:-8px;
  overflow: hidden;
}
#pokemon-table-component .search-input-custom {
  :deep(.v-field__input) {
    color: #333 !important;
    font-weight: bold;
  }
  :deep(.v-field) {
    background-color: rgb(255, 255, 255) !important;
  }
  :deep(label) {
    color: rgba(0, 0, 0, 0.6) !important;
  }
}

#pokemon-table-component .tabelle-container {
  border-radius: 10px;
  border: 6px solid #2070cc;
  height: calc(88vh - 120px);
  overflow: hidden;
  position: relative;
}
#pokemon-table-component .pokedex-table {
  height: 100%;
  background-color: rgba(10, 25, 41, 0.9) !important;
}
#pokemon-table-component :deep(.v-table__wrapper) {
  overflow-y: overlay !important;
}
#pokemon-table-component :deep(.v-table__wrapper::-webkit-scrollbar) {
  width: 8px;
}
#pokemon-table-component :deep(.v-table__wrapper::-webkit-scrollbar-thumb) {
  background-color: #2e6ac4;
  border-radius: 4px;
}

#pokemon-table-component :deep(thead) {
  position: sticky !important;
  top: 0;
  z-index: 1;
}
#pokemon-table-component :deep(th) {
  background-color: #1d3e70 !important;
  color: #ffd705 !important;
}

#pokemon-table-component :deep(tbody tr) {
  color: white;
  font-weight: bold;
  font-size: 1.3rem;
  text-shadow: 1px 1px 1px black;
}
#pokemon-table-component .pokemon-row {
  cursor: pointer;
  transition: background-color 0.2s ease-out !important;
}
#pokemon-table-component .pokemon-row:hover {
  background-color: rgba(32, 112, 204, 0.5) !important;
}
#pokemon-table-component :deep(td) {
  padding-left: 24px !important;
}
</style>
