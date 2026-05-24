/**
 * Slice Redux pour la gestion du transfert de timbre RAVE
 * Stocke les modèles disponibles, le modèle sélectionné,
 * l'état de traitement et l'URI du son transformé
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RaveState {
  availableModels: string[];
  selectedModel: string | null;
  isProcessing: boolean;
  transformedAudioUri: string | null;
}

const initialState: RaveState = {
  availableModels: [],
  selectedModel: null,
  isProcessing: false,
  transformedAudioUri: null,
};

const raveSlice = createSlice({
  name: 'rave',
  initialState,
  reducers: {
    // Met à jour la liste des modèles disponibles sur le serveur
    setModels(state, action: PayloadAction<string[]>) {
      state.availableModels = action.payload;
    },
    // Sélectionne le modèle à utiliser pour le transfert
    setSelectedModel(state, action: PayloadAction<string | null>) {
      state.selectedModel = action.payload;
    },
    // Indique si un traitement est en cours
    setProcessing(state, action: PayloadAction<boolean>) {
      state.isProcessing = action.payload;
    },
    // Stocke l'URI du fichier audio transformé après téléchargement
    setTransformedAudioUri(state, action: PayloadAction<string | null>) {
      state.transformedAudioUri = action.payload;
    },
  },
});

export const { setModels, setSelectedModel, setProcessing, setTransformedAudioUri } =
  raveSlice.actions;
export default raveSlice.reducer;
