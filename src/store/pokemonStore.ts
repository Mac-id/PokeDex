import { defineStore } from "pinia";
import type { Pokemon, Move } from "../types";

export const usePokemonStore = defineStore("pokemon", {
  // Globaler Zustand der Anwendung
  state: () => ({
    pokemonList: [] as Pokemon[],
    yourTeam: [] as Pokemon[],
    opponentTeam: [] as Pokemon[],
    showBattle: false,
  }),

  // Aktionen, um den Zustand zu verändern
  actions: {
    // --- API & DATENLADEN ---
    async loadMoveDetails(pokemon: Pokemon): Promise<void> {
      if (!pokemon.moveUrls || pokemon.moves) return;
      try {
        pokemon.moves = [];
        for (const url of pokemon.moveUrls) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          const moveRes = await fetch(url);
          const moveData = await moveRes.json();
          pokemon.moves.push({
            name: moveData.name,
            power: moveData.power || 0,
            accuracy: moveData.accuracy || 0,
            pp: moveData.pp || 0,
            type: moveData.type?.name || "normal",
            damageClass: moveData.damage_class?.name || "status",
          });
        }
        delete pokemon.moveUrls;
      } catch (e) {
        console.error("Failed to load moves", e);
        pokemon.moves =
          pokemon.moveUrls?.map((url) => ({
            name: url.split("/").slice(-2)[0],
            power: 0,
            accuracy: 0,
            pp: 0,
            type: "normal",
            damageClass: "status",
          })) || [];
      }
    },

    async loadInitialPokemon() {
      if (this.pokemonList.length > 0) return; // Nicht erneut laden
      try {
        const listResponse = await fetch(
          "https://pokeapi.co/api/v2/pokemon?limit=1025"
        );
        const listData = await listResponse.json();
        const loadPokemonDetails = async (
          pokemon: { name: string; url: string },
          delay: number
        ): Promise<Pokemon> => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          const res = await fetch(pokemon.url);
          const details = await res.json();
          const spriteList = [];
          const spriteData = details.sprites;
          for (const key in spriteData) {
            if (spriteData[key] && typeof spriteData[key] === "string") {
              spriteList.push(spriteData[key]);
            }
          }
          let flavorText = "Keine Beschreibung verfügbar.";
          try {
            const speciesRes = await fetch(details.species.url);
            const speciesData = await speciesRes.json();
            // Wir suchen nach dem ersten deutschen Lexikon-Eintrag, ansonsten nehmen wir Englisch
            const germanEntry = speciesData.flavor_text_entries.find((entry: { language: { name: string } }) => entry.language.name === 'de');
      const englishEntry = speciesData.flavor_text_entries.find((entry: { language: { name: string }, flavor_text: string }) => entry.language.name === 'en');
            if (germanEntry) {
              flavorText = germanEntry.flavor_text.replace(/\f/g, ' ');
            } else if (englishEntry) {
              flavorText = englishEntry.flavor_text.replace(/\f/g, ' ');
            }
          } catch (e) {
            console.error("Failed to load species data", e);
          }
          const sprites = spriteList.filter(Boolean);
          return {
            id: details.id,
            height: details.height,
            weight: details.weight,
            abilities: details.abilities.map((a: any) => a.ability.name),
            flavorText: flavorText,
            name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
            type: details.types.map((t: any) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(" / "),
            image: details.sprites.front_default,
            // FIX 2: Die stats-Eigenschaft wurde versehentlich doppelt eingefügt.
            // Wir behalten nur die korrekte, detaillierte Version.
            stats: { hp: details.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0, attack: details.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0, defense: details.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 0, speed: details.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0 },
            moves: undefined, // Wird später geladen
            moveUrls: details.moves.slice(0, 4).map((m: any) => m.move.url),
            sprites: sprites,
          };
        };
        const batchSize = 100;
        for (let i = 0; i < listData.results.length; i += batchSize) {
          const batch = listData.results.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map((p: { name: string; url: string }, idx: number) =>
              loadPokemonDetails(p, idx * 100)
            )
          );
          this.pokemonList.push(...batchResults);
        }
        for (let i = 0; i < Math.min(20, this.pokemonList.length); i++) {
          await this.loadMoveDetails(this.pokemonList[i]);
        }
      } catch (error) {
        console.error("Initial load failed:", error);
      }
    },

    // --- TEAM-MANAGEMENT ---
    addToTeam(pokemon: Pokemon) {
      if (this.yourTeam.length >= 3) {
        alert("Dein Team ist bereits voll (max. 3 Pokémon)!");
        return;
      }
      this.yourTeam.push({ ...pokemon });
    },
    addToOpponentTeam(pokemon: Pokemon) {
      if (this.opponentTeam.length >= 3) {
        alert("Das gegnerische Team ist bereits voll (max. 3 Pokémon)!");
        return;
      }
      this.opponentTeam.push({ ...pokemon });
    },
    removeFromTeam(index: number) {
      this.yourTeam.splice(index, 1);
    },
    removeFromOpponent(index: number) {
      this.opponentTeam.splice(index, 1);
    },
    updateEnemyTeam(shuffled: Pokemon[]) {
      this.opponentTeam = shuffled;
    },
    updateYourTeam(shuffled: Pokemon[]) {
      this.yourTeam = shuffled;
    },

    // --- KAMPF-STEUERUNG ---
    startBattle() {
      this.showBattle = true;
    },
    handleCloseBattle() {
      this.showBattle = false;
    },
    handleSwitchPokemon(index: number) {
      if (index > 0 && index < this.yourTeam.length) {
        const [pokemon] = this.yourTeam.splice(index, 1);
        this.yourTeam.unshift(pokemon);
      }
    },

    // --- POKEMON BEARBEITEN ---
    updatePokemonInList(updatedPokemon: Pokemon, originalName: string) {
      const index = this.pokemonList.findIndex((p) => p.name === originalName);
      if (index !== -1) {
        this.pokemonList[index] = updatedPokemon;
      }
    },
  },
});
