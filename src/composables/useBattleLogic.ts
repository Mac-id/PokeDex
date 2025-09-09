import { ref, computed, watch } from "vue";
import type { Pokemon, Move } from "../types";
import { typeChart } from "../data/constants"; // Statische Daten importieren
import { usePokemonStore } from "../store/pokemonStore";

// Dieses Composable enthält die gesamte Logik für eine einzelne Schlacht.
export function useBattleLogic() {
  const store = usePokemonStore();

  // Lokaler Zustand der Schlacht
  const activeMenu = ref<"main" | "attack" | "pokemon" | "item" | "message">(
    "main"
  );
  const isSwitchForced = ref(false);
  const battleMessage = ref("");
  const inventory = ref([
    { name: "Trank", description: "Heilt 20 KP.", healing: 20, count: 2 },
    { name: "Supertrank", description: "Heilt 50 KP.", healing: 50, count: 1 },

  ]);
  const currentHealth = ref<number[]>([]);
  const opponentHealth = ref<number[]>([]);
  const yourStatMods = ref({ attack: 0, defense: 0 });
  const opponentStatMods = ref({ attack: 0, defense: 0 });

  // Animation states
  const playerAttacking = ref(false);
  const opponentAttacking = ref(false);
  const playerEntering = ref(false);
  const opponentEntering = ref(false);
  const playerStatusAnimating = ref(false);
  const opponentStatusAnimating = ref(false);
  const screenShake = ref(false);
  const showDamageText = ref(false);
  const damageAmount = ref(0);
  const damageTarget = ref("");
  const showFaintMessage = ref(false);

  // Computed Properties leiten Zustand ab
  const yourActivePokemon = computed(() => store.yourTeam?.[0]);
  const opponentActivePokemon = computed(() => store.opponentTeam?.[0]);
  const yourHPPercentage = computed(
    () =>
      (currentHealth.value[0] / (yourActivePokemon.value?.stats?.hp || 1)) * 100
  );
  const opponentHPPercentage = computed(
    () =>
      (opponentHealth.value[0] /
        (opponentActivePokemon.value?.stats?.hp || 1)) *
      100
  );
  const yourCurrentMoves = computed(() => yourActivePokemon.value?.moves || []);
  const opponentCurrentMoves = computed(
    () => opponentActivePokemon.value?.moves || []
  );

  // Watchers, um auf Team-Änderungen zu reagieren
  watch(
    () => store.yourTeam[0],
    (newPokemon, oldPokemon) => {
      if (
        newPokemon &&
        newPokemon !== oldPokemon &&
        (!newPokemon.moves || newPokemon.moves.length === 0)
      ) {
        store.loadMoveDetails(newPokemon);
      }
      if (newPokemon && oldPokemon) {
        playerEntering.value = true;
        setTimeout(() => {
          playerEntering.value = false;
        }, 700);
      }
    },
    { immediate: true }
  );

  watch(
    () => store.opponentTeam[0],
    (newPokemon, oldPokemon) => {
      if (
        newPokemon &&
        newPokemon !== oldPokemon &&
        (!newPokemon.moves || newPokemon.moves.length === 0)
      ) {
        store.loadMoveDetails(newPokemon);
      }
      if (newPokemon && newPokemon !== oldPokemon) {
        opponentEntering.value = true;
        setTimeout(() => {
          opponentEntering.value = false;
        }, 700);
      }
    },
    { immediate: true }
  );

  // Battle Logic Methoden
  async function displayMessage(message: string, duration: number = 1500) {
    activeMenu.value = "message";
    battleMessage.value = message;
    await new Promise((resolve) => setTimeout(resolve, duration));
    battleMessage.value = "";
  }
  function calculateTypeMultiplier(
    moveType: string,
    defenderTypes: string[]
  ): { multiplier: number; message: string } {
    let totalMultiplier = 1;
    let effectivenessMessage = "";
    for (const defenderType of defenderTypes) {
      const moveTypeLower = moveType.toLowerCase();
      const defenderTypeLower = defenderType.toLowerCase();
      if (typeChart[moveTypeLower]?.strong_against.includes(defenderTypeLower))
        totalMultiplier *= 2;
      if (typeChart[moveTypeLower]?.weak_against.includes(defenderTypeLower))
        totalMultiplier *= 0.5;
      if (typeChart[moveTypeLower]?.immune.includes(defenderTypeLower))
        totalMultiplier *= 0;
    }
    if (totalMultiplier > 1)
      effectivenessMessage = "Die Attacke ist sehr effektiv!";
    if (totalMultiplier > 0 && totalMultiplier < 1)
      effectivenessMessage = "Die Attacke ist nicht sehr effektiv...";
    if (totalMultiplier === 0)
      effectivenessMessage = "Die Attacke hat keine Wirkung!";
    return { multiplier: totalMultiplier, message: effectivenessMessage };
  }
  async function handleStatusMove(move: Move, user: "player" | "opponent") {
    const userName =
      user === "player"
        ? yourActivePokemon.value?.name
        : opponentActivePokemon.value?.name;
    await displayMessage(`${userName} setzt ${move.name} ein!`, 1000);
    if (user === "player") playerStatusAnimating.value = true;
    else opponentStatusAnimating.value = true;
    await new Promise((resolve) => setTimeout(resolve, 800));
    playerStatusAnimating.value = false;
    opponentStatusAnimating.value = false;
    let effectMessage = "";
    switch (move.name) {
      case "swords-dance":
      case "schwerttanz":
        if (user === "player")
          yourStatMods.value.attack = Math.min(
            6,
            yourStatMods.value.attack + 2
          );
        else
          opponentStatMods.value.attack = Math.min(
            6,
            opponentStatMods.value.attack + 2
          );
        effectMessage = `Der Angriff von ${userName} wurde stark erhöht!`;
        break;
      default:
        effectMessage = `...aber es passierte nichts!`;
        break;
    }
    await displayMessage(effectMessage);
  }
  async function loadAllPokemonMoves() {
    await Promise.all(
      [...store.yourTeam, ...store.opponentTeam].map((p) =>
        store.loadMoveDetails(p)
      )
    );
  }
  function handleAttack() {
    if (currentHealth.value[0] <= 0) {
      isSwitchForced.value = true;
      activeMenu.value = "pokemon";
      return;
    }
    activeMenu.value = "attack";
  }
  function handleFlee() {
    if (isSwitchForced.value) return;
    if (confirm("Möchtest du wirklich fliehen?")) store.handleCloseBattle();
  }
  async function useItem(itemToUse: {
    name: string;
    healing: number;
    count: number;
  }) {
    const inventoryItem = inventory.value.find(
      (i) => i.name === itemToUse.name
    );
    if (!inventoryItem || inventoryItem.count <= 0) return;
    const activePokemon = yourActivePokemon.value;
    const maxHP = activePokemon?.stats?.hp;
    if (!activePokemon || !maxHP || currentHealth.value[0] >= maxHP) {
      await displayMessage(`${activePokemon?.name} hat bereits volle KP!`);
      activeMenu.value = "item";
      return;
    }
    const oldHealth = currentHealth.value[0];
    const newHealth = Math.min(maxHP, oldHealth + inventoryItem.healing);
    currentHealth.value[0] = newHealth;
    inventoryItem.count--;
    await displayMessage(
      `${activePokemon.name} wurde um ${newHealth - oldHealth} KP geheilt!`
    );
    setTimeout(opponentTurn, 500);
  }
  async function handleSwitchPokemon(index: number) {
    if (index === 0 || currentHealth.value[index] <= 0) return;
    const wasSwitchForced = isSwitchForced.value;
    isSwitchForced.value = false;
    const healthToMove = currentHealth.value.splice(index, 1)[0];
    currentHealth.value.unshift(healthToMove);
    store.handleSwitchPokemon(index);
    if (!wasSwitchForced) {
      activeMenu.value = "message";
      await new Promise((resolve) => setTimeout(resolve, 1000));
      opponentTurn();
    } else {
      activeMenu.value = "main";
    }
  }
  async function executeMove(move: Move) {
    if (currentHealth.value[0] <= 0) return;
    activeMenu.value = "message";
    if (move.accuracy && Math.random() * 100 > move.accuracy) {
      await displayMessage(
        `${yourActivePokemon.value?.name} setzt ${move.name} ein!`
      );
      await displayMessage(`...aber der Angriff verfehlte!`);
      setTimeout(opponentTurn, 500);
      return;
    }
    if (move.damageClass === "status") {
      await handleStatusMove(move, "player");
      setTimeout(opponentTurn, 500);
    } else {
      await displayMessage(
        `${yourActivePokemon.value?.name} setzt ${move.name} ein!`
      );
      playerAttacking.value = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      const defenderTypes =
        opponentActivePokemon.value?.type.split(" / ") || [];
      const { multiplier, message: effectivenessMessage } =
        calculateTypeMultiplier(move.type, defenderTypes);
      const attackStat = yourActivePokemon.value?.stats?.attack || 50;
      const attackMod = yourStatMods.value.attack;
      const modifiedAttack = attackStat * (1 + attackMod * 0.25);
      let damage = 0;
      if (move.power) {
        damage = Math.floor(
          (move.power / 10 + 2) *
            (modifiedAttack / 50) *
            multiplier *
            (Math.random() * 0.15 + 0.85)
        );
      }
      opponentHealth.value[0] = Math.max(0, opponentHealth.value[0] - damage);
      damageAmount.value = damage;
      damageTarget.value = "opponent";
      if (damage > 0) showDamageText.value = true;
      screenShake.value = true;
      await new Promise((resolve) => setTimeout(resolve, 300));
      screenShake.value = false;
      showDamageText.value = false;
      playerAttacking.value = false;
      if (effectivenessMessage) await displayMessage(effectivenessMessage);
      if (opponentHealth.value[0] <= 0) {
        await displayMessage(
          `Wildes ${opponentActivePokemon.value?.name} wurde besiegt!`
        );
        if (store.opponentTeam.length > 1) {
          store.opponentTeam.shift();
          opponentHealth.value.shift();
          opponentHealth.value.unshift(store.opponentTeam[0].stats?.hp || 100);
          activeMenu.value = "main";
        } else {
          await displayMessage(`Du hast gewonnen!`);
          store.handleCloseBattle();
        }
        return;
      }
      setTimeout(opponentTurn, 500);
    }
  }
  async function opponentTurn() {
    const enemyMove =
      opponentCurrentMoves.value[
        Math.floor(Math.random() * opponentCurrentMoves.value.length)
      ];
    if (!enemyMove) {
      activeMenu.value = "main";
      return;
    }
    activeMenu.value = "message";
    if (enemyMove.accuracy && Math.random() * 100 > enemyMove.accuracy) {
      await displayMessage(
        `Wildes ${opponentActivePokemon.value?.name} setzt ${enemyMove.name} ein!`
      );
      await displayMessage(`...aber der Angriff verfehlte!`);
      activeMenu.value = "main";
      return;
    }
    if (enemyMove.damageClass === "status") {
      await handleStatusMove(enemyMove, "opponent");
    } else {
      await displayMessage(
        `Wildes ${opponentActivePokemon.value?.name} setzt ${enemyMove.name} ein!`
      );
      opponentAttacking.value = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      const defenderTypes = yourActivePokemon.value?.type.split(" / ") || [];
      const { multiplier, message: effectivenessMessage } =
        calculateTypeMultiplier(enemyMove.type, defenderTypes);
      const attackStat = opponentActivePokemon.value?.stats?.attack || 50;
      const attackMod = opponentStatMods.value.attack;
      const modifiedAttack = attackStat * (1 + attackMod * 0.25);
      let enemyDamage = 0;
      if (enemyMove.power) {
        enemyDamage = Math.floor(
          (enemyMove.power / 10 + 2) *
            (modifiedAttack / 50) *
            multiplier *
            (Math.random() * 0.15 + 0.85)
        );
      }
      currentHealth.value[0] = Math.max(
        0,
        currentHealth.value[0] - enemyDamage
      );
      damageAmount.value = enemyDamage;
      damageTarget.value = "player";
      if (enemyDamage > 0) showDamageText.value = true;
      screenShake.value = true;
      await new Promise((resolve) => setTimeout(resolve, 300));
      screenShake.value = false;
      showDamageText.value = false;
      if (effectivenessMessage) await displayMessage(effectivenessMessage);
    }
    opponentAttacking.value = false;
    if (currentHealth.value[0] <= 0) {
      showFaintMessage.value = true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showFaintMessage.value = false;
      const hasViablePokemon = store.yourTeam.some(
        (p, index) => index > 0 && currentHealth.value[index] > 0
      );
      if (hasViablePokemon) {
        isSwitchForced.value = true;
        activeMenu.value = "pokemon";
      } else {
        await displayMessage("Alle deine Pokémon sind kampfunfähig!");
        store.handleCloseBattle();
      }
      return;
    }
    activeMenu.value = "main";
  }

  // Initialisierungsfunktion für die Schlacht
  async function initializeBattle() {
    currentHealth.value = store.yourTeam.map((p) => p.stats?.hp || 100);
    opponentHealth.value = store.opponentTeam.map((p) => p.stats?.hp || 100);
    await loadAllPokemonMoves();
  }

  return {
    // Zustand
    activeMenu,
    isSwitchForced,
    battleMessage,
    inventory,
    currentHealth,
    opponentHealth,
    playerAttacking,
    opponentAttacking,
    playerEntering,
    opponentEntering,
    playerStatusAnimating,
    opponentStatusAnimating,
    screenShake,
    showDamageText,
    damageAmount,
    damageTarget,
    showFaintMessage,
    // Computed
    yourActivePokemon,
    opponentActivePokemon,
    yourHPPercentage,
    opponentHPPercentage,
    yourCurrentMoves,
    opponentCurrentMoves,
    // Methoden
    initializeBattle,
    handleAttack,
    handleFlee,
    useItem,
    handleSwitchPokemon,
    executeMove,
  };
}
