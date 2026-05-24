/**
 * Service API pour communiquer avec le serveur RAVE
 * Centralise toutes les requêtes réseau vers le serveur Flask
 */

import * as FileSystem from 'expo-file-system/legacy';
import { RAVE_OUTPUT_DIR } from '../utils/fileHelpers';

// Construit l'URL de base à partir de l'IP et du port
export const getBaseUrl = (ip: string, port: string): string =>
  `http://${ip}:${port}`;

/**
 * Teste la connexion au serveur (GET /)
 * Retourne le message du serveur si la connexion réussit
 */
export const testServerConnection = async (baseUrl: string): Promise<string> => {
  const response = await fetch(`${baseUrl}/`);
  const text = await response.text();
  return text;
};

/**
 * Récupère la liste des modèles disponibles (GET /getmodels)
 * Retourne un tableau de noms de modèles
 */
export const fetchAvailableModels = async (baseUrl: string): Promise<string[]> => {
  const response = await fetch(`${baseUrl}/getmodels`);
  const data = await response.json();
  return data.models;
};

/**
 * Sélectionne le modèle à utiliser (GET /selectModel/<modelName>)
 * Le serveur utilisera ce modèle pour le prochain upload
 */
export const selectServerModel = async (
  baseUrl: string,
  modelName: string
): Promise<string> => {
  const response = await fetch(`${baseUrl}/selectModel/${modelName}`);
  const text = await response.text();
  return text;
};

/**
 * Envoie un fichier audio au serveur pour traitement (POST /upload)
 * Utilise FileSystem.uploadAsync avec multipart form data
 * Le champ 'file' correspond à request.files['file'] côté serveur
 */
export const uploadAudioFile = async (
  baseUrl: string,
  fileUri: string
): Promise<string> => {
  const response = await FileSystem.uploadAsync(`${baseUrl}/upload`, fileUri, {
    fieldName: 'file',
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    headers: { filename: fileUri },
  });
  return response.body;
};

/**
 * Télécharge le fichier audio transformé (GET /download)
 * Sauvegarde le fichier dans le dossier rave_output avec un nom horodaté
 * Retourne l'URI locale du fichier téléchargé
 */
export const downloadTransformedAudio = async (
  baseUrl: string
): Promise<string> => {
  // Créer le dossier de sortie s'il n'existe pas
  const dirInfo = await FileSystem.getInfoAsync(RAVE_OUTPUT_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(RAVE_OUTPUT_DIR, { intermediates: true });
  }

  // Nom de fichier horodaté pour éviter les collisions
  const fileName = `transformed_${Date.now()}.wav`;
  const fileUri = RAVE_OUTPUT_DIR + fileName;

  const { uri } = await FileSystem.downloadAsync(`${baseUrl}/download`, fileUri);
  return uri;
};
