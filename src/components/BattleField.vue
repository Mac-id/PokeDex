<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Pokemon } from "../types";

const props = defineProps<{
  yourTeam: Pokemon[];
  opponentTeam: Pokemon[];
}>();

const emit = defineEmits<{
  (e: 'close-battle'): void;
  (e: 'switch-pokemon', index: number): void;
}>();

// Entfernen Sie die showBattle Variable - sie wird von der Elternkomponente gesteuert
const showPokemonMenu = ref(false);
const showAttackMenu = ref(false);
const battleAnimation = ref(true);

const getfrontSprite = computed(() => props.yourTeam[0]?.image || '');
const getBackSprite = computed(() => {
  const img = props.yourTeam[0]?.image;
  return img ? img.replace('/sprites/pokemon/', '/sprites/pokemon/back/') : '';
});

// Startanimation beim Laden
onMounted(() => {
  setTimeout(() => {
    battleAnimation.value = false;
  }, 2000); // 2 Sekunden Animation
});

function handleAttack(): void {
  showAttackMenu.value = true;
}

function handleFlee(): void {
  emit('close-battle');
}

function handleSwitchPokemon(index: number): void {
  emit('switch-pokemon', index);
  showPokemonMenu.value = false;
}

// Angriffe des aktiven Pokémon 
const attacks = ref([
  { name: "Tackle", power: 40, type: "Normal" },
  { name: "Heuler", power: 0, type: "Status" },
  { name: "Glut", power: 40, type: "Feuer" },
  { name: "Hydropumpe", power: 110, type: "Wasser" }
]);
</script>

<template>
  <div class="battle-screen">
    <!-- Startanimation -->
    <div v-if="battleAnimation" class="battle-start-animation">
      <div class="animation-content">
        <h1>Ein wildes {{ opponentTeam[0]?.name }} erscheint!</h1>
      </div>
    </div>

    <!-- Hauptkampfbildschirm -->
    <div class="battle-background">
      <!-- Gegnerisches Pokémon -->
      <div class="opponent-pokemon">
        <img :src="opponentTeam[0]?.image" 
             class="enemy-sprite"
             :alt="opponentTeam[0]?.name">
      </div>
      
      <!-- Eigenes Pokémon -->
      <div class="player-pokemon">
        <img :src="getBackSprite" 
             class="player-sprite"
             :alt="yourTeam[0]?.name">
      </div>
      
      <!-- Kampfmenü -->
      <div class="battle-menu">
        <div v-if="!showAttackMenu && !showPokemonMenu" class="menu-options">
          <button @click="handleAttack">KAMPF</button>
          <button @click="showPokemonMenu = true">PKMN</button>
          <button @click="emit('close-battle')" class="flee-btn">FLUCHT</button>
        </div>

        <!-- Angriffsmenü -->
        <div v-if="showAttackMenu" class="attack-menu">
          <h3>Wähle eine Attacke:</h3>
          <div class="attack-list">
            <button v-for="(attack, index) in attacks" 
                    :key="index"
                    class="attack-option"
                    @click="showAttackMenu = false">
              <span class="attack-name">{{ attack.name }}</span>
              <span class="attack-power">{{ attack.power > 0 ? attack.power : '---' }}</span>
              <span class="attack-type">{{ attack.type }}</span>
            </button>
          </div>
          <button @click="showAttackMenu = false" class="back-btn">← Zurück</button>
        </div>
        
        <!-- Pokémon-Wechsel-Menü -->
        <div v-if="showPokemonMenu" class="pokemon-switch-menu">
          <h3>Wähle ein Pokémon:</h3>
          <div class="pokemon-list">
            <div v-for="(pokemon, index) in yourTeam" 
                 :key="index"
                 class="pokemon-option"
                 @click="handleSwitchPokemon(index)">
              <img :src="pokemon.image" 
                   class="switch-sprite"
                   :alt="pokemon.name">
              <span>{{ pokemon.name }}</span>
            </div>
          </div>
          <button @click="showPokemonMenu = false" class="back-btn">← Zurück</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-screen {
  animation: fadeInScale 0.3s ease-out;
  width: 80%;
  height: 80vh;
  margin-left: 10%;
  margin-top: -2%;
  background-color: #fff;
  border: 6px solid #383838;
  border-radius: 23px;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 100;
}
/* Startanimation */
.battle-start-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
  animation: fadeIn 0.5s ease-in;
  border-radius: 16px;
}


.animation-content {
  text-align: center;
  color: white;
  font-family: 'Pokemon GB', sans-serif;
  font-size: 2rem;
  text-transform: uppercase;
}

@keyframes fadeInScale {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

/* Hauptkampfbildschirm */
.battle-background {
  width: 100%;
  height: 100%;
  margin-bottom: 50;
  background-color: #e0e0c0;
  position: relative;
  overflow: hidden;
  background-image: url('@/assets/battle-bg.jpg');
  background-size: cover;
  overflow: hidden;
  border-radius: 16px;
}

.enemy-sprite {
  position: absolute;
  top: 12%;
  right: 9%;
  width: 400px;
  height: 400px;
  image-rendering: pixelated;
  z-index: 10;
}

.player-sprite {
  position: absolute;
  bottom: -45%;
  left: -9%;
  width: 60rem;
  height: 60rem;
  image-rendering: pixelated;
  transform: scaleX(1);
  z-index: 10;
}

.battle-menu {
  position: absolute;
  bottom: 5%;
  right: 5%;
  width: 400px;
  height: 150px;
  background-color: #f8f8f8;
  border: 6px solid #383838;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.menu-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  width: 90%;
}

.menu-options button {
  padding: 15px;
  background-color: #f0f0f0;
  border: 3px solid #a0a0a0;
  border-radius: 8px;
  font-family: 'Pokemon GB', monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-options button:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

/* Angriffsmenü */
.attack-menu {
  width: 100%;
  padding: 15px;
}

.attack-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 15px 0;
}

.attack-option {
  padding: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  display: flex;
  justify-content: space-between;
}

.attack-name {
  font-weight: bold;
}

.attack-power {
  color: #666;
}

.attack-type {
  background-color: #ddd;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
}

/* Pokémon-Wechsel-Menü */
.pokemon-switch-menu {
  width: 100%;
  padding: 15px;
}

.pokemon-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.pokemon-option {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.pokemon-option:hover {
  background-color: #e0e0e0;
  transform: translateX(5px);
}

.switch-sprite {
  width: 50px;
  height: 50px;
  margin-right: 15px;
  image-rendering: pixelated;
}

.back-btn {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #f0f0f0;
  border: 3px solid #a0a0a0;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Pokemon GB', monospace;
}
</style>