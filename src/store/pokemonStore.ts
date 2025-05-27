import { ref } from 'vue';  
// Importiert die `ref`-Funktion aus Vue für reaktive Referenzen

import type { Pokemon } from '../types';  
// Importiert den TypeScript-Typ `Pokemon` aus der types-Datei

export const pokemonList = ref<Pokemon[]>([]);  
// Erstellt eine reaktive Referenz `pokemonList`, die ein Array von `Pokemon`-Objekten enthält
// Anfangs ist das Array leer ([])
// `ref` sorgt dafür, dass Vue auf Änderungen reagiert und die UI aktualisiert
