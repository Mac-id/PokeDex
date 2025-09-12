import { defineStore } from "pinia";
import type { Pokemon, Move } from "../types";

interface PokemonListItem {
  name: string;
  url: string;
}

export const usePokemonStore = defineStore("pokemon", {
  state: () => ({
    pokemonList: [] as Pokemon[],
    yourTeam: [] as Pokemon[],
    opponentTeam: [] as Pokemon[],
    showBattle: false,
    isLoading: true,
    loadingProgress: 0,
    loadingStatusText: "Initialisiere...",
    fullPokemonUrlList: [] as PokemonListItem[],
    isLoadingMore: false,
    allPokemonLoaded: false,
  }),

  actions: {
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
      const cachedList = localStorage.getItem('pokemonList');
      if (cachedList) {
        this.pokemonList = JSON.parse(cachedList);
        if (this.pokemonList.length >= 1025) {
            this.allPokemonLoaded = true;
        }
        this.isLoading = false;
        return;
      }

      try {
        this.isLoading = true;
        this.loadingStatusText = "Lade Pokémon-Liste...";
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
        const data = await response.json();
        this.fullPokemonUrlList = data.results;
        
        await this.loadMorePokemon();

      } catch (error) {
        console.error("Fehler beim Laden der Pokémon-Liste:", error);
        this.loadingStatusText = "Fehler beim Laden!";
      } finally {
        this.isLoading = false;
      }
    },

    async loadMorePokemon() {
      if (this.isLoadingMore || this.allPokemonLoaded) return;

      this.isLoadingMore = true;
      const currentCount = this.pokemonList.length;
      const nextBatch = this.fullPokemonUrlList.slice(currentCount, currentCount + 50);

      if (nextBatch.length === 0) {
        this.allPokemonLoaded = true;
        this.isLoadingMore = false;
        return;
      }

      try {
        const detailPromises = nextBatch.map(pokemon => fetch(pokemon.url).then(res => res.json()));
        const detailsList = await Promise.all(detailPromises);

        for (const details of detailsList) {
          let flavorText = "Keine Beschreibung verfügbar.";
          try {
              const speciesRes = await fetch(details.species.url);
              const speciesData = await speciesRes.json();
              const germanEntry = speciesData.flavor_text_entries.find((entry: any) => entry.language.name === 'de');
              const englishEntry = speciesData.flavor_text_entries.find((entry: any) => entry.language.name === 'en');
              if (germanEntry) {
                flavorText = germanEntry.flavor_text.replace(/\f/g, ' ');
              } else if (englishEntry) {
                flavorText = englishEntry.flavor_text.replace(/\f/g, ' ');
              }
          } catch(e) {
              console.error(`Konnte Spezies-Daten für ${details.name} nicht laden:`, e);
          }
          
          const capitalizedName = details.name.charAt(0).toUpperCase() + details.name.slice(1);
          
          this.pokemonList.push({
            id: details.id,
            height: details.height,
            weight: details.weight,
            abilities: details.abilities.map((a: any) => a.ability.name),
            flavorText,
            name: capitalizedName,
            type: details.types.map((t: any) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(" / "),
            image: details.sprites.front_default,
            stats: { 
                hp: details.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0, 
                attack: details.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0, 
                defense: details.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 0, 
                speed: details.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0 
            },
            moveUrls: details.moves.slice(0, 4).map((m: any) => m.move.url),
            moves: undefined,
            sprites: [],
          });
        }
        
        localStorage.setItem('pokemonList', JSON.stringify(this.pokemonList));
      } catch (error) {
        console.error("Fehler beim Nachladen der Pokémon-Details:", error);
      } finally {
        this.isLoadingMore = false;
      }
    },
    
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
    updatePokemonInList(updatedPokemon: Pokemon, originalName: string) {
      const index = this.pokemonList.findIndex((p) => p.name === originalName);
      if (index !== -1) {
        this.pokemonList[index] = updatedPokemon;
      }
    },
  },
});