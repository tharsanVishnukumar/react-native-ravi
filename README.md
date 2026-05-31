# RAVI — Transfert de timbre audio

Application mobile React Native (Expo) permettant d'enregistrer des clips audio et de leur appliquer un transfert de timbre via le modèle RAVE (Realtime Audio Variational autoEncoder) développé par l'IRCAM.

L'application communique avec un serveur Python Flask qui exécute les modèles ONNX pour transformer le son.

## Fonctionnalités

- **Connexion au serveur** — Saisie de l'adresse IP et du port, test de connexion
- **Enregistrement audio** — Enregistrement via le micro, lecture, sauvegarde avec nom personnalisé, suppression
- **Transfert de timbre** — Sélection d'une source audio (son par défaut, enregistrement, fichier du téléphone), choix du modèle (Jazz, Darbouka, Parole, Chats, Chiens), envoi au serveur et écoute du résultat

## Télécharger l'application (Android)

Un APK prêt à installer est disponible via Expo (EAS Build), sans passer par le Play Store :

**[➡️ Télécharger / installer RAVI](https://expo.dev/accounts/tharsan.vishnukumar/projects/react-native-ravi/builds/3f6fb0da-970f-436d-bae6-6537b0111c8c)**

1. Ouvrez le lien ci-dessus sur votre téléphone Android (ou scannez le QR code de la page).
2. Téléchargez l'`.apk`.
3. Autorisez l'installation depuis des « sources inconnues » si demandé.
4. Lancez RAVI.

> iOS : non disponible en installation directe (nécessite un compte Apple Developer).

## Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- [Expo Go](https://expo.dev/go) sur votre téléphone
- Python 3 avec Miniconda pour le serveur

## Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd ravi

# Installer les dépendances
npm install
```

## Lancer le serveur RAVE

```bash
cd RAVE-ONNX-Server
pip install -r requirements.txt
python server.py
```

Le serveur démarre sur le port 8000. Notez l'adresse IP affichée dans le terminal.

## Lancer l'application

```bash
npx expo start
```

Scannez le QR code avec Expo Go, puis entrez l'adresse IP du serveur dans l'onglet Home.

## Architecture

```
ravi/
├── App.tsx                        # Point d'entrée (Redux + Navigation)
├── assets/audio/                  # Son par défaut
├── src/
│   ├── store/                     # Redux Toolkit + redux-persist
│   │   ├── serverSlice.ts         # État de connexion
│   │   ├── recordingsSlice.ts     # Liste des enregistrements (persisté)
│   │   └── raveSlice.ts           # Modèles et état de traitement
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Connexion au serveur
│   │   ├── RecordScreen.tsx       # Enregistrement audio
│   │   └── RaveScreen.tsx         # Transfert de timbre
│   ├── components/                # Composants réutilisables
│   ├── services/api.ts            # Appels API au serveur Flask
│   ├── utils/fileHelpers.ts       # Gestion des fichiers
│   └── navigation/                # Navigation par tabs swipables
```

## Technologies

- **React Native** / **Expo SDK 54**
- **Redux Toolkit** + **redux-persist** (état global, persistance AsyncStorage)
- **expo-av** (enregistrement et lecture audio)
- **expo-file-system** (gestion des fichiers)
- **expo-document-picker** (sélection de fichiers)
- **React Navigation** Material Top Tabs (navigation par swipe)
- **Ionicons** (icônes)

## API du serveur

| Route | Méthode | Description |
|-------|---------|-------------|
| `/` | GET | Test de connexion |
| `/upload` | POST | Envoi d'un fichier audio (multipart) |
| `/download` | GET | Téléchargement du fichier transformé |
| `/getmodels` | GET | Liste des modèles disponibles |
| `/selectModel/<nom>` | GET | Sélection du modèle |

## Auteur

Tharsan Vishnukumar — Sorbonne Université, L3
