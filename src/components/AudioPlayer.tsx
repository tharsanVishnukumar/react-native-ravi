/**
 * Composant AudioPlayer — Bouton play/pause réutilisable
 * Gère le chargement, la lecture et le nettoyage d'un fichier audio
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  uri: string | null;
  label: string;
  color?: string;
  disabled?: boolean;
}

export default function AudioPlayer({
  uri,
  label,
  color = '#6200EE',
  disabled = false,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Nettoyer le son lors du démontage ou changement d'URI
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, [uri]);

  // Arrêter la lecture quand le composant est désactivé
  useEffect(() => {
    if (disabled && isPlaying) {
      handleStop();
    }
  }, [disabled]);

  // Démarre la lecture du fichier audio
  const handlePlay = async () => {
    if (!uri || disabled) return;

    try {
      setIsLoading(true);

      // Décharger l'ancien son s'il existe encore
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Configurer le mode audio complet pour la lecture sur haut-parleur
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );
      soundRef.current = sound;

      // Écouter la fin de lecture pour réinitialiser l'état
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });

      await sound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Erreur de lecture :', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Arrête la lecture en cours
  const handleStop = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  const isDisabled = disabled || !uri;

  return (
    <View style={[styles.container, isDisabled && styles.containerDisabled]}>
      <TouchableOpacity
        style={[styles.button, { borderColor: color }]}
        onPress={isPlaying ? handleStop : handlePlay}
        disabled={isDisabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons
            name={isPlaying ? 'stop' : 'play'}
            size={28}
            color={isDisabled ? '#ccc' : color}
          />
        )}
      </TouchableOpacity>
      <Text style={[styles.label, { color: isDisabled ? '#ccc' : '#333' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
