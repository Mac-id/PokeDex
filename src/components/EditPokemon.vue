<script setup lang="ts">
// Vue-spezifische Funktionen importieren
import { ref, watch, onMounted } from "vue";
import type { Pokemon } from "../types";

// Props definieren: erwartet ein initiales Pokémon-Objekt
const props = defineProps<{
  initialPokemon: Pokemon;
}>();

// Events definieren, die nach außen gesendet werden können
const emit = defineEmits<{
  (e: "save", pokemon: Pokemon): void; // Beim Speichern
  (e: "cancel"): void; // Beim Abbrechen
}>();

// Lokaler Zustand des Formulars – beginnt als Kopie des übergebenen Pokémon-Objekts
const formData = ref<Pokemon>({ ...props.initialPokemon });

// Speichert den ursprünglichen Namen (z. B. für Überschrift)
const originalName = ref(props.initialPokemon.name);

// Liste der verfügbaren Sprites (Bilder) für das Pokémon
const sprites = ref<string[]>([]);

// Der aktuell ausgewählte Sprite (Bild)
const selectedSprite = ref("");

// Wird aufgerufen, wenn auf "Speichern" geklickt wird
const handleSave = () => {
  emit("save", formData.value); // sendet das aktualisierte Pokémon zurück an die Elternkomponente
};

// Wird aufgerufen, wenn auf "Abbrechen" geklickt wird
const handleCancel = () => {
  emit("cancel"); // teilt der Elternkomponente mit, dass der Vorgang abgebrochen wurde
};

// Lädt zusätzliche Sprites für das Pokémon von der PokéAPI
async function fetchSprites() {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${props.initialPokemon.name.toLowerCase()}`
    );
    const data = await response.json();

    const spriteList = [];
    const spriteData = data.sprites;

    // Extrahiert nur die Sprite-URLs (z. B. front_default, back_default usw.)
    for (const key in spriteData) {
      if (spriteData[key] && typeof spriteData[key] === "string") {
        spriteList.push(spriteData[key]);
      }
    }

    // Filtert leere Einträge und speichert die Liste
    sprites.value = spriteList.filter(Boolean);

    // Setzt den ersten Sprite als Standardbild oder verwendet das ursprüngliche Bild
    selectedSprite.value = sprites.value[0] || formData.value.image;
  } catch (error) {
    // Fehlerbehandlung beim Laden der Sprites
    console.error("Fehler beim Laden der Sprites:", error);
    sprites.value = [formData.value.image];
    selectedSprite.value = formData.value.image;
  }
}

// Aktualisiert das Bild des Pokémon, wenn ein anderes Sprite ausgewählt wird
watch(selectedSprite, (newVal) => {
  formData.value.image = newVal;
});

// Startet den Ladevorgang der Sprites beim Laden der Komponente
onMounted(() => {
  fetchSprites();
});
</script>

<template>
  <div class="edit-modal">
    <div class="edit-content">
      <!-- Überschrift mit ursprünglichem Namen -->
      <h2>{{ originalName }} bearbeiten</h2>

      <!-- Eingabefeld für den Namen -->
      <div class="form-group">
        <label>Name:</label>
        <input v-model="formData.name" @keypress.enter="handleSave" />
      </div>

      <!-- Eingabefeld für den Typ -->
      <div class="form-group">
        <label>Typ:</label>
        <input v-model="formData.type" @keypress.enter="handleSave" />
      </div>

      <!-- Dropdown zum Auswählen eines Bildes -->
      <div class="form-group">
        <label>Bild auswählen:</label>
        <select v-model="selectedSprite" class="sprite-select">
          <option
            v-for="(sprite, index) in sprites"
            :key="index"
            :value="sprite"
          >
            Sprite {{ index + 1 }}
          </option>
        </select>
      </div>

      <!-- Vorschau des aktuell ausgewählten Bildes -->
      <div class="preview">
        <img :src="selectedSprite" :alt="formData.name" />
      </div>

      <!-- Buttons zum Speichern oder Abbrechen -->
      <div class="actions">
        <button @click="handleSave" class="save-btn">Speichern</button>
        <button @click="handleCancel" class="cancel-btn">Abbrechen</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modal-Overlay für Bearbeitungsfenster */
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Innenbereich des Modals */
.edit-content {
  background-color: #e4c932;
  border: 2px solid #2070cc;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

/* Formulargruppen */
.form-group {
  margin-bottom: 1rem;
  width: 95%;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #2070cc;
  border-radius: 5px;
}

/* Dropdown für Sprites */
.sprite-select {
  width: 100%;
  padding: 8px;
  border: 2px solid #2070cc;
  border-radius: 5px;
  background-color: #e4c932;
  color: #2070cc;
  font-weight: bold;
  margin-top: 5px;
}

/* Bildvorschau */
.preview img {
  max-width: 100%;
  max-height: 200px;
  margin-top: 1rem;
  border: 2px solid #2070cc;
  border-radius: 5px;
}

/* Button-Bereich */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}

/* Farben für Speichern und Abbrechen */
.save-btn {
  background: #2070cc;
  color: #e4c932;
}

.cancel-btn {
  background: #e4c932;
  color: #2070cc;
}
</style>
