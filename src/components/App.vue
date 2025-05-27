<script setup lang="ts">
// Vue-Komponenten- und -Hooks importieren
import { ref, onMounted } from "vue";

// Import der Kinderkomponenten
import PokemonTable from "./PokemonTable.vue";
import EditPokemon from "./EditPokemon.vue";

// Typdefinition für ein Pokémon
import type { Pokemon } from "../types";

// Reactive Referenzen für die Pokémonliste, das aktuell bearbeitete Pokémon und das Anzeigen des Edit-Formulars
const pokemonList = ref<Pokemon[]>([]);
const editingPokemon = ref<Pokemon | null>(null);
const showEditForm = ref(false);

// Wird ausgeführt, sobald die Komponente gemountet ist
onMounted(async () => {
  try {
    // Ruft die Liste aller Pokémon ab (bis zu 1025)
    const response = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=1025"
    );
    const data = await response.json();

    // Für jedes Pokémon in der Liste werden Details abgefragt
    pokemonList.value = await Promise.all(
      data.results.map(async (pokemon: { name: string; url: string }) => {
        const res = await fetch(pokemon.url);
        const details = await res.json();

        // Name, Typen und Bild des Pokémon werden extrahiert und formatiert
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
    // Fehlerbehandlung beim Laden der Daten
    console.error("Fehler beim Laden:", error);
  }
});

// Funktion zum Starten des Editierens eines Pokémon
function handleEdit(pokemon: Pokemon) {
  // Erstellt eine Kopie des Pokémon-Objekts für die Bearbeitung
  editingPokemon.value = JSON.parse(JSON.stringify(pokemon));
  showEditForm.value = true;
}

// Funktion zum Speichern des bearbeiteten Pokémon
function handleSave(updatedPokemon: Pokemon) {
  // Findet das ursprüngliche Pokémon in der Liste und ersetzt es mit dem aktualisierten
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
  <div class="app-container">
    <!-- Tabelle mit Pokémon-Liste -->
    <PokemonTable :pokemonList="pokemonList" @edit="handleEdit" />

    <!-- Bearbeitungsformular wird angezeigt, wenn ein Pokémon bearbeitet wird -->
    <EditPokemon
      v-if="showEditForm && editingPokemon"
      :initialPokemon="editingPokemon"
      @save="handleSave"
      @cancel="showEditForm = false"
    />
  </div>
</template>

<style>
/* Verhindert Scrollen und stellt sicher, dass Hintergrundbild den gesamten Bereich abdeckt */
body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden; /* Verhindert horizontales Scrollen */
}

/* Container für die App mit Hintergrundbild und Padding für z. B. Header */
.app-container {
  min-height: 100vh;
  background-image: url("@/assets/pokemon-bg.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding-top: 120px; /* Platz für Header */
  box-sizing: border-box;
}
</style>
