import { ref, computed } from 'vue';
import type { Pokemon } from '../types';
import type { Ref } from 'vue';

export function useSearch(pokemonList: Ref<Pokemon[]>) {
  const searchQuery = ref("");

  const filteredPokemon = computed(() => {
    if (!searchQuery.value) return pokemonList.value;
    const query = searchQuery.value.toLowerCase();
    return pokemonList.value.filter(
      (pokemon) =>
        pokemon.name.toLowerCase().includes(query) ||
        pokemon.type.toLowerCase().includes(query)
    );
  });

  return {
    searchQuery,
    filteredPokemon
  };
}