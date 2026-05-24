/**
 * Point d'entrée principal de l'application RAVI
 * Configure le store Redux avec persistance, la navigation
 * et initialise les répertoires de stockage au démarrage
 */

import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { ensureDirectories } from './src/utils/fileHelpers';

// Composant interne qui initialise les répertoires au montage
function AppContent() {
  useEffect(() => {
    // Crée les dossiers recordings/ et rave_output/ s'ils n'existent pas
    ensureDirectories();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
