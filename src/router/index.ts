// Importiere Funktionen zum Erstellen des Routers und zur Verwendung des Browser-History-Modus
import { createRouter, createWebHistory } from "vue-router";

// Importiere die Komponenten, die als Seiten dienen
import PokemonTable from "../components/PokemonTable.vue";
import EditPokemon from "../components/EditPokemon.vue";

// Definiere die Routen der Anwendung
const routes = [
  {
    path: "/", // Startseite (Root-URL)
    name: "Home", // Routenname
    component: PokemonTable, // Zeigt die Pokémon-Tabelle an
  },
  {
    path: "/edit", // Seite zum Bearbeiten eines Pokémon
    name: "EditPokemon", // Routenname
    component: EditPokemon, // Zeigt das Bearbeitungsformular an
  },
];

// Erstelle den Router mit dem History-Modus für saubere URLs (ohne Hash #)
const router = createRouter({
  history: createWebHistory(), // Nutzt HTML5 History API
  routes, // Übergibt die definierten Routen
});

// Exportiere den Router, damit er in der App verwendet werden kann
export default router;
