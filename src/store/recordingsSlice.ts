/**
 * Slice Redux pour la gestion des enregistrements audio
 * Ce slice est persisté via redux-persist pour conserver
 * la liste des enregistrements entre les sessions
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Recording } from '../types';

interface RecordingsState {
  recordings: Recording[];
}

const initialState: RecordingsState = {
  recordings: [],
};

const recordingsSlice = createSlice({
  name: 'recordings',
  initialState,
  reducers: {
    // Ajoute un nouvel enregistrement à la liste
    addRecording(state, action: PayloadAction<Recording>) {
      state.recordings.unshift(action.payload);
    },
    // Supprime un enregistrement par son identifiant
    removeRecording(state, action: PayloadAction<string>) {
      state.recordings = state.recordings.filter((r) => r.id !== action.payload);
    },
  },
});

export const { addRecording, removeRecording } = recordingsSlice.actions;
export default recordingsSlice.reducer;
