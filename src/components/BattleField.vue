<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { usePokemonStore } from '../store/pokemonStore';
import { useBattleLogic } from '../composables/useBattleLogic';
import { damageClassTranslations } from '../data/constants';
import { formatMoveName } from '../utils/formatting';

const store = usePokemonStore();
const {
  activeMenu, isSwitchForced, battleMessage, inventory, currentHealth, opponentHealth, 
  playerAttacking, opponentAttacking, playerEntering, opponentEntering, playerStatusAnimating, 
  opponentStatusAnimating, screenShake, showDamageText, damageAmount, damageTarget, showFaintMessage,
  yourActivePokemon, opponentActivePokemon, yourHPPercentage, opponentHPPercentage, yourCurrentMoves,
  initializeBattle, handleAttack, handleFlee, useItem, handleSwitchPokemon, executeMove
} = useBattleLogic();
const battleAnimation = ref(true);
const uiReady = ref(false);
const getFrontSprite = computed(() => opponentActivePokemon.value?.image || "");
const getBackSprite = computed(() => yourActivePokemon.value?.image ? yourActivePokemon.value.image.replace("/sprites/pokemon/", "/sprites/pokemon/back/") : "");
onMounted(() => {
  initializeBattle();
  setTimeout(() => { uiReady.value = true; }, 500);
  setTimeout(() => { battleAnimation.value = false; }, 2000);
});
</script>

<template>
  <div class="battle-screen-wrapper">
    <div class="battle-screen" :class="{ 'shake-animation': screenShake }">
      <div class="battle-start-animation" :class="{ 'fade-out': !battleAnimation }">
        <div class="animation-content">
          <h1>Ein wildes {{ store.opponentTeam[0]?.name }} erscheint!</h1>
        </div>
      </div>
      <div class="battle-background" :class="{ 'fade-in': uiReady }">
        <div class="opponent-container">
          <div class="health-bar-container opponent-hp">
            <div class="pokemon-name">{{ opponentActivePokemon?.name }}</div>
            <div class="health-bar">
              <div class="health-bar-fill" :style="{ width: opponentHPPercentage + '%' }"></div>
            </div>
            <div class="health-text">{{ opponentHealth[0] || 0 }}/{{ opponentActivePokemon?.stats?.hp || 100 }}</div>
          </div>
          <img :src="getFrontSprite" class="enemy-sprite" :class="{ 'attack-opponent-animation': opponentAttacking, 'glow-enter': opponentEntering, 'status-glow-animation': opponentStatusAnimating, }" :alt="opponentActivePokemon?.name" />
        </div>
        <div class="player-container">
          <div class="health-bar-container player-hp">
            <div class="pokemon-name">{{ yourActivePokemon?.name }}</div>
            <div class="health-bar">
              <div class="health-bar-fill" :style="{ width: yourHPPercentage + '%' }"></div>
            </div>
            <div class="health-text">{{ currentHealth[0] || 0 }}/{{ yourActivePokemon?.stats?.hp || 100 }}</div>
          </div>
          <img :src="getBackSprite" class="player-sprite" :class="{ 'attack-player-animation': playerAttacking, 'glow-enter': playerEntering, 'status-glow-animation': playerStatusAnimating, }" :alt="yourActivePokemon?.name" />
        </div>
        <transition name="fade">
          <div v-if="showDamageText" :class="['damage-text', damageTarget === 'player' ? 'damage-player' : 'damage-opponent',]">-{{ damageAmount }}</div>
        </transition>
        <transition name="fade">
          <div v-if="showFaintMessage" class="faint-message-box">{{ yourActivePokemon?.name }} ist kampfunfähig!</div>
        </transition>
        <div class="battle-menu" v-if="!showFaintMessage">
          <div v-if="activeMenu === 'message'" class="message-box"><p v-html="battleMessage.replace(/\n/g, '<br>')"></p></div>
          <div v-if="activeMenu === 'main'" class="menu-options">
            <button @click="handleAttack">KAMPF</button>
            <button @click="activeMenu = 'pokemon'">PKMN</button>
            <button @click="activeMenu = 'item'">ITEM</button>
            <button @click="handleFlee">FLUCHT</button>
          </div>
          <div v-if="activeMenu === 'attack'" class="attack-menu">
            <div class="attack-list">
              <button
                v-for="(move, index) in yourCurrentMoves"
                :key="index"
                @click="executeMove(move)"
                class="move"
                :class="move.type.toLowerCase()"
              >
                <div class="move-row">
                  <div class="move-name-power">
                    <span class="move-name">{{ formatMoveName(move.name) }}</span>
                    <span class="move-detail">Stärke: {{ move.power || "-" }}</span>
                  </div>
                  <div class="move-acc-type">
                    <span class="move-detail">Gen.: {{ move.accuracy || "-" }}</span>
                    <span class="move-type-tag">{{ move.type }}</span>
                  </div>
                </div>
              </button>
            </div>
            <button @click="activeMenu = 'main'" class="back-btn">← Zurück</button>
          </div>
          <div v-if="activeMenu === 'pokemon'" class="pokemon-switch-menu">
            <h3>Wähle ein Pokémon:</h3>
            <div class="pokemon-list">
              <div v-for="(pokemon, index) in store.yourTeam" :key="pokemon.name + index" class="pokemon-option" @click="handleSwitchPokemon(index)" :class="{ fainted: currentHealth[index] <= 0 || index === 0 }">
                <img :src="pokemon.image" class="switch-sprite" :alt="pokemon.name" />
                <div class="pokemon-info">
                  <span>{{ pokemon.name }}</span>
                  <div class="small-health-bar">
                    <div class="health-bar-fill" :style="{ width: (currentHealth[index] / (pokemon.stats?.hp || 1)) * 100 + '%', }"></div>
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
              <div v-for="item in inventory" :key="item.name" class="item-option" :class="{ disabled: item.count === 0 }" @click="item.count > 0 ? useItem(item) : null">
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
  </div>
</template>

<style scoped>
.battle-screen-wrapper { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; }
.battle-screen { width: 98vw; height: calc(98vw * 3 / 4); max-width: 1400px; max-height: 880px; background-color: #fff; border: 8px solid #383838; border-radius: 16px; box-shadow: 0 0 25px rgba(0, 0, 0, 0.7); position: relative; overflow: hidden; }
.battle-background { width: 100%; height: 100%; background-image: url("@/assets/battle-bg.jpg"); background-size: contain; background-position: center top; background-repeat: no-repeat; border-radius: 8px; position: relative; overflow: hidden; opacity: 0; transition: opacity 0.5s 1.5s ease-in; }
.battle-background.fade-in { opacity: 1; }
.battle-start-animation { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #000; display: flex; justify-content: center; align-items: center; z-index: 10001; border-radius: 16px; opacity: 1; transition: opacity 0.5s ease-out; }
.battle-start-animation.fade-out { opacity: 0; pointer-events: none; }
.animation-content { text-align: center; color: white; font-family: "Pokemon GB", sans-serif; font-size: 2.5rem; text-transform: uppercase; }
.enemy-sprite { position: absolute; width: 28%; height: auto; top: 11%; right: 12%; image-rendering: pixelated; z-index: 10; transform: scale(1); }
.player-sprite { position: absolute; width: 50%; height: auto; bottom: 20px; left: -5%; image-rendering: pixelated; transform: scaleX(1); z-index: 10; }
.health-bar-container { position: absolute; width: 250px; background: rgba(0, 0, 0, 0.7); border-radius: 6px; padding: 6px 10px; z-index: 30; font-family: "Pokemon GB", monospace; }
.opponent-hp { top: 30px; left: 30px; }
.player-hp { bottom: 260px; right: 30px; }
.pokemon-name { color: #fff; font-weight: bold; font-size: 1.1rem; margin-bottom: 5px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7); }
.health-bar { width: 100%; height: 10px; background: #444; border-radius: 5px; overflow: hidden; }
.health-bar-fill { height: 100%; background: #4caf50; transition: width 0.3s ease-out; }
.health-text { color: #fff; font-size: 0.8rem; text-align: right; margin-top: 3px; }
.battle-menu { position: absolute; bottom: 0; left: 0; width: 100%; height: 240px; background-color: #f8f8f8; border-top: 6px solid #383838; border-radius: 0 0 2px 2px; display: flex; justify-content: center; align-items: center; z-index: 20; padding: 15px; box-sizing: border-box; }
.menu-options { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10px; width: 90%; height: 100%; }
.menu-options button { padding: 10px 15px; background-color: #e0e0e0; border: 4px solid #383838; border-radius: 0; font-family: "Pokemon GB", monospace; font-size: 16px; cursor: pointer; transition: all 0.1s ease-in-out; text-transform: uppercase; box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2); }
.menu-options button:hover { background-color: #d0d0d0; transform: translateY(-1px) translateX(-1px); box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3); }
.attack-menu, .pokemon-switch-menu, .item-menu { width: 100%; height: 100%; padding: 10px; display: grid; grid-template-rows: auto 1fr auto; gap: 8px; }
.attack-menu h3, .pokemon-switch-menu h3, .item-menu h3 { font-family: "Pokemon GB", monospace; color: #383838; text-align: center; margin: 0; font-size: 1.1rem; flex-shrink: 0; }
.back-btn { padding: 10px 18px; background-color: #e0e0e0; border: 3px solid #a0a0a0; border-radius: 8px; font-family: "Pokemon GB", monospace; font-size: 16px; cursor: pointer; transition: all 0.2s; align-self: flex-start; justify-self: start; }
.back-btn:hover { background-color: #d0d0d0; transform: translateY(-2px); }
.attack-menu { display: flex; flex-direction: column; }
.attack-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; overflow: hidden; flex-grow: 1; }
.move { background-color: rgba(60, 60, 60, 0.8); padding: 10px; border-radius: 8px; border-left: 5px solid var(--type-color, #a8a878); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; }
.move:hover { transform: translateY(-2px); background-color: rgba(80, 80, 80, 0.9); filter: brightness(1.1); }
.move-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.move-name-power, .move-acc-type { display: flex; flex-direction: column; }
.move-name-power { align-items: flex-start; }
.move-acc-type { align-items: flex-end; }
.move-name { color: white; font-weight: bold; font-size: 1rem; text-transform: capitalize; text-shadow: 1px 1px 2px rgba(0,0,0,0.7); }
.move-type-tag { padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; color: white; margin-top: 4px; background-color: var(--type-color, #a8a878); }
.move-detail { font-size: 0.8rem; color: rgba(255,255,255,0.8); }
.pokemon-list, .item-list { display: flex; flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 15px; overflow-y: auto; min-height: 0; padding: 10px; }
.pokemon-option { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 5px; background-color: #e8e8e8; border-radius: 6px; border: 2px solid #b0b0b0; cursor: pointer; transition: all 0.2s; flex-shrink: 0; width: 100px; }
.pokemon-option:hover { background-color: #d8d8d8; transform: scale(1.05); }
.fainted { opacity: 0.6; pointer-events: none; }
.switch-sprite { width: 60px; height: 60px; margin-right: 0; image-rendering: pixelated; }
.pokemon-info { display: flex; flex-direction: column; align-items: center; width: 100%; }
.pokemon-info span { font-family: "Pokemon GB", monospace; color: #333; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; }
.small-health-bar { width: 80px; height: 6px; background: #666; border-radius: 3px; overflow: hidden; margin: 3px 0; }
.small-health-text { font-size: 0.7rem; color: #555; text-align: center; }
.item-option { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; grid-template-areas: "name count" "desc desc"; align-items: center; padding: 10px 15px; background-color: #e8e8e8; border-radius: 6px; border-left: 5px solid #4a90e2; cursor: pointer; transition: background-color 0.2s; }
.item-option:hover { background-color: #d8d8d8; }
.item-option.disabled { opacity: 0.5; pointer-events: none; border-left-color: #999; }
.item-name { grid-area: name; font-family: "Pokemon GB", monospace; font-weight: bold; color: #333; font-size: 1rem; }
.item-count { grid-area: count; font-family: "Pokemon GB", monospace; font-size: 1rem; color: #555; justify-self: end; }
.item-description { grid-area: desc; font-size: 0.8rem; color: #777; margin-top: 5px; font-style: italic; }
.message-box { width: 100%; height: 100%; font-family: "Pokemon GB", monospace; font-size: 1.6rem; color: #383838; padding: 20px; box-sizing: border-box; display: flex; align-items: flex-start; justify-content: flex-start; line-height: 1.5; }
.faint-message-box { position: absolute; bottom: 0; left: 0; width: 100%; height: 240px; background-color: #f8f8f8; border-top: 6px solid #383838; font-family: "Pokemon GB", monospace; font-size: 1.4rem; color: #383838; padding: 20px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; z-index: 30; }
.damage-text { position: absolute; font-family: "Pokemon GB", sans-serif; font-size: 2.5rem; font-weight: bold; color: #ff0000; text-shadow: 2px 2px 0 #000; z-index: 50; animation: popUpFade 1s forwards; pointer-events: none; }
.damage-player { top: 35%; left: 25%; } .damage-opponent { top: 30%; right: 25%; }
.shake-animation { animation: shake 0.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
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
.normal { --type-color: #a8a878; } .fire { --type-color: #f08030; } .water { --type-color: #6890f0; } .electric { --type-color: #f8d030; } .grass { --type-color: #78c850; } .ice { --type-color: #98d8d8; } .fighting { --type-color: #c03028; } .poison { --type-color: #a040a0; } .ground { --type-color: #e0c068; } .flying { --type-color: #a890f0; } .psychic { --type-color: #f85888; } .bug { --type-color: #a8b820; } .rock { --type-color: #b8a038; } .ghost { --type-color: #705898; } .dragon { --type-color: #7038f8; } .dark { --type-color: #705848; } .steel { --type-color: #b8b8d0; } .fairy { --type-color: #ee99ac; }


@media (max-width: 900px) {
  .health-bar-container {
    width: 45%; /* Relative Breite statt fester Pixel */
    padding: 4px 6px;
  }
  .pokemon-name {
    font-size: 0.8rem;
  }
  .health-text {
    font-size: 0.7rem;
  }
  .player-hp {
    bottom: 160px; /* Menü ist kleiner, also kann die Leiste tiefer */
  }

  .battle-menu {
    height: 150px; /* Menü wird deutlich kleiner */
  }

  /* Attacken werden untereinander gestapelt */
  .attack-list {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .move {
    padding: 6px;
  }
  .move-name {
    font-size: 0.9rem;
  }
}
</style>