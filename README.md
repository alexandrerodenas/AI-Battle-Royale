# ⚔️ AI Battle Royale

Un jeu de survie épique où des agents pilotés par intelligence artificielle s'affrontent jusqu'au dernier survivant. 

## 🚀 À propos

**AI Battle Royale** est une application web interactive qui permet de générer des personnages (agents) dotés de personnalités uniques grâce à l'IA, puis de les faire s'affronter lors de rounds de questions-réponses. Les performances et les réponses de chaque agent déterminent leur survie dans l'arène.

## ✨ Fonctionnalités

- **Génération d'Agents** : Créez automatiquement une escouade d'agents avec des noms, des descriptions et des styles de combat uniques.
- **Support Multi-LLM** : Compatible avec plusieurs moteurs d'IA :
  - **Google Gemini** (via API)
  - **WebLLM** (exécution locale dans le navigateur via MLC-AI)
  - **Ollama** (exécution locale sur votre machine)
- **Arène de Combat** : Posez des questions aux agents et regardez-les s'éliminer au fil des rounds.
- **Interface Immersive** : Design moderne avec Tailwind CSS, animations fluides avec Framer Motion et célébrations avec `canvas-confetti`.

## 🛠️ Technologies

- **Frontend** : React 19, Vite, TypeScript
- **Style & Animations** : Tailwind CSS, Framer Motion, Lucide React
- **IA/LLM** :
  - `@google/genai`
  - `@mlc-ai/web-llm` (WebAssembly & WebGPU)
- **Outils** : Node.js, Express

## 📦 Installation

### Prérequis

- **Node.js** (version récente recommandée)
- Une clé API Google Gemini (optionnel, pour utiliser Gemini)
- Ollama installé et en cours d'exécution (optionnel, pour utiliser des modèles locaux via Ollama)

### Étapes

1.  **Cloner le dépôt** :
    ```bash
    git clone <url-du-repo>
    cd AI-Battle-Royale
    ```

2.  **Installer les dépendances** :
    ```bash
    npm install
    ```

3.  **Configurer les variables d'environnement** :
    Créez un fichier `.env` ou `.env.local` à la racine et ajoutez votre clé Gemini :
    ```env
    GEMINI_API_KEY=votre_cle_ici
    ```

4.  **Lancer l'application** :
    ```bash
    npm run dev
    ```

L'application sera accessible sur `http://localhost:3000`.

## 🎮 Utilisation

1.  **Configuration** : Choisissez votre modèle d'IA préféré (Gemini, WebLLM ou Ollama).
2.  **Génération** : Lancez la génération des agents qui participeront à la bataille.
3.  **Le Combat** :
    - Saisissez une question ou un défi pour les agents.
    - Les agents répondent tour à tour.
    - L'IA juge les réponses et élimine les moins convaincants.
4.  **Victoire** : Le dernier agent en lice est sacré champion !

---
Développé avec passion pour explorer les capacités des LLM.
