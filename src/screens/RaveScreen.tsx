/**
 * Écran RAVE — Transfert de timbre audio
 * Permet de sélectionner une source audio, choisir un modèle RAVE,
 * envoyer au serveur pour traitement, puis écouter le résultat
 *
 * Flux : sélection source → sélection modèle → upload → attente → download → lecture
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import { setModels, setSelectedModel, setProcessing, setTransformedAudioUri } from '../store/raveSlice';
import {
  getBaseUrl,
  fetchAvailableModels,
  selectServerModel,
  uploadAudioFile,
  downloadTransformedAudio,
} from '../services/api';
import AudioSourceTabs from '../components/AudioSourceTabs';
import ModelSelector from '../components/ModelSelector';
import AudioPlayer from '../components/AudioPlayer';

export default function RaveScreen() {
  const dispatch = useAppDispatch();
  const { ip, port, connectionStatus } = useAppSelector((state) => state.server);
  const { availableModels, selectedModel, isProcessing, transformedAudioUri } =
    useAppSelector((state) => state.rave);

  // État local pour la source audio sélectionnée
  const [selectedSourceUri, setSelectedSourceUri] = useState<string | null>(null);
  const [selectedSourceName, setSelectedSourceName] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  /**
   * Charge la liste des modèles disponibles à chaque focus de l'écran
   * Ne charge que si la connexion au serveur est établie
   */
  useFocusEffect(
    useCallback(() => {
      if (connectionStatus === 'connected') {
        loadModels();
      }
    }, [connectionStatus, ip, port])
  );

  // Récupère les modèles depuis le serveur
  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const baseUrl = getBaseUrl(ip, port);
      const models = await fetchAvailableModels(baseUrl);
      dispatch(setModels(models));
    } catch (error) {
      console.error('Erreur lors du chargement des modèles :', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  /**
   * Sélectionne un modèle sur le serveur et met à jour le store Redux
   */
  const handleModelSelect = async (model: string) => {
    try {
      const baseUrl = getBaseUrl(ip, port);
      await selectServerModel(baseUrl, model);
      dispatch(setSelectedModel(model));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le modèle.');
    }
  };

  /**
   * Callback quand l'utilisateur sélectionne une source audio
   */
  const handleSourceSelected = (uri: string, name: string) => {
    setSelectedSourceUri(uri);
    setSelectedSourceName(name);
    // Réinitialiser le son transformé quand la source change
    dispatch(setTransformedAudioUri(null));
  };

  /**
   * Envoie le fichier audio au serveur, attend le traitement,
   * puis télécharge le résultat transformé
   */
  const handleSendToServer = async () => {
    if (!selectedSourceUri || !selectedModel) return;

    dispatch(setProcessing(true));
    dispatch(setTransformedAudioUri(null));

    try {
      const baseUrl = getBaseUrl(ip, port);

      // Étape 1 : Upload du fichier audio
      const uploadResult = await uploadAudioFile(baseUrl, selectedSourceUri);
      console.log('Upload terminé :', uploadResult);

      // Étape 2 : Téléchargement automatique du résultat transformé
      const downloadedUri = await downloadTransformedAudio(baseUrl);
      dispatch(setTransformedAudioUri(downloadedUri));

      Alert.alert('Succès', 'Le son a été transformé avec succès !');
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Erreur lors du traitement audio. Vérifiez la connexion au serveur.'
      );
    } finally {
      dispatch(setProcessing(false));
    }
  };

  // Vérifie si le bouton d'envoi doit être activé
  const canSend =
    connectionStatus === 'connected' &&
    selectedSourceUri !== null &&
    selectedModel !== null &&
    !isProcessing;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avertissement si non connecté */}
      {connectionStatus !== 'connected' && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={18} color="#F57C00" />
          <Text style={styles.warningText}>
            Connectez-vous au serveur dans l'onglet Home
          </Text>
        </View>
      )}

      {/* Section 1 : Sélection de la source audio */}
      <Text style={styles.sectionTitle}>Source audio</Text>
      <AudioSourceTabs
        onSourceSelected={handleSourceSelected}
        selectedUri={selectedSourceUri}
      />

      {/* Affichage du fichier sélectionné */}
      {selectedSourceName ? (
        <View style={styles.selectedInfo}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.selectedText} numberOfLines={1}>
            {selectedSourceName}
          </Text>
        </View>
      ) : null}

      {/* Section 2 : Sélection du modèle */}
      <ModelSelector
        models={availableModels}
        selectedModel={selectedModel}
        onSelect={handleModelSelect}
        isLoading={isLoadingModels}
      />

      {/* Section 3 : Bouton d'envoi */}
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={handleSendToServer}
        disabled={!canSend}
        activeOpacity={0.7}
      >
        {isProcessing ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.sendButtonText}>Traitement en cours...</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload" size={22} color="#fff" />
            <Text style={styles.sendButtonText}>Envoyer au serveur</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Section 4 : Lecteurs audio (original et transformé) */}
      <View style={styles.playbackSection}>
        <Text style={styles.sectionTitle}>Lecture</Text>
        <View style={styles.playbackRow}>
          <AudioPlayer
            uri={selectedSourceUri}
            label="Original"
            color="#6200EE"
            disabled={isProcessing}
          />
          <AudioPlayer
            uri={transformedAudioUri}
            label="Transformé"
            color="#03DAC6"
            disabled={isProcessing || !transformedAudioUri}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  selectedText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#6200EE',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0',
    elevation: 0,
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  playbackSection: {
    marginTop: 20,
  },
  playbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
});
