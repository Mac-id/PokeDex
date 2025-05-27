<script setup lang="ts">
import { ref, computed } from "vue"; // Reaktive Referenzen und berechnete Werte aus Vue importieren
import type { Pokemon } from "../types"; // Typdefinition für Pokémon importieren

// Props definieren: erwartet wird eine Liste von Pokémon, die extern übergeben wird
const props = defineProps<{
  pokemonList: Pokemon[];
}>();

// Events definieren: "edit"-Event wird ausgelöst, wenn ein Pokémon bearbeitet werden soll
const emit = defineEmits<{
  (e: "edit", pokemon: Pokemon): void;
}>();

// Reaktive Referenz für das Suchfeld
const searchQuery = ref("");

// Computed Property für gefilterte Pokémon basierend auf Suchtext
const filteredPokemon = computed(() => {
  if (!searchQuery.value) return props.pokemonList; // Wenn keine Suche, zeige alle Pokémon

  const query = searchQuery.value.toLowerCase(); // Suchtext in Kleinbuchstaben
  return props.pokemonList.filter(
    (pokemon) =>
      pokemon.name.toLowerCase().includes(query) || // Treffer im Namen
      pokemon.type.toLowerCase().includes(query) // oder im Typ
  );
});

// Funktion, die ausgeführt wird, wenn "Kakuna" entwickelt wird
function entwicklePokemon() {
  alert("Kakuna entwickelt sich zu Beedrill!"); // Einfache Aktion: Zeigt Hinweisfenster
}
</script>

<template>
  <!-- Gesamtcontainer der Seite -->
  <div class="page-container">
    <!-- Header mit Pokémon-Logo -->
    <header class="header">
      <img alt="Pokemon" class="logo" src="@/assets/pokemon-logo.png" />
    </header>

    <!-- Inhaltlicher Bereich unter dem Header -->
    <div class="content-wrapper">
      <!-- Suchfeld für Name oder Typ -->
      <div class="search-container">
        <input
          v-model="searchQuery"
          placeholder="Suche nach Name oder Typ..."
          class="search-input"
        />
      </div>

      <!-- Tabellencontainer -->
      <div class="tabelle-container">
        <!-- Tabelle wird nur angezeigt, wenn Filterergebnis nicht leer ist -->
        <table class="tabelle" v-if="filteredPokemon.length">
          <thead>
            <tr>
              <th>Name</th>
              <th>Typ</th>
              <th>Bild</th>
            </tr>
          </thead>
          <tbody>
            <!-- Pokémon-Zeile, löst das 'edit'-Event aus -->
            <tr
              v-for="(pokemon, index) in filteredPokemon"
              :key="index"
              @click="emit('edit', pokemon)"
              class="pokemon-row"
            >
              <!-- Pokémon-Name mit optionalem Button für Kakuna -->
              <td :class="{ pid: pokemon.name.toLowerCase().includes('pid') }">
                {{ pokemon.name }}

                <!-- Button erscheint nur bei Kakuna, ruft Entwickeln auf -->
                <!-- @click.stop verhindert, dass der Zeilenklick ausgelöst wird -->
                <button
                  class="btn"
                  v-if="pokemon.name === 'Kakuna'"
                  @click.stop="entwicklePokemon"
                >
                  Entwickeln
                </button>
              </td>

              <!-- Pokémon-Typ -->
              <td>{{ pokemon.type }}</td>

              <!-- Pokémon-Bild -->
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

        <!-- Wird angezeigt, wenn kein Pokémon gefunden wurde -->
        <p v-else>Keine Pokémon gefunden</p>
      </div>
    </div>

    <h1 class="dev">by Mac-Id</h1>

    <!-- Pikachu-GIF läuft unten entlang -->
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
}

header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  height: 100px;
  margin-top: -10rem;
  margin-bottom: -70px;
}

/* Wrapper für Inhalte unterhalb des Headers */
.content-wrapper {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
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

/* Pikachu animiert */
.pikachu {
  position: fixed;
  bottom: 0;
  left: 0;
  height: 80px;
  animation: move-pikachu 8s linear infinite;
  pointer-events: none;
  z-index: 9999;
}

/* Suchfeld-Container */
.search-container {
  display: flex;
  justify-content: flex-end;
  width: 90vw;
  max-width: 1200px;
  margin: 0 auto 15px;
}

/* Suchfeld-Styling */
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

/* Tabellenzeile Hover-Effekt */
.pokemon-row {
  cursor: pointer;
  transition: background-color 0.2s;
}
.pokemon-row:hover {
  background-color: rgba(231, 94, 3, 0.103);
}

/* Animation für Pikachu */
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

/* Name mit "pid" hervorheben */
.pid {
  color: #2070cc;
  font-weight: bold;
}

/* Entwickeln-Button */
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

/* Tabellen-Container mit Scrollbar */
.tabelle-container {
  border-radius: 10px;
  border: 6px solid #2070cc;
  width: 90vw;
  max-width: 1200px;
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

/* Custom Scrollbar */
.tabelle-container::-webkit-scrollbar {
  width: 6px;
}
.tabelle-container::-webkit-scrollbar-thumb {
  background-color: #2e6ac4;
  border-radius: 3px;
}

/* Tabellen-Styling */
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

/* Spaltentrenner und Schriftgrößen */
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
