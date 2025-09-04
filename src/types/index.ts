export type Move = {
    name: string;
    power: number;
    accuracy: number;
    pp: number;
    type: string;
    damageClass: string;
  };
  
  export type Pokemon = {
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