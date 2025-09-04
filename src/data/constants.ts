// Enthält statische Daten, die sich nie ändern.
export const typeChart: { [key: string]: { strong_against: string[]; weak_against: string[]; immune: string[]; } } = {
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
    fairy: { strong_against: ["fighting", "dragon", "dark"], weak_against: ["fire", "poison", "steel"], immune: [] },
  };
  
  export const damageClassTranslations: { [key: string]: string } = {
    physical: "Physisch",
    special: "Speziell",
    status: "Status",
  };