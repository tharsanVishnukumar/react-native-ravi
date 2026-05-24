/**
 * Composant ModelSelector — Sélecteur de modèle RAVE
 * Affiche les modèles disponibles sous forme de chips horizontaux
 * Le modèle sélectionné est mis en surbrillance
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  models: string[];
  selectedModel: string | null;
  onSelect: (model: string) => void;
  isLoading: boolean;
}

// Retire l'extension .onnx du nom du modèle pour l'affichage
const formatModelName = (name: string): string =>
  name.replace('.onnx', '').charAt(0).toUpperCase() + name.replace('.onnx', '').slice(1);

// Retourne une icône appropriée selon le nom du modèle
const getModelIcon = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('cat')) return 'paw';
  if (lower.includes('dog')) return 'paw';
  if (lower.includes('jazz')) return 'musical-note';
  if (lower.includes('darbouka')) return 'disc';
  if (lower.includes('speech')) return 'chatbubble';
  return 'ellipse';
};

export default function ModelSelector({
  models,
  selectedModel,
  onSelect,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6200EE" />
        <Text style={styles.loadingText}>Chargement des modèles...</Text>
      </View>
    );
  }

  if (models.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={20} color="#888" />
        <Text style={styles.loadingText}>Connectez-vous au serveur d'abord</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modèle</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {models.map((model) => {
            const isSelected = selectedModel === model;
            return (
              <TouchableOpacity
                key={model}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => onSelect(model)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={getModelIcon(model) as any}
                  size={16}
                  color={isSelected ? '#fff' : '#6200EE'}
                />
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {formatModelName(model)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F0E6FF',
    borderWidth: 1.5,
    borderColor: '#D1C4E9',
  },
  chipSelected: {
    backgroundColor: '#6200EE',
    borderColor: '#6200EE',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6200EE',
  },
  chipTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#888',
  },
});
