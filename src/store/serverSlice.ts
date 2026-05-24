/**
 * Slice Redux pour la gestion de la connexion au serveur RAVE
 * Stocke l'adresse IP, le port et le statut de connexion
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ServerState {
  ip: string;
  port: string;
  connectionStatus: 'idle' | 'connected' | 'error';
}

const initialState: ServerState = {
  ip: '',
  port: '8000',
  connectionStatus: 'idle',
};

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    // Met à jour l'adresse IP du serveur
    setIp(state, action: PayloadAction<string>) {
      state.ip = action.payload;
    },
    // Met à jour le port du serveur
    setPort(state, action: PayloadAction<string>) {
      state.port = action.payload;
    },
    // Met à jour le statut de connexion (idle, connected, error)
    setConnectionStatus(state, action: PayloadAction<'idle' | 'connected' | 'error'>) {
      state.connectionStatus = action.payload;
    },
  },
});

export const { setIp, setPort, setConnectionStatus } = serverSlice.actions;
export default serverSlice.reducer;
