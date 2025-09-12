<script setup lang="ts">
import { usePokemonStore } from '../store/pokemonStore';
import type { Pokemon, Move } from '../types/index.ts';
import { ref, watchEffect } from 'vue';

const props = defineProps<{
  pokemon: Pokemon;
  show: boolean;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const store = usePokemonStore();
const tab = ref('about');

watchEffect(() => {
  if (props.pokemon && !props.pokemon.moves && props.pokemon.moveUrls) {
    store.loadMoveDetails(props.pokemon);
  }
});

const getEffectiveness = (move: Move): string => {
  if (move.damageClass === "status") return "⚡ Status";
  const basePower = move.power || 0;
  let effectiveness = "";
  if (basePower >= 90) effectiveness = "💥 Stark";
  else if (basePower >= 50) effectiveness = "🔵 Mittel";
  else if (basePower > 0) effectiveness = "🔶 Schwach";
  return `${effectiveness} (${basePower})`;
};
</script>

<template>
  <v-dialog :model-value="props.show" @update:model-value="emit('close')" max-width="500px">
    <v-card color="secondary">
      <v-card-title class="headline">
        <span>{{ props.pokemon.name }}</span>
        <span class="font-weight-light">#{{ props.pokemon.id.toString().padStart(3, '0') }}</span>
      </v-card-title>
      <v-divider></v-divider>

      <div class="preview-container">
        <v-img :src="props.pokemon.image" height="150" contain></v-img>
      </div>

      <v-card-text class="text-center py-2">
        <v-chip v-for="t in props.pokemon.type.split(' / ')" :key="t" class="ma-1" label>{{ t }}</v-chip>
      </v-card-text>

      <v-tabs v-model="tab" grow bg-color="primary">
        <v-tab value="about">Über</v-tab>
        <v-tab value="stats">Statuswerte</v-tab>
        <v-tab value="moves">Attacken</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="about" class="pa-4 text-content">
          <p class="mb-4">{{ props.pokemon.flavorText }}</p>
          <strong>Größe:</strong> {{ props.pokemon.height / 10 }} m<br>
          <strong>Gewicht:</strong> {{ props.pokemon.weight / 10 }} kg<br>
          <div class="mt-2">
            <strong class="d-block">Fähigkeiten:</strong>
            <v-chip
              v-for="ability in props.pokemon.abilities"
              :key="ability"
              class="ma-1"
              label
              size="small"
            >
              {{ ability }}
            </v-chip>
          </div>
        </v-window-item>

        <v-window-item value="stats" class="pa-4 text-content">
          HP: {{ props.pokemon.stats?.hp }}<br>
          Angriff: {{ props.pokemon.stats?.attack }}<br>
          Verteidigung: {{ props.pokemon.stats?.defense }}<br>
          Geschwindigkeit: {{ props.pokemon.stats?.speed }}
        </v-window-item>

        <v-window-item value="moves" class="pa-4 moves-section">
          <div v-if="!pokemon.moves || pokemon.moves.length === 0" class="text-center">Lade Attacken...</div>
          <div v-else class="moves-list-battlefield-style"> <div
              v-for="(move, index) in pokemon.moves"
              :key="index"
              class="move-battlefield-style" :class="move.type.toLowerCase()"
            >
              <div class="move-row-battlefield-style">
                <div class="move-name-power-battlefield-style">
                  <span class="move-name-battlefield-style">{{ move.name }}</span>
                  <span class="move-detail-battlefield-style">Stärke: {{ move.power || "-" }}</span>
                </div>
                <div class="move-acc-type-battlefield-style">
                  <span class="move-detail-battlefield-style">Gen.: {{ move.accuracy || "-" }}</span>
                  <span class="move-type-tag-battlefield-style">{{ move.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-window-item>
      </v-window>

      <v-card-actions class="actions mobile-actions-layout"> <v-btn
          v-if="store.yourTeam.length < 3"
          class="action-btn add-team-btn" @click="store.addToTeam(pokemon)"
          size="small" >
          Ins Team
        </v-btn>
        <v-btn
          v-if="store.opponentTeam.length < 3"
          class="action-btn add-opponent-btn" @click="store.addToOpponentTeam(pokemon)"
          size="small" >
          Ins Gegnerteam
        </v-btn>
        <v-spacer class="mobile-spacer"></v-spacer> <v-btn class="action-btn close-btn" text @click="emit('close')" size="small">Schließen</v-btn> </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.edit-content { background-color: #e4c932; border: 4px solid #2070cc; border-radius: 10px !important; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); }
.headline { font-family: 'Pokemon GB', sans-serif; color: #2070cc; display: flex; justify-content: space-between; }
.preview-container { padding: 1rem; background-color: rgba(0,0,0,0.1); }
.text-content { color: #333; }
.actions { padding: 16px; background-color: rgba(0,0,0,0.1); }
.normal { --type-color: #a8a878; } .fire { --type-color: #f08030; } .water { --type-color: #6890f0; } .electric { --type-color: #f8d030; } .grass { --type-color: #78c850; } .ice { --type-color: #98d8d8; } .fighting { --type-color: #c03028; } .poison { --type-color: #a040a0; } .ground { --type-color: #e0c068; } .flying { --type-color: #a890f0; } .psychic { --type-color: #f85888; } .bug { --type-color: #a8b820; } .rock { --type-color: #b8a038; } .ghost { --type-color: #705898; } .dragon { --type-color: #7038f8; } .dark { --type-color: #705848; } .steel { --type-color: #b8b8d0; } .fairy { --type-color: #ee99ac; }

.moves-section {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  overflow-y: auto; 
  max-height: 250px; 
  padding: 5px; 
}

.moves-list-battlefield-style {
  display: flex; 
  flex-direction: column;
  gap: 8px;
  padding-right: 5px; 
}

.move-battlefield-style {
  background-color: rgba(60, 60, 60, 0.8); 
  padding: 10px;
  border-radius: 8px;
  border-left: 5px solid var(--type-color, #a8a878); 
  color: white;
  display: flex;
  align-items: center;
}

.move-row-battlefield-style {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.move-name-power-battlefield-style,
.move-acc-type-battlefield-style {
  display: flex;
  flex-direction: column;
}

.move-name-power-battlefield-style {
  align-items: flex-start;
}

.move-acc-type-battlefield-style {
  align-items: flex-end;
}

.move-name-battlefield-style {
  color: white;
  font-weight: bold;
  font-size: 1rem;
  text-transform: capitalize;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

.move-detail-battlefield-style {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.move-type-tag-battlefield-style {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: white;
  margin-top: 4px;
  background-color: var(--type-color, #a8a878);
  font-weight: bold;
}

.mobile-actions-layout {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 8px;
  padding: 10px;
}

.action-btn {
  flex-grow: 1;
  min-width: 80px;
  font-size: 0.8rem;
  padding: 6px 10px !important;
  height: 32px !important;
  border-radius: 6px;
  text-transform: uppercase;
}

.add-team-btn { background-color: #4caf50; color: white; font-weight: bold; }
.add-opponent-btn { background-color: #ffad16; color: white; font-weight: bold; }
.close-btn { background-color: #2070cc; color: #ffffff; font-weight: bold; }

.mobile-spacer {
  flex-grow: 0;
  width: 0;
}


@media (max-width: 600px) { 

  .moves-list-battlefield-style {
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 8px; 
    padding-right: 0; 
  }

 
  .move-battlefield-style {
    padding: 8px;
    min-height: 60px; 
  }

  .move-name-battlefield-style {
    font-size: 0.9rem; 
  }

  .move-detail-battlefield-style,
  .move-type-tag-battlefield-style {
    font-size: 0.7rem; 
  }

  .move-type-tag-battlefield-style {
    padding: 1px 6px; 
  }

  
  .action-btn {
    min-width: unset;
    width: 100%;
  }

  .mobile-actions-layout {
    flex-direction: column; 
  }

  .mobile-spacer {
    display: none; 
  }
}


@media (max-width: 400px) {
  .action-btn {
    min-width: unset;
    width: 100%;
  }
}
</style>