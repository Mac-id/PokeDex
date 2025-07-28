// NEU: Wir definieren 'Move' als eigenen, exportierbaren Typ
export type Move = {
  name: string;
  power: number;
  accuracy: number;
  pp: number;
  type: string;
  damageClass: string;
};

// Der 'Pokemon'-Typ verwendet jetzt den neuen 'Move'-Typ
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
  moves?: Move[]; // Hier wird der neue Typ verwendet
  moveUrls?: string[];
  sprites?: string[];
};