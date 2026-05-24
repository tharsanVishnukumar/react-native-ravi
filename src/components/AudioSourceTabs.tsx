/**
 * Composant AudioSourceTabs — Onglets de sélection de la source audio
 * 3 onglets internes dans l'écran RAVE :
 * - Défaut : son par défaut intégré à l'application
 * - Enregistrements : sélection parmi les clips sauvegardés
 * - Fichier : sélection d'un fichier audio depuis le téléphone
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Asset, useAssets } from 'expo-asset';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store';

interface Props {
  onSourceSelected: (uri: string, name: string) => void;
  selectedUri: string | null;
}

/**
 * Onglet "Défaut" — Charge le son par défaut depuis les assets
 */
function DefaultTab({
  onSelect,
  isSelected,
}: {
  onSelect: (uri: string, name: string) => void;
  isSelected: boolean;
}) {
  // Charger l'asset audio par défaut (conforme au helpers.js fourni)
  const [assets, error] = useAssets([require('../../assets/audio/default_sound.wav')]);

  // Copie l'asset vers le filesystem pour garantir la compatibilité AVPlayer iOS
  const handleSelect = async () => {
    if (!assets || !assets[0]) return;
    const asset = assets[0];
    await asset.downloadAsync();
    const destUri = FileSystem.documentDirectory! + 'default_sound.wav';
    if (asset.localUri) {
      await FileSystem.copyAsync({ from: asset.localUri, to: destUri });
      onSelect(destUri, 'Son par défaut');
    }
  };

  return (
    <View style={styles.tabContent}>
      <Ionicons name="musical-note" size={40} color="#6200EE" />
      <Text style={styles.tabLabel}>Son par défaut (440Hz)</Text>
      <TouchableOpacity
        style={[styles.selectButton, isSelected && styles.selectButtonActive]}
        onPress={handleSelect}
        disabled={!assets || !!error}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
          size={20}
          color="#fff"
        />
        <Text style={styles.selectButtonText}>
          {isSelected ? 'Sélectionné' : 'Utiliser'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Onglet "Enregistrements" — Liste les clips de la vue Record
 */
function RecordingsTab({
  onSelect,
  selectedUri,
}: {
  onSelect: (uri: string, name: string) => void;
  selectedUri: string | null;
}) {
  const { recordings } = useAppSelector((state) => state.recordings);

  if (recordings.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Ionicons name="mic-off-outline" size={40} color="#ccc" />
        <Text style={styles.emptyText}>
          Aucun enregistrement. Allez dans l'onglet Record.
        </Text>
      </View>
    );
  }

  // ScrollView au lieu de FlatList pour éviter l'erreur de VirtualizedList imbriquée
  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      {recordings.map((item) => {
        const isSelected = selectedUri === item.uri;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.recordingRow, isSelected && styles.recordingRowSelected]}
            onPress={() => onSelect(item.uri, item.name)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={isSelected ? '#6200EE' : '#aaa'}
            />
            <Text
              style={[styles.recordingName, isSelected && styles.recordingNameSelected]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/**
 * Onglet "Fichier" — Permet de sélectionner un fichier audio du téléphone
 */
function FileTab({
  onSelect,
  pickedFileName,
  isSelected,
}: {
  onSelect: (uri: string, name: string) => void;
  pickedFileName: string | null;
  isSelected: boolean;
}) {
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      // Vérifier que l'utilisateur n'a pas annulé
      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        onSelect(file.uri, file.name);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de fichier :', error);
    }
  };

  return (
    <View style={styles.tabContent}>
      <Ionicons name="folder-open" size={40} color="#6200EE" />
      <Text style={styles.tabLabel}>
        {pickedFileName || 'Aucun fichier sélectionné'}
      </Text>
      <TouchableOpacity
        style={[styles.selectButton, isSelected && styles.selectButtonActive]}
        onPress={pickFile}
        activeOpacity={0.7}
      >
        <Ionicons name="document-outline" size={20} color="#fff" />
        <Text style={styles.selectButtonText}>Parcourir</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AudioSourceTabs({ onSourceSelected, selectedUri }: Props) {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);

  // Définition des routes (onglets)
  const [routes] = useState([
    { key: 'default', title: 'Défaut' },
    { key: 'recordings', title: 'Enregistrements' },
    { key: 'file', title: 'Fichier' },
  ]);

  // Gère le callback quand un fichier est sélectionné depuis l'onglet Fichier
  const handleFileSelect = (uri: string, name: string) => {
    setPickedFileName(name);
    onSourceSelected(uri, name);
  };

  // Rendu de chaque onglet
  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'default':
        return (
          <DefaultTab
            onSelect={onSourceSelected}
            isSelected={selectedUri !== null && index === 0}
          />
        );
      case 'recordings':
        return (
          <RecordingsTab
            onSelect={onSourceSelected}
            selectedUri={selectedUri}
          />
        );
      case 'file':
        return (
          <FileTab
            onSelect={handleFileSelect}
            pickedFileName={pickedFileName}
            isSelected={selectedUri !== null && index === 2}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#6200EE' }}
            style={styles.tabBar}
            tabStyle={styles.tabBarTab}
            activeColor="#6200EE"
            inactiveColor="#888"
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarTab: {
    padding: 4,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  tabLabel: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6200EE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  selectButtonActive: {
    backgroundColor: '#4CAF50',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
  },
  listContent: {
    padding: 8,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  recordingRowSelected: {
    backgroundColor: '#F0E6FF',
  },
  recordingName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  recordingNameSelected: {
    fontWeight: '600',
    color: '#6200EE',
  },
});
