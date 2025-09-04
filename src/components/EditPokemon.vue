<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Pokemon } from "../types";
import { usePokemonStore } from '../store/pokemonStore';

const props = defineProps<{ initialPokemon: Pokemon; }>();
const emit = defineEmits<{ (e: 'save', pokemon: Pokemon): void; (e: 'cancel'): void; }>();

const store = usePokemonStore();
const formData = ref<Pokemon>({ ...props.initialPokemon });
const selectedSprite = ref(props.initialPokemon.image);
const originalName = ref(props.initialPokemon.name);
const sprites = ref<string[]>(props.initialPokemon.sprites || []);
const moves = ref(props.initialPokemon.moves || []);

onMounted(async () => {
  if ((!formData.value.moves || formData.value.moves.length === 0) && formData.value.moveUrls) {
    await store.loadMoveDetails(formData.value);
    moves.value = formData.value.moves || [];
  }
  if (!formData.value.sprites || formData.value.sprites.length === 0) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${formData.value.name.toLowerCase()}`);
      const data = await response.json();
      const spriteList = [];
      const spriteData = data.sprites;
      for (const key in spriteData) { if (spriteData[key] && typeof spriteData[key] === "string") { spriteList.push(spriteData[key]); } }
      formData.value.sprites = spriteList.filter(Boolean);
      sprites.value = formData.value.sprites;
      selectedSprite.value = formData.value.sprites[0] || formData.value.image;
    } catch (error) {
      console.error("Error loading sprites:", error);
      formData.value.sprites = [formData.value.image];
      sprites.value = [formData.value.image];
    }
  }
});

const handleSave = () => { formData.value.image = selectedSprite.value; emit('save', formData.value); };
const getEffectiveness = (move: { power: number; damageClass: string }): string => { if (move.damageClass === "status") return "⚡ Status"; const basePower = move.power || 0; let effectiveness = ""; if (basePower >= 90) effectiveness = "💥 Stark"; else if (basePower >= 50) effectiveness = "🔵 Mittel"; else if (basePower > 0) effectiveness = "🔶 Schwach"; return `${effectiveness} (${basePower})`; };
</script>

<template>
  <div class="edit-modal">
    <div class="edit-content">
      <h2>{{ originalName }} bearbeiten</h2>
      <div class="form-group">
        <label>Name:</label>
        <input v-model="formData.name" @keypress.enter="handleSave" />
      </div>
      <div class="form-group">
        <label>Typ:</label>
        <input v-model="formData.type" @keypress.enter="handleSave" />
      </div>
      <div class="form-group">
        <label>Bild auswählen:</label>
        <select v-model="selectedSprite" class="sprite-select">
          <option v-for="(sprite, index) in sprites" :key="index" :value="sprite">Sprite {{ index + 1 }}</option>
        </select>
      </div>
      <div class="preview">
        <img :src="selectedSprite" :alt="formData.name" />
      </div>
      <div class="moves-section" v-if="moves.length > 3">
        <h3>Attacken</h3>
        <div class="moves-list">
          <div v-for="(move, index) in moves.slice(3, 6)" :key="index" class="move" :class="move.type">
            <div class="move-header">
              <span class="move-name">{{ move.name.charAt(0).toUpperCase() + move.name.slice(1) }}</span>
              <span class="move-type">{{ move.type }}</span>
            </div>
            <div class="move-details">
              <span class="move-effectiveness">{{ getEffectiveness(move) }}</span>
              <span class="move-damage-class">{{ move.damageClass === "status" ? "Status" : "Schaden" }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <button @click="handleSave" class="save-btn">Speichern</button>
        <button @click="emit('cancel')" class="cancel-btn">Abbrechen</button>
        <button v-if="store.yourTeam.length < 3" @click="store.addToTeam(formData)" class="add-team-btn">Ins Team</button>
        <button v-if="store.opponentTeam.length < 3" @click="store.addToOpponentTeam(formData)" class="add-opponent-btn">Ins Gegnerteam</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped Styles bleiben unverändert */
.edit-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.edit-content { background-color: #e4c932; border: 2px solid #2070cc; padding: 2rem; border-radius: 10px; width: 90%; max-width: 500px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); max-height: 90vh; overflow-y: auto; max-height: none !important; overflow: visible !important; }
.form-group { margin-bottom: 1rem; width: 95%; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
.form-group input { width: 100%; padding: 0.5rem; border: 2px solid #2070cc; border-radius: 5px; }
.sprite-select { width: 100%; padding: 8px; border: 2px solid #2070cc; border-radius: 5px; background-color: #e4c932; color: #2070cc; font-weight: bold; margin-top: 5px; }
.preview img { max-width: 100%; max-height: 200px; margin-top: 1rem; border: 2px solid #2070cc; border-radius: 5px; }
.moves-section { margin-top: 1rem; padding: 1rem; background-color: rgba(255, 255, 255, 0.2); border-radius: 5px; }
.moves-list { display: flex; flex-direction: column; gap: 0.8rem; }
.move { padding: 0.8rem; border-radius: 8px; background-color: rgba(255, 255, 255, 0.1); border-left: 4px solid var(--type-color, #a8a878); }
.move-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
.move-name { font-weight: bold; color: #000000; }
.move-type { padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: bold; color: white; text-transform: capitalize; background-color: var(--type-color, #a8a878); }
.move-details { display: flex; justify-content: space-between; font-size: 0.9rem; }
.move-effectiveness { font-weight: bold; }
.move-damage-class { color: #666; font-style: italic; }
.actions { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; }
button { padding: 0.5rem 1rem; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.save-btn { background: #2070cc; color: #e4c932; }
.save-btn:hover { background: #1a5ca1; }
.cancel-btn { background: #e4c932; color: #2070cc; border: 1px solid #2070cc; }
.cancel-btn:hover { background: #d4b92a; }
.add-team-btn { background: #4caf50; color: white; }
.add-team-btn:hover { background: #3e8e41; }
.add-opponent-btn { background: #ffad16; color: white; }
.add-opponent-btn:hover { background: #b97f11; }
.normal { --type-color: #a8a878; } .fire { --type-color: #f08030; } .water { --type-color: #6890f0; } .electric { --type-color: #f8d030; } .grass { --type-color: #78c850; } .ice { --type-color: #98d8d8; } .fighting { --type-color: #c03028; } .poison { --type-color: #a040a0; } .ground { --type-color: #e0c068; } .flying { --type-color: #a890f0; } .psychic { --type-color: #f85888; } .bug { --type-color: #a8b820; } .rock { --type-color: #b8a038; } .ghost { --type-color: #705898; } .dragon { --type-color: #7038f8; } .dark { --type-color: #705848; } .steel { --type-color: #b8b8d0; } .fairy { --type-color: #ee99ac; }
</style>