/**
 * Types partagés de l'application RAVI
 * Définit les interfaces utilisées dans le store Redux et les composants
 */

// Représente un enregistrement audio sauvegardé
export interface Recording {
  id: string;
  name: string;
  uri: string;
  duration: number; // durée en millisecondes
  createdAt: string; // date ISO
}
