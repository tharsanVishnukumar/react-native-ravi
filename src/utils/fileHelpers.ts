/**
 * Utilitaires pour la gestion des fichiers audio
 * Gère les répertoires de stockage persistant et la copie des fichiers
 */

import * as FileSystem from 'expo-file-system/legacy';

// Répertoire de stockage persistant pour les enregistrements
export const RECORDINGS_DIR = FileSystem.documentDirectory! + 'recordings/';

// Répertoire pour les fichiers audio transformés par RAVE
export const RAVE_OUTPUT_DIR = FileSystem.documentDirectory! + 'rave_output/';

/**
 * Crée les répertoires nécessaires au démarrage de l'application
 * Utilise { intermediates: true } pour éviter les erreurs si le dossier existe déjà
 */
export const ensureDirectories = async (): Promise<void> => {
  const dirs = [RECORDINGS_DIR, RAVE_OUTPUT_DIR];
  for (const dir of dirs) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
};

/**
 * Copie un enregistrement du cache vers le stockage persistant
 * Les enregistrements expo-av sont d'abord stockés dans le cache,
 * qui peut être nettoyé par le système à tout moment
 */
export const saveRecordingFile = async (
  cacheUri: string,
  fileName: string
): Promise<string> => {
  const destUri = RECORDINGS_DIR + fileName;
  await FileSystem.copyAsync({ from: cacheUri, to: destUri });
  return destUri;
};

/**
 * Supprime un fichier d'enregistrement du stockage persistant
 */
export const deleteRecordingFile = async (uri: string): Promise<void> => {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri);
  }
};
