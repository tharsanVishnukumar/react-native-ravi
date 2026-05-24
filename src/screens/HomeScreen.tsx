/**
 * Écran Home — Connexion au serveur RAVE
 * Permet de saisir l'adresse IP et le port du serveur,
 * puis de tester la connexion avec un bouton
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store';
import { setIp, setPort, setConnectionStatus } from '../store/serverSlice';
import { testServerConnection, getBaseUrl } from '../services/api';

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { ip, port, connectionStatus } = useAppSelector((state) => state.server);

  // État local pour les champs de saisie et le chargement
  const [ipInput, setIpInput] = useState(ip);
  const [portInput, setPortInput] = useState(port);
  const [isTesting, setIsTesting] = useState(false);

  // Teste la connexion au serveur en envoyant une requête GET /
  const handleTestConnection = async () => {
    // Sauvegarder l'IP et le port dans le store Redux
    dispatch(setIp(ipInput));
    dispatch(setPort(portInput));

    setIsTesting(true);
    try {
      const baseUrl = getBaseUrl(ipInput, portInput);
      await testServerConnection(baseUrl);
      dispatch(setConnectionStatus('connected'));
      Alert.alert('Succès', 'Connexion au serveur réussie !');
    } catch (error) {
      dispatch(setConnectionStatus('error'));
      Alert.alert(
        'Erreur de connexion',
        'Impossible de se connecter au serveur. Vérifiez l\'adresse IP et le port.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  // Détermine l'icône et la couleur selon le statut de connexion
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return { name: 'cloud-done' as const, color: '#4CAF50' };
      case 'error':
        return { name: 'cloud-offline' as const, color: '#F44336' };
      default:
        return { name: 'cloud-outline' as const, color: '#888' };
    }
  };

  const statusIcon = getStatusIcon();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo et titre */}
      <View style={styles.header}>
        <Ionicons name="musical-notes" size={60} color="#6200EE" />
        <Text style={styles.title}>RAVI</Text>
        <Text style={styles.subtitle}>Transfert de timbre audio</Text>
      </View>

      {/* Formulaire de connexion */}
      <View style={styles.form}>
        {/* Champ adresse IP */}
        <Text style={styles.label}>Adresse IP du serveur</Text>
        <TextInput
          style={styles.input}
          placeholder="192.168.1.100"
          placeholderTextColor="#aaa"
          value={ipInput}
          onChangeText={setIpInput}
          keyboardType="decimal-pad"
          autoCorrect={false}
        />

        {/* Champ port */}
        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          placeholder="8000"
          placeholderTextColor="#aaa"
          value={portInput}
          onChangeText={setPortInput}
          keyboardType="number-pad"
        />

        {/* Bouton de test */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleTestConnection}
          disabled={isTesting || !ipInput.trim()}
          activeOpacity={0.7}
        >
          {isTesting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="link" size={20} color="#fff" />
          )}
          <Text style={styles.buttonText}>
            {isTesting ? 'Test en cours...' : 'Tester la connexion'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indicateur de statut */}
      <View style={styles.statusContainer}>
        <Ionicons name={statusIcon.name} size={28} color={statusIcon.color} />
        <Text style={[styles.statusText, { color: statusIcon.color }]}>
          {connectionStatus === 'connected'
            ? 'Connecté au serveur'
            : connectionStatus === 'error'
            ? 'Connexion échouée'
            : 'Non connecté'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6200EE',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#6200EE',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
