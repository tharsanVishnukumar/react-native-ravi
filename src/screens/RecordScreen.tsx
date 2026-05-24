/**
 * Écran Record — Enregistrement et gestion des clips audio
 * Permet d'enregistrer avec le micro, de sauvegarder avec un nom,
 * et d'afficher/réécouter/supprimer les enregistrements sauvegardés
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store';
import { addRecording, removeRecording } from '../store/recordingsSlice';
import { saveRecordingFile, deleteRecordingFile } from '../utils/fileHelpers';
import RecordingItem from '../components/RecordingItem';

export default function RecordScreen() {
  const dispatch = useAppDispatch();
  const { recordings } = useAppSelector((state) => state.recordings);

  // État local pour l'enregistrement en cours
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecordingUri, setCurrentRecordingUri] = useState<string | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // État local pour la lecture
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const playbackRef = useRef<Audio.Sound | null>(null);

  // État local pour la lecture de l'enregistrement en cours (non sauvegardé)
  const [isPlayingCurrent, setIsPlayingCurrent] = useState(false);
  const currentPlaybackRef = useRef<Audio.Sound | null>(null);

  // État local pour la modale de sauvegarde
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Nettoyage des ressources audio au démontage du composant
  useEffect(() => {
    return () => {
      playbackRef.current?.unloadAsync();
      currentPlaybackRef.current?.unloadAsync();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  /**
   * Démarre ou arrête l'enregistrement audio
   * Configure le mode audio pour l'enregistrement avant de démarrer
   */
  const toggleRecording = async () => {
    try {
      if (isRecording) {
        // Arrêter l'enregistrement
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const status = await recordingRef.current.getStatusAsync();
          const uri = recordingRef.current.getURI();
          setCurrentRecordingUri(uri);
          setCurrentDuration(status.durationMillis || 0);
          recordingRef.current = null;

          // Remettre le mode audio en lecture (haut-parleur au lieu de l'écouteur sur iOS)
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        }
        setIsRecording(false);
      } else {
        // Arrêter toute lecture en cours avant d'enregistrer
        await stopAllPlayback();

        // Demander la permission du micro
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'L\'accès au micro est nécessaire pour enregistrer.');
          return;
        }

        // Configurer le mode audio pour l'enregistrement
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Démarrer l'enregistrement avec qualité haute
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setCurrentRecordingUri(null);
        setCurrentDuration(0);
        setIsRecording(true);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'enregistrement audio.');
      setIsRecording(false);
    }
  };

  /**
   * Arrête toutes les lectures en cours (sauvegardées et en cours)
   */
  const stopAllPlayback = async () => {
    if (playbackRef.current) {
      await playbackRef.current.unloadAsync();
      playbackRef.current = null;
      setCurrentPlayingId(null);
    }
    if (currentPlaybackRef.current) {
      await currentPlaybackRef.current.unloadAsync();
      currentPlaybackRef.current = null;
      setIsPlayingCurrent(false);
    }
  };

  /**
   * Lit ou met en pause l'enregistrement en cours (non encore sauvegardé)
   */
  const togglePlayCurrent = async () => {
    if (!currentRecordingUri) return;

    try {
      if (isPlayingCurrent) {
        await currentPlaybackRef.current?.unloadAsync();
        currentPlaybackRef.current = null;
        setIsPlayingCurrent(false);
      } else {
        // Arrêter les autres lectures
        if (playbackRef.current) {
          await playbackRef.current.unloadAsync();
          playbackRef.current = null;
          setCurrentPlayingId(null);
        }

        // Remettre le mode audio en lecture
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

        const { sound } = await Audio.Sound.createAsync({ uri: currentRecordingUri });
        currentPlaybackRef.current = sound;

        // Arrêter automatiquement à la fin de la lecture
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingCurrent(false);
            sound.unloadAsync();
            currentPlaybackRef.current = null;
          }
        });

        await sound.playAsync();
        setIsPlayingCurrent(true);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la lecture.');
      setIsPlayingCurrent(false);
    }
  };

  /**
   * Sauvegarde l'enregistrement en cours dans le stockage persistant
   * et l'ajoute au store Redux
   */
  const handleSave = async () => {
    if (!currentRecordingUri || !saveName.trim()) return;

    try {
      // Copier le fichier du cache vers le stockage persistant
      const fileName = `recording_${Date.now()}.m4a`;
      const persistentUri = await saveRecordingFile(currentRecordingUri, fileName);

      // Ajouter au store Redux (persisté via redux-persist)
      dispatch(
        addRecording({
          id: Date.now().toString(),
          name: saveName.trim(),
          uri: persistentUri,
          duration: currentDuration,
          createdAt: new Date().toISOString(),
        })
      );

      // Réinitialiser l'état
      setCurrentRecordingUri(null);
      setCurrentDuration(0);
      setSaveName('');
      setShowSaveModal(false);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde.');
    }
  };

  /**
   * Joue un enregistrement sauvegardé depuis la FlatList
   */
  const handlePlaySaved = async (uri: string, id: string) => {
    try {
      await stopAllPlayback();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const { sound } = await Audio.Sound.createAsync({ uri });
      playbackRef.current = sound;
      setCurrentPlayingId(id);

      // Arrêter automatiquement à la fin de la lecture
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setCurrentPlayingId(null);
          sound.unloadAsync();
          playbackRef.current = null;
        }
      });

      await sound.playAsync();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de lire cet enregistrement.');
      setCurrentPlayingId(null);
    }
  };

  /**
   * Arrête la lecture de l'enregistrement sauvegardé en cours
   */
  const handleStopSaved = async () => {
    if (playbackRef.current) {
      await playbackRef.current.unloadAsync();
      playbackRef.current = null;
    }
    setCurrentPlayingId(null);
  };

  /**
   * Supprime un enregistrement sauvegardé (fichier + store Redux)
   */
  const handleDelete = async (id: string) => {
    // Arrêter la lecture si c'est celui en cours
    if (currentPlayingId === id) {
      await handleStopSaved();
    }

    // Trouver et supprimer le fichier
    const recording = recordings.find((r) => r.id === id);
    if (recording) {
      await deleteRecordingFile(recording.uri);
    }

    // Retirer du store Redux
    dispatch(removeRecording(id));
  };

  // Formate la durée en m:ss pour l'affichage
  const formatDuration = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Zone d'enregistrement */}
      <View style={styles.recordSection}>
        {/* Bouton d'enregistrement circulaire */}
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={toggleRecording}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={40}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.recordLabel}>
          {isRecording ? 'Enregistrement en cours...' : 'Appuyez pour enregistrer'}
        </Text>

        {/* Contrôles pour l'enregistrement en cours (non sauvegardé) */}
        {currentRecordingUri && !isRecording && (
          <View style={styles.currentRecordingControls}>
            <Text style={styles.currentRecordingText}>
              Enregistrement — {formatDuration(currentDuration)}
            </Text>
            <View style={styles.controlButtons}>
              {/* Bouton lecture/pause de l'enregistrement en cours */}
              <TouchableOpacity
                style={styles.controlButton}
                onPress={togglePlayCurrent}
              >
                <Ionicons
                  name={isPlayingCurrent ? 'pause' : 'play'}
                  size={24}
                  color="#6200EE"
                />
              </TouchableOpacity>

              {/* Bouton sauvegarder */}
              <TouchableOpacity
                style={[styles.controlButton, styles.saveButton]}
                onPress={() => setShowSaveModal(true)}
              >
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Liste des enregistrements sauvegardés */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          Enregistrements ({recordings.length})
        </Text>
        {recordings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mic-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              Aucun enregistrement sauvegardé
            </Text>
          </View>
        ) : (
          <FlatList
            data={recordings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RecordingItem
                recording={item}
                isPlaying={currentPlayingId === item.id}
                onPlay={handlePlaySaved}
                onStop={handleStopSaved}
                onDelete={handleDelete}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modale de sauvegarde avec champ de nom */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nommer l'enregistrement</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom de l'enregistrement"
              placeholderTextColor="#aaa"
              value={saveName}
              onChangeText={setSaveName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  !saveName.trim() && styles.modalSaveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!saveName.trim()}
              >
                <Text style={styles.modalSaveText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  recordSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200EE',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: '#F44336',
  },
  recordLabel: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  currentRecordingControls: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  currentRecordingText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0E6FF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6200EE',
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  // Styles de la modale
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
