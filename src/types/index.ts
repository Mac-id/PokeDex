export type Move = {
    name: string;
    power: number;
    accuracy: number;
    pp: number;
    type: string;
    damageClass: string;
  };
  
  export type Pokemon = {
    id: number; // NEU
    height: number; // NEU (in Dezimetern)
    weight: number; // NEU (in Hektogramm)
    abilities: string[]; // NEU
    flavorText: string;
    name: string;
    type: string;
    image: string;
    stats?: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
    };
    moves?: Move[];
    moveUrls?: string[];
    sprites?: string[];
  };