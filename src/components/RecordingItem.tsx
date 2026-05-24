/**
 * Composant RecordingItem — Affiche une ligne d'enregistrement dans la FlatList
 * Permet de réécouter ou supprimer un enregistrement sauvegardé
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '../types';

interface Props {
  recording: Recording;
  isPlaying: boolean;
  onPlay: (uri: string, id: string) => void;
  onStop: () => void;
  onDelete: (id: string) => void;
}

// Formate la durée en millisecondes en format "m:ss"
const formatDuration = (ms: number): string => {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

// Formate la date ISO en format court lisible
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function RecordingItem({
  recording,
  isPlaying,
  onPlay,
  onStop,
  onDelete,
}: Props) {
  // Demande confirmation avant suppression
  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer "${recording.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDelete(recording.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Informations de l'enregistrement */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{recording.name}</Text>
        <Text style={styles.details}>
          {formatDuration(recording.duration)} — {formatDate(recording.createdAt)}
        </Text>
      </View>

      {/* Boutons d'action */}
      <View style={styles.actions}>
        {/* Bouton lecture/stop */}
        <TouchableOpacity
          onPress={() => (isPlaying ? onStop() : onPlay(recording.uri, recording.id))}
          style={styles.actionButton}
        >
          <Ionicons
            name={isPlaying ? 'stop-circle' : 'play-circle'}
            size={32}
            color={isPlaying ? '#F44336' : '#6200EE'}
          />
        </TouchableOpacity>

        {/* Bouton supprimer */}
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  details: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
});
