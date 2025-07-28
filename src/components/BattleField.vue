<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import type { Pokemon, Move } from "../types";

// --- DATEN & KONSTANTEN ---
const typeChart: { [key: string]: { strong_against: string[], weak_against: string[], immune: string[] } } = {
  normal: { strong_against: [], weak_against: ["rock", "steel"], immune: ["ghost"] },
  fire: { strong_against: ["grass", "ice", "bug", "steel"], weak_against: ["fire", "water", "rock", "dragon"], immune: [] },
  water: { strong_against: ["fire", "ground", "rock"], weak_against: ["water", "grass", "dragon"], immune: [] },
  electric: { strong_against: ["water", "flying"], weak_against: ["electric", "grass", "dragon"], immune: ["ground"] },
  grass: { strong_against: ["water", "ground", "rock"], weak_against: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"], immune: [] },
  ice: { strong_against: ["grass", "ground", "flying", "dragon"], weak_against: ["fire", "water", "ice", "steel"], immune: [] },
  fighting: { strong_against: ["normal", "ice", "rock", "dark", "steel"], weak_against: ["poison", "flying", "psychic", "bug", "fairy"], immune: ["ghost"] },
  poison: { strong_against: ["grass", "fairy"], weak_against: ["poison", "ground", "rock", "ghost"], immune: ["steel"] },
  ground: { strong_against: ["fire", "electric", "poison", "rock", "steel"], weak_against: ["grass", "bug"], immune: ["flying"] },
  flying: { strong_against: ["grass", "fighting", "bug"], weak_against: ["electric", "rock", "steel"], immune: [] },
  psychic: { strong_against: ["fighting", "poison"], weak_against: ["psychic", "steel"], immune: ["dark"] },
  bug: { strong_against: ["grass", "psychic", "dark"], weak_against: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"], immune: [] },
  rock: { strong_against: ["fire", "ice", "flying", "bug"], weak_against: ["fighting", "ground", "steel"], immune: [] },
  ghost: { strong_against: ["psychic", "ghost"], weak_against: ["dark"], immune: ["normal"] },
  dragon: { strong_against: ["dragon"], weak_against: ["steel"], immune: ["fairy"] },
  dark: { strong_against: ["psychic", "ghost"], weak_against: ["fighting", "dark", "fairy"], immune: [] },
  steel: { strong_against: ["ice", "rock", "fairy"], weak_against: ["fire", "water", "electric", "steel"], immune: [] },
  fairy: { strong_against: ["fighting", "dragon", "dark"], weak_against: ["fire", "poison", "steel"], immune: [] }
};

const damageClassTranslations: { [key: string]: string } = {
  physical: 'Physisch',
  special: 'Speziell',
  status: 'Status'
};

const props = defineProps<{
  yourTeam: Pokemon[];
  opponentTeam: Pokemon[];
  loadMoveDetails: (pokemon: Pokemon) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: 'close-battle'): void;
  (e: 'switch-pokemon', index: number): void;
}>();

// --- STATE MANAGEMENT ---
const activeMenu = ref<'main' | 'attack' | 'pokemon' | 'item' | 'message'>('main');
const isSwitchForced = ref(false);
const battleMessage = ref('');

// --- Inventar ---
const inventory = ref([
  { name: 'Trank', description: 'Heilt 20 KP.', healing: 20, count: 2 },
  { name: 'Supertrank', description: 'Heilt 50 KP.', healing: 50, count: 1 },
]);

// --- Kampf-Zustände ---
const battleAnimation = ref(true);
const uiReady = ref(false);
const currentHealth = ref<number[]>([]);
const opponentHealth = ref<number[]>([]);
const yourStatMods = ref({ attack: 0, defense: 0 });
const opponentStatMods = ref({ attack: 0, defense: 0 });

// Animation states & UI
const playerAttacking = ref(false);
const opponentAttacking = ref(false);
const playerEntering = ref(false);
const opponentEntering = ref(false);
const playerStatusAnimating = ref(false);
const opponentStatusAnimating = ref(false);
const screenShake = ref(false);
const showDamageText = ref(false);
const damageAmount = ref(0);
const damageTarget = ref('');
const showFaintMessage = ref(false);

// --- Computed Properties ---
const yourActivePokemon = computed(() => props.yourTeam?.[0]);
const opponentActivePokemon = computed(() => props.opponentTeam?.[0]);
const getFrontSprite = computed(() => opponentActivePokemon.value?.image || '');
const getBackSprite = computed(() => yourActivePokemon.value?.image ? yourActivePokemon.value.image.replace('/sprites/pokemon/', '/sprites/pokemon/back/') : '');
const yourHPPercentage = computed(() => (currentHealth.value[0] / (yourActivePokemon.value?.stats?.hp || 1)) * 100);
const opponentHPPercentage = computed(() => (opponentHealth.value[0] / (opponentActivePokemon.value?.stats?.hp || 1)) * 100);
const yourCurrentMoves = computed(() => yourActivePokemon.value?.moves || []);
const opponentCurrentMoves = computed(() => opponentActivePokemon.value?.moves || []);

// --- Lifecycle & Watchers ---
onMounted(async () => {
  setTimeout(() => {
    uiReady.value = true;
  }, 500);

  setTimeout(() => {
    battleAnimation.value = false;
  }, 2000);

  currentHealth.value = props.yourTeam.map(p => p.stats?.hp || 100);
  opponentHealth.value = props.opponentTeam.map(p => p.stats?.hp || 100);
  await loadAllPokemonMoves();
});

watch(() => props.yourTeam[0], (newPokemon, oldPokemon) => {
  if (newPokemon && newPokemon !== oldPokemon && (!newPokemon.moves || newPokemon.moves.length === 0)) {
    props.loadMoveDetails(newPokemon);
  }
  if (newPokemon && oldPokemon) {
    playerEntering.value = true;
    setTimeout(() => { playerEntering.value = false; }, 700);
  }
}, { immediate: true });

watch(() => props.opponentTeam[0], (newPokemon, oldPokemon) => {
  if (newPokemon && newPokemon !== oldPokemon && (!newPokemon.moves || newPokemon.moves.length === 0)) {
    props.loadMoveDetails(newPokemon);
  }
  if (newPokemon && newPokemon !== oldPokemon) {
    opponentEntering.value = true;
    setTimeout(() => { opponentEntering.value = false; }, 700);
  }
}, { immediate: true });

// --- KAMPFLOGIK-METHODEN ---
async function displayMessage(message: string, duration: number = 1500) {
  activeMenu.value = 'message';
  battleMessage.value = message;
  await new Promise(resolve => setTimeout(resolve, duration));
  battleMessage.value = '';
}

function calculateTypeMultiplier(moveType: string, defenderTypes: string[]): { multiplier: number, message: string } {
  let totalMultiplier = 1;
  let effectivenessMessage = '';
  for (const defenderType of defenderTypes) {
    const moveTypeLower = moveType.toLowerCase();
    const defenderTypeLower = defenderType.toLowerCase();
    if (typeChart[moveTypeLower]?.strong_against.includes(defenderTypeLower)) totalMultiplier *= 2;
    if (typeChart[moveTypeLower]?.weak_against.includes(defenderTypeLower)) totalMultiplier *= 0.5;
    if (typeChart[moveTypeLower]?.immune.includes(defenderTypeLower)) totalMultiplier *= 0;
  }
  if (totalMultiplier > 1) effectivenessMessage = "Die Attacke ist sehr effektiv!";
  if (totalMultiplier > 0 && totalMultiplier < 1) effectivenessMessage = "Die Attacke ist nicht sehr effektiv...";
  if (totalMultiplier === 0) effectivenessMessage = "Die Attacke hat keine Wirkung!";
  return { multiplier: totalMultiplier, message: effectivenessMessage };
}

async function handleStatusMove(move: Move, user: 'player' | 'opponent') {
  const userName = user === 'player' ? yourActivePokemon.value?.name : opponentActivePokemon.value?.name;
  await displayMessage(`${userName} setzt ${formatMoveName(move.name)} ein!`, 1000);

  if (user === 'player') playerStatusAnimating.value = true;
  else opponentStatusAnimating.value = true;
  
  await new Promise(resolve => setTimeout(resolve, 800));

  playerStatusAnimating.value = false;
  opponentStatusAnimating.value = false;
  
  let effectMessage = '';
  switch (move.name) {
    case 'swords-dance':
    case 'schwerttanz':
      if (user === 'player') yourStatMods.value.attack = Math.min(6, yourStatMods.value.attack + 2);
      else opponentStatMods.value.attack = Math.min(6, opponentStatMods.value.attack + 2);
      effectMessage = `Der Angriff von ${userName} wurde stark erhöht!`;
      break;
    
    default:
      effectMessage = `...aber es passierte nichts!`;
      break;
  }
  await displayMessage(effectMessage);
}

async function loadAllPokemonMoves() {
  await Promise.all([...props.yourTeam, ...props.opponentTeam].map(p => props.loadMoveDetails(p)));
}

function formatMoveName(name: string): string {
  return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function handleAttack(): void {
  if (currentHealth.value[0] <= 0) {
    isSwitchForced.value = true;
    activeMenu.value = 'pokemon';
    return;
  }
  activeMenu.value = 'attack';
}

function handleFlee(): void {
  if (isSwitchForced.value) return;
  if (confirm('Möchtest du wirklich fliehen?')) emit('close-battle');
}

async function useItem(itemToUse: { name: string; healing: number; count: number }) {
  const inventoryItem = inventory.value.find(i => i.name === itemToUse.name);
  if (!inventoryItem || inventoryItem.count <= 0) return;

  const activePokemon = yourActivePokemon.value;
  const maxHP = activePokemon?.stats?.hp;
  if (!activePokemon || !maxHP || currentHealth.value[0] >= maxHP) {
    await displayMessage(`${activePokemon?.name} hat bereits volle KP!`);
    activeMenu.value = 'item';
    return;
  }

  const oldHealth = currentHealth.value[0];
  const newHealth = Math.min(maxHP, oldHealth + inventoryItem.healing);
  currentHealth.value[0] = newHealth;
  inventoryItem.count--;

  await displayMessage(`${activePokemon.name} wurde um ${newHealth - oldHealth} KP geheilt!`);
  
  setTimeout(opponentTurn, 500);
}

async function handleSwitchPokemon(index: number): Promise<void> {
  if (index === 0 || currentHealth.value[index] <= 0) return;

  const wasSwitchForced = isSwitchForced.value;
  isSwitchForced.value = false;
  
  const healthToMove = currentHealth.value.splice(index, 1)[0];
  currentHealth.value.unshift(healthToMove);
  emit('switch-pokemon', index);
  
  if (!wasSwitchForced) {
    activeMenu.value = 'message';
    await new Promise(resolve => setTimeout(resolve, 1000));
    opponentTurn();
  } else {
    activeMenu.value = 'main';
  }
}

async function executeMove(move: Move) {
  if (currentHealth.value[0] <= 0) return;
  
  activeMenu.value = 'message';
  
  if (move.accuracy && Math.random() * 100 > move.accuracy) {
    await displayMessage(`${yourActivePokemon.value?.name} setzt ${formatMoveName(move.name)} ein!`);
    await displayMessage(`...aber der Angriff verfehlte!`);
    setTimeout(opponentTurn, 500);
    return;
  }
  
  if (move.damageClass === 'status') {
    await handleStatusMove(move, 'player');
    setTimeout(opponentTurn, 500);
  } else {
    await displayMessage(`${yourActivePokemon.value?.name} setzt ${formatMoveName(move.name)} ein!`);
    playerAttacking.value = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    const defenderTypes = opponentActivePokemon.value?.type.split(' / ') || [];
    const { multiplier, message: effectivenessMessage } = calculateTypeMultiplier(move.type, defenderTypes);
    const attackStat = yourActivePokemon.value?.stats?.attack || 50;
    const attackMod = yourStatMods.value.attack;
    const modifiedAttack = attackStat * (1 + attackMod * 0.25);

    let damage = 0;
    if (move.power) {
      damage = Math.floor((move.power / 10 + 2) * (modifiedAttack / 50) * multiplier * (Math.random() * 0.15 + 0.85));
    }
  
    opponentHealth.value[0] = Math.max(0, opponentHealth.value[0] - damage);
    damageAmount.value = damage;
    damageTarget.value = 'opponent';
    if (damage > 0) showDamageText.value = true;
    screenShake.value = true;
    await new Promise(resolve => setTimeout(resolve, 300));
    screenShake.value = false;
    showDamageText.value = false;
    playerAttacking.value = false;
  
    if (effectivenessMessage) await displayMessage(effectivenessMessage);

    if (opponentHealth.value[0] <= 0) {
      await displayMessage(`Wildes ${opponentActivePokemon.value?.name} wurde besiegt!`);
      if (props.opponentTeam.length > 1) {
        props.opponentTeam.shift();
        opponentHealth.value.shift();
        opponentHealth.value.unshift(props.opponentTeam[0].stats?.hp || 100);
        activeMenu.value = 'main';
      } else {
        await displayMessage(`Du hast gewonnen!`);
        emit('close-battle');
      }
      return;
    }
    
    setTimeout(opponentTurn, 500);
  }
}

async function opponentTurn() {
  const enemyMove = opponentCurrentMoves.value[Math.floor(Math.random() * opponentCurrentMoves.value.length)];
  if (!enemyMove) {
    activeMenu.value = 'main';
    return;
  }

  activeMenu.value = 'message';
  
  if (enemyMove.accuracy && Math.random() * 100 > enemyMove.accuracy) {
    await displayMessage(`Wildes ${opponentActivePokemon.value?.name} setzt ${formatMoveName(enemyMove.name)} ein!`);
    await displayMessage(`...aber der Angriff verfehlte!`);
    activeMenu.value = 'main';
    return;
  }
  
  if (enemyMove.damageClass === 'status') {
    await handleStatusMove(enemyMove, 'opponent');
  } else {
    await displayMessage(`Wildes ${opponentActivePokemon.value?.name} setzt ${formatMoveName(enemyMove.name)} ein!`);
    opponentAttacking.value = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    const defenderTypes = yourActivePokemon.value?.type.split(' / ') || [];
    const { multiplier, message: effectivenessMessage } = calculateTypeMultiplier(enemyMove.type, defenderTypes);
    const attackStat = opponentActivePokemon.value?.stats?.attack || 50;
    const attackMod = opponentStatMods.value.attack;
    const modifiedAttack = attackStat * (1 + attackMod * 0.25);

    let enemyDamage = 0;
    if (enemyMove.power) {
      enemyDamage = Math.floor((enemyMove.power / 10 + 2) * (modifiedAttack / 50) * multiplier * (Math.random() * 0.15 + 0.85));
    }
  
    currentHealth.value[0] = Math.max(0, currentHealth.value[0] - enemyDamage);
    damageAmount.value = enemyDamage;
    damageTarget.value = 'player';
    if (enemyDamage > 0) showDamageText.value = true;
    screenShake.value = true;
    await new Promise(resolve => setTimeout(resolve, 300));
    screenShake.value = false;
    showDamageText.value = false;

    if (effectivenessMessage) await displayMessage(effectivenessMessage);
  }
  
  opponentAttacking.value = false;

  if (currentHealth.value[0] <= 0) {
    showFaintMessage.value = true;
    await new Promise(resolve => setTimeout(resolve, 2000));
    showFaintMessage.value = false;

    const hasViablePokemon = props.yourTeam.some((p, index) => index > 0 && currentHealth.value[index] > 0);
    if (hasViablePokemon) {
      isSwitchForced.value = true;
      activeMenu.value = 'pokemon';
    } else {
      await displayMessage('Alle deine Pokémon sind kampfunfähig!');
      emit('close-battle');
    }
    return;
  }
  
  activeMenu.value = 'main';
}
</script>

<template>
  <div class="battle-screen" :class="{ 'shake-animation': screenShake }">
    <div class="battle-start-animation" :class="{ 'fade-out': !battleAnimation }">
      <div class="animation-content">
        <h1>Ein wildes {{ opponentTeam[0]?.name }} erscheint!</h1>
      </div>
    </div>

    <div class="battle-background" :class="{ 'fade-in': uiReady }">
      <div class="opponent-container">
        <div class="health-bar-container opponent-hp">
          <div class="pokemon-name">{{ opponentActivePokemon?.name }}</div>
          <div class="health-bar">
            <div class="health-bar-fill" :style="{ width: opponentHPPercentage + '%' }"></div>
          </div>
          <div class="health-text">
            {{ opponentHealth[0] || 0 }}/{{ opponentActivePokemon?.stats?.hp || 100 }}
          </div>
        </div>
        <img :src="getFrontSprite" class="enemy-sprite" :class="{ 'attack-opponent-animation': opponentAttacking, 'glow-enter': opponentEntering, 'status-glow-animation': opponentStatusAnimating }" :alt="opponentActivePokemon?.name">
      </div>
      <div class="player-container">
        <div class="health-bar-container player-hp">
          <div class="pokemon-name">{{ yourActivePokemon?.name }}</div>
          <div class="health-bar">
            <div class="health-bar-fill" :style="{ width: yourHPPercentage + '%' }"></div>
          </div>
          <div class="health-text">
            {{ currentHealth[0] || 0 }}/{{ yourActivePokemon?.stats?.hp || 100 }}
          </div>
        </div>
        <img :src="getBackSprite" class="player-sprite" :class="{ 'attack-player-animation': playerAttacking, 'glow-enter': playerEntering, 'status-glow-animation': playerStatusAnimating }" :alt="yourActivePokemon?.name">
      </div>

      <transition name="fade">
        <div v-if="showDamageText" :class="['damage-text', damageTarget === 'player' ? 'damage-player' : 'damage-opponent']">
          -{{ damageAmount }}
        </div>
      </transition>
      <transition name="fade">
        <div v-if="showFaintMessage" class="faint-message-box">
          {{ yourActivePokemon?.name }} ist kampfunfähig!
        </div>
      </transition>

      <div class="battle-menu" v-if="!showFaintMessage">
        <div v-if="activeMenu === 'message'" class="message-box">
          <p v-html="battleMessage.replace(/\n/g, '<br>')"></p>
        </div>
      
        <div v-if="activeMenu === 'main'" class="menu-options">
          <button @click="handleAttack">KAMPF</button>
          <button @click="activeMenu = 'pokemon'">PKMN</button>
          <button @click="activeMenu = 'item'">ITEM</button>
          <button @click="handleFlee">FLUCHT</button>
        </div>

        <div v-if="activeMenu === 'attack'" class="attack-menu">
          <h3>Wähle eine Attacke:</h3>
          <div class="attack-list">
            <button v-for="(move, index) in yourCurrentMoves" :key="index" @click="executeMove(move)" class="attack-option" :class="move.type">
              <div class="attack-header">
                <span class="attack-name">{{ formatMoveName(move.name) }}</span>
                <span class="attack-category-tag" :class="move.damageClass">
                  {{ damageClassTranslations[move.damageClass] || 'Unbekannt' }}
                </span>
              </div>
              <span class="attack-details">
                Stärke: {{ move.power || '-' }} | Gen.: {{ move.accuracy || '-' }}
              </span>
            </button>
          </div>
          <button @click="activeMenu = 'main'" class="back-btn">← Zurück</button>
        </div>

        <div v-if="activeMenu === 'pokemon'" class="pokemon-switch-menu">
          <h3>Wähle ein Pokémon:</h3>
          <div class="pokemon-list">
            <div v-for="(pokemon, index) in props.yourTeam" :key="pokemon.name + index" class="pokemon-option" @click="handleSwitchPokemon(index)" :class="{ fainted: currentHealth[index] <= 0 || index === 0 }">
              <img :src="pokemon.image" class="switch-sprite" :alt="pokemon.name">
              <div class="pokemon-info">
                <span>{{ pokemon.name }}</span>
                <div class="small-health-bar">
                  <div class="health-bar-fill" :style="{ width: ((currentHealth[index] / (pokemon.stats?.hp || 1)) * 100) + '%' }"></div>
                </div>
                <span class="small-health-text">{{ currentHealth[index] || 0 }}/{{ pokemon.stats?.hp || 100 }}</span>
              </div>
            </div>
          </div>
          <button v-if="!isSwitchForced" @click="activeMenu = 'main'" class="back-btn">← Zurück</button>
        </div>
        
        <div v-if="activeMenu === 'item'" class="item-menu">
          <h3>Wähle ein Item:</h3>
          <div class="item-list">
            <div v-for="item in inventory" 
                 :key="item.name" 
                 class="item-option"
                 :class="{ disabled: item.count === 0 }"
                 @click="item.count > 0 ? useItem(item) : null">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-count">x{{ item.count }}</span>
              <span class="item-description">{{ item.description }}</span>
            </div>
          </div>
          <button @click="activeMenu = 'main'" class="back-btn">← Zurück</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.battle-screen {
  width: 98vw;
  height: calc(98vw * 3 / 4);
  max-width: 1400px;
  max-height: 880px;
  margin: -10vh auto 0 auto;
  background-color: #fff;
  border: 8px solid #383838;
  border-radius: 16px;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.battle-background {
  width: 100%;
  height: 100%;
  background-image: url('@/assets/battle-bg.jpg');
  background-size: contain;
  background-position: center top;
  background-repeat: no-repeat;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s 1.5s ease-in;
}
.battle-background.fade-in {
  opacity: 1;
}
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
  border-radius: 16px;
  opacity: 1;
  transition: opacity 0.5s ease-out;
}
.battle-start-animation.fade-out {
  opacity: 0;
  pointer-events: none;
}
.animation-content {
  text-align: center;
  color: white;
  font-family: 'Pokemon GB', sans-serif;
  font-size: 2.5rem;
  text-transform: uppercase;
}
.enemy-sprite {
  position: absolute;
  width: 28%; 
  height: auto;
  top: 11%; 
  right: 12%; 
  image-rendering: pixelated;
  z-index: 10;
  transform: scale(1);
}
.player-sprite {
  position: absolute;
  width: 50%;
  height: auto;
  bottom: 20px;
  left: -5%;
  image-rendering: pixelated;
  transform: scaleX(1);
  z-index: 10;
}
.health-bar-container {
  position: absolute;
  width: 250px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  padding: 6px 10px;
  z-index: 30;
  font-family: 'Pokemon GB', monospace;
}
.opponent-hp { top: 30px; left: 30px; }
.player-hp { bottom: 260px; right: 30px; }
.pokemon-name { color: #fff; font-weight: bold; font-size: 1.1rem; margin-bottom: 5px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7); }
.health-bar { width: 100%; height: 10px; background: #444; border-radius: 5px; overflow: hidden; }
.health-bar-fill { height: 100%; background: #4CAF50; transition: width 0.3s ease-out; }
.health-text { color: #fff; font-size: 0.8rem; text-align: right; margin-top: 3px; }
.battle-menu {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 240px;
  background-color: #f8f8f8;
  border-top: 6px solid #383838;
  border-radius: 0 0 2px 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  padding: 15px;
  box-sizing: border-box;
}
.menu-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  width: 90%;
  height: 100%;
}
.menu-options button {
  padding: 10px 15px;
  background-color: #e0e0e0;
  border: 4px solid #383838;
  border-radius: 0;
  font-family: 'Pokemon GB', monospace;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
  text-transform: uppercase;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}
.menu-options button:hover { background-color: #d0d0d0; transform: translateY(-1px) translateX(-1px); box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3); }
.attack-menu, .pokemon-switch-menu, .item-menu {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
}
.attack-menu h3, .pokemon-switch-menu h3, .item-menu h3 { font-family: 'Pokemon GB', monospace; color: #383838; text-align: center; margin: 0; font-size: 1.1rem; flex-shrink: 0; }
.back-btn { padding: 10px 18px; background-color: #e0e0e0; border: 3px solid #a0a0a0; border-radius: 8px; font-family: 'Pokemon GB', monospace; font-size: 16px; cursor: pointer; transition: all 0.2s; align-self: flex-start; justify-self: start; }
.back-btn:hover { background-color: #d0d0d0; transform: translateY(-2px); }
.attack-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  overflow-y: auto;
  min-height: 0;
}
.attack-option {
  padding: 5px;
  border-radius: 5px;
  border: 2px solid rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}
.attack-option:hover { filter: brightness(1.1); }
.attack-header { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.attack-name { font-weight: bold; font-size: 1rem; color: white; text-shadow: 1px 1px 1px rgba(0,0,0,0.5); }
.attack-category-tag { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-family: 'Pokemon GB', monospace; font-weight: bold; color: white; text-shadow: 1px 1px 1px rgba(0,0,0,0.3); white-space: nowrap; flex-shrink: 0; }
.attack-category-tag.physical { background-color: #e74c3c; }
.attack-category-tag.special { background-color: #3498db; }
.attack-category-tag.status { background-color: #95a5a6; }
.attack-details { font-size: 0.8rem; color: rgba(255, 255, 255, 0.9); white-space: nowrap; margin-top: -10px; }
.pokemon-list, .item-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  overflow-y: auto;
  min-height: 0;
  padding: 10px;
}
.pokemon-option {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 5px;
  background-color: #e8e8e8;
  border-radius: 6px;
  border: 2px solid #b0b0b0;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  width: 100px;
}
.pokemon-option:hover {
  background-color: #d8d8d8;
  transform: scale(1.05);
}
.fainted { opacity: 0.6; pointer-events: none; }
.switch-sprite {
  width: 60px;
  height: 60px;
  margin-right: 0;
  image-rendering: pixelated;
}
.pokemon-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.pokemon-info span {
  font-family: 'Pokemon GB', monospace;
  color: #333;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}
.small-health-bar { width: 80px; height: 6px; background: #666; border-radius: 3px; overflow: hidden; margin: 3px 0; }
.small-health-text { font-size: 0.7rem; color: #555; text-align: center; }
.item-option { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; grid-template-areas: "name count" "desc desc"; align-items: center; padding: 10px 15px; background-color: #e8e8e8; border-radius: 6px; border-left: 5px solid #4a90e2; cursor: pointer; transition: background-color 0.2s; }
.item-option:hover { background-color: #d8d8d8; }
.item-option.disabled { opacity: 0.5; pointer-events: none; border-left-color: #999; }
.item-name { grid-area: name; font-family: 'Pokemon GB', monospace; font-weight: bold; color: #333; font-size: 1rem; }
.item-count { grid-area: count; font-family: 'Pokemon GB', monospace; font-size: 1rem; color: #555; justify-self: end; }
.item-description { grid-area: desc; font-size: 0.8rem; color: #777; margin-top: 5px; font-style: italic; }
.message-box { width: 100%; height: 100%; font-family: 'Pokemon GB', monospace; font-size: 1.6rem; color: #383838; padding: 20px; box-sizing: border-box; display: flex; align-items: flex-start; justify-content: flex-start; line-height: 1.5; }
.faint-message-box { position: absolute; bottom: 0; left: 0; width: 100%; height: 240px; background-color: #f8f8f8; border-top: 6px solid #383838; font-family: 'Pokemon GB', monospace; font-size: 1.4rem; color: #383838; padding: 20px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; z-index: 30; }
.damage-text { position: absolute; font-family: 'Pokemon GB', sans-serif; font-size: 2.5rem; font-weight: bold; color: #ff0000; text-shadow: 2px 2px 0 #000; z-index: 50; animation: popUpFade 1s forwards; pointer-events: none; }
.damage-player { top: 35%; left: 25%; }
.damage-opponent { top: 30%; right: 25%; }
.shake-animation { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-2px, 0, 0); } 20%, 80% { transform: translate3d(4px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-8px, 0, 0); } 40%, 60% { transform: translate3d(8px, 0, 0); } }
.player-sprite.attack-player-animation { animation: playerAttack 0.5s ease-out; }
@keyframes playerAttack { 0% { transform: translate(0, 0) scaleX(1); } 50% { transform: translate(50px, -50px) scaleX(1); } 100% { transform: translate(0, 0) scaleX(1); } }
.enemy-sprite.attack-opponent-animation { animation: opponentAttack 0.5s ease-out; }
@keyframes opponentAttack { 0% { transform: translate(0, 0); } 50% { transform: translate(-50px, 50px); } 100% { transform: translate(0, 0); } }
@keyframes popUpFade { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-40px); } }
.enemy-sprite.glow-enter, .player-sprite.glow-enter { animation: glow-enter 0.7s forwards; }
@keyframes glow-enter { 0% { opacity: 0; filter: brightness(0) drop-shadow(0 0 0 white); transform: scale(0.2); } 50% { opacity: 1; filter: brightness(2.5) drop-shadow(0 0 15px white); transform: scale(1.08); } 100% { opacity: 1; filter: brightness(1) drop-shadow(0 0 0 white); transform: scale(1); } }
.status-glow-animation { animation: status-glow 0.8s ease-in-out; }
@keyframes status-glow { 0% { filter: brightness(1); } 50% { filter: brightness(2.5) drop-shadow(0 0 10px #a29bfe); } 100% { filter: brightness(1); } }
.battle-start-animation { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #000; display: flex; justify-content: center; align-items: center; z-index: 10001; animation: fadeIn 0.5s ease-in; border-radius: 16px; }
.animation-content { text-align: center; color: white; font-family: 'Pokemon GB', sans-serif; font-size: 2.5rem; text-transform: uppercase; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.normal { background-color: #A8A878; color: white; }
.fire { background-color: #F08030; color: white; }
.water { background-color: #6890F0; color: white; }
.electric { background-color: #F8D030; color: black; }
.grass { background-color: #78C850; color: white; }
.ice { background-color: #98D8D8; color: black; }
.fighting { background-color: #C03028; color: white; }
.poison { background-color: #A040A0; color: white; }
.ground { background-color: #E0C068; color: black; }
.flying { background-color: #A890F0; color: white; }
.psychic { background-color: #F85888; color: white; }
.bug { background-color: #A8B820; color: white; }
.rock { background-color: #B8A038; color: white; }
.ghost { background-color: #705898; color: white; }
.dragon { background-color: #7038F8; color: white; }
.dark { background-color: #705848; color: white; }
.steel { background-color: #B8B8D0; color: black; }
.fairy { background-color: #EE99AC; color: black; }
</style>