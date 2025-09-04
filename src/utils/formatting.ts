// Enthält reine, zustandslose Helferfunktionen.
export function formatMoveName(name: string): string {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }