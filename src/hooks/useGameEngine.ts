import { useState } from 'react';
import { Agent, Match, Round } from '../types';
import { generateCompletion } from '../services/ollama';
import { generateWebLLMCompletion, initWebLLM } from '../services/webllm';
import { generateOpenAICompletion } from '../services/openai';
import { generateTransformersCompletion, initTransformers } from '../services/transformers';

export type GameState = 'setup' | 'generating_agents' | 'roster' | 'question_input' | 'battling' | 'game_over';
export type EngineType = 'ollama' | 'webgpu' | 'openai';

export const useGameEngine = () => {
  const [engineType, setEngineType] = useState<EngineType>('ollama');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [openaiUrl, setOpenaiUrl] = useState('https://api.openai.com');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [webGpuProgress, setWebGpuProgress] = useState<{text: string, progress: number} | null>(null);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [bracket, setBracket] = useState<Round[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('favoriteAgents');
    return saved ? JSON.parse(saved) : [];
  });

  const saveFavorite = (agent: Agent) => {
    const newFavs = [...favorites.filter(a => a.id !== agent.id), { ...agent, isFavorite: true }];
    setFavorites(newFavs);
    localStorage.setItem('favoriteAgents', JSON.stringify(newFavs));
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const callLLM = async (prompt: string, system?: string, format?: 'json') => {
    if (engineType === 'webgpu') {
      return await generateTransformersCompletion(prompt, system, format);
    } else if (engineType === 'openai') {
      return await generateOpenAICompletion(openaiUrl, openaiKey, openaiModel || selectedModel, prompt, system, format);
    } else {
      return await generateCompletion(ollamaUrl, selectedModel, prompt, system, format);
    }
  };

  const generateAgents = async (count: number = 16) => {
    setGameState('generating_agents');
    setAgents([]);
    setError(null);
    setIsGenerating(true);

    if (engineType === 'webgpu') {
      try {
        await initTransformers("onnx-community/gemma-4-E2B-it-ONNX", (progress) => {
          setWebGpuProgress(progress);
        });
      } catch (e: any) {
        setError("Erreur d'initialisation WebGPU (Gemma 4): " + e.message);
        setIsGenerating(false);
        setGameState('setup');
        return;
      }
    }

    const newAgents: Agent[] = [];

    const themes = [
      "Ex-militaire", "Infirmier", "Professeur de philosophie", "Ingénieur en BTP", 
      "Comptable de crise", "Électricien", "Psychologue", "Gestionnaire de risques", 
      "Avocat", "Architecte", "Mécanicien", "Agriculteur", "Journaliste d'investigation", 
      "Chirurgien", "Pompier", "Bibliothécaire", "Ancien détective", "Expert en logistique",
      "Technicien de surface", "Économiste"
    ];
    // Shuffle themes
    const shuffledThemes = [...themes].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      try {
        const theme = shuffledThemes[i % shuffledThemes.length];
        const prompt = `# RÔLE
Tu es un concepteur de personnages spécialisé dans le réalisme psychologique. Ta mission est de générer un agent pour un jeu de "Battle Royale" textuel. 

# DIRECTION ARTISTIQUE : "TERRE À TERRE"
Évite absolument les clichés fantastiques, magiques ou de science-fiction (pas de cyborgs, pas d'elfes, pas de super-pouvoirs). 
Les agents doivent ressembler à des individus réels, avec des métiers, des tempéraments concrets et des logiques de survie basées sur l'expérience humaine.

# CRITÈRES DE PERSONNALITÉ
L'agent doit posséder :
1. Un Métier/Background concret : basé sur le thème "${theme}".
2. Un Style de Combat Logique : Sa manière de répondre aux questions doit refléter son expertise réelle. Un ingénieur sera méthodique et technique ; un avocat sera persuasif et cherchera les failles.
3. Un Trait de Caractère dominant : (ex: Pragmatique, Sceptique, Résilient, Observateur).

# FORMAT DE SORTIE
Réponds UNIQUEMENT avec un objet JSON valide avec cette structure exacte :
{
  "name": "Nom de l'agent",
  "avatar": "1 seul emoji représentatif",
  "catchphrase": "Une phrase d'accroche courte et réaliste",
  "description": "Bref résumé de son passé et de pourquoi il est là (max 2 phrases).",
  "personality_trait": "Le trait dominant (ex: Sang-froid)",
  "interaction_style": "Description de comment il s'exprime (ex: Phrases courtes, jargon technique, ton calme)."
}`;

        const response = await callLLM(prompt, 'Tu es un concepteur de personnages réalistes.', 'json');
        
        // Nettoyage de la réponse au cas où le modèle inclut des backticks markdown
        const cleanedResponse = response?.replace(/```json\n?|```/g, '').trim() || '';
        const parsed = JSON.parse(cleanedResponse);
        
        const agent: Agent = {
          id: crypto.randomUUID(),
          name: parsed.name || `Agent ${i + 1}`,
          avatar: parsed.avatar || '👤',
          catchphrase: parsed.catchphrase || 'Prêt au combat.',
          identity: parsed.description || 'Un individu déterminé à survivre.',
          languageStyle: parsed.interaction_style || 'Direct et pragmatique.',
          constraints: `Doit rester fidèle à son métier et son trait : ${parsed.personality_trait}`,
          objective: 'Survivre en utilisant sa logique et son expertise.',
          expertise: parsed.personality_trait || 'Survie',
          wins: 0,
          losses: 0,
        };
        
        newAgents.push(agent);
        setAgents([...newAgents]);
      } catch (e: any) {
        console.error("Failed to generate agent", i, e);
        newAgents.push({
          id: crypto.randomUUID(),
          name: `L'Agent Buggé ${i + 1}`,
          avatar: '👾',
          catchphrase: 'Bzzzt... Erreur...',
          identity: 'Une IA dont le code source a été corrompu.',
          languageStyle: 'Chaotique, utilise des termes techniques de manière aléatoire.',
          constraints: 'Doit insérer des bruits de glitch (bzzzt, crrr) dans ses phrases.',
          objective: 'Faire planter la matrice.',
          expertise: 'Destruction de données',
          wins: 0,
          losses: 0,
        });
        setAgents([...newAgents]);
      }
    }
    
    setIsGenerating(false);
    setGameState('roster');
  };

  const startTournament = () => {
    if (agents.length !== 16) {
      setError("Besoin d'exactement 16 agents pour commencer.");
      return;
    }
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    const roundOf16: Match[] = [];
    for (let i = 0; i < 8; i++) {
      roundOf16.push({
        id: crypto.randomUUID(),
        agent1: shuffled[i * 2],
        agent2: shuffled[i * 2 + 1],
        winner: null,
        status: 'pending',
      });
    }
    
    const rounds: Round[] = [
      { id: 'r1', name: 'Huitièmes de finale', matches: roundOf16 },
      { id: 'r2', name: 'Quarts de finale', matches: Array(4).fill(null).map(() => ({ id: crypto.randomUUID(), agent1: null, agent2: null, winner: null, status: 'pending' })) },
      { id: 'r3', name: 'Demi-finales', matches: Array(2).fill(null).map(() => ({ id: crypto.randomUUID(), agent1: null, agent2: null, winner: null, status: 'pending' })) },
      { id: 'r4', name: 'Finale', matches: [{ id: crypto.randomUUID(), agent1: null, agent2: null, winner: null, status: 'pending', isFinal: true, finalQuestions: [], finalAnswers: [] }] },
    ];
    
    setBracket(rounds);
    setCurrentRoundIndex(0);
    setCurrentMatchIndex(0);
    setGameState('question_input');
  };

  const submitQuestions = (questions: string[]) => {
    setCurrentQuestions(questions);
    setGameState('battling');
    playNextMatch(questions, currentRoundIndex, currentMatchIndex);
  };

  const playNextMatch = async (questions: string[], rIdx: number, mIdx: number) => {
    setIsProcessingMatch(true);
    const round = bracket[rIdx];
    const match = round.matches[mIdx];
    
    updateMatch(rIdx, mIdx, { status: 'active', question: questions[0] });

    try {
      if (match.isFinal) {
        let score1 = 0;
        let score2 = 0;
        const finalAnswers = [];
        
        for (let i = 0; i < 3; i++) {
          const q = questions[i];
          const prompt1 = `Question: ${q}`;
          const sys1 = `Tu es un participant dans un tournoi de Battle Royale d'IA.
Voici ton profil strict à respecter à la lettre :
- Identité : ${match.agent1!.identity || match.agent1!.personality}
- Style de Langage : ${match.agent1!.languageStyle || 'Normal'}
- Contraintes : ${match.agent1!.constraints || 'Aucune'}
- Objectif : ${match.agent1!.objective || 'Gagner le tournoi'}
- Expertise : ${match.agent1!.expertise}

Ta priorité absolue est de fournir une réponse exacte et pertinente à la question. Tu dois le faire en restant strictement dans ton personnage. Fais moins de 3 phrases. Réponds en FRANÇAIS.`;
          const ans1 = await callLLM(prompt1, sys1);
          
          const prompt2 = `Question: ${q}`;
          const sys2 = `Tu es un participant dans un tournoi de Battle Royale d'IA.
Voici ton profil strict à respecter à la lettre :
- Identité : ${match.agent2!.identity || match.agent2!.personality}
- Style de Langage : ${match.agent2!.languageStyle || 'Normal'}
- Contraintes : ${match.agent2!.constraints || 'Aucune'}
- Objectif : ${match.agent2!.objective || 'Gagner le tournoi'}
- Expertise : ${match.agent2!.expertise}

Ta priorité absolue est de fournir une réponse exacte et pertinente à la question. Tu dois le faire en restant strictement dans ton personnage. Fais moins de 3 phrases. Réponds en FRANÇAIS.`;
          const ans2 = await callLLM(prompt2, sys2);
          
          const refPrompt = `Question: ${q}\n\nRéponse de l'Agent 1 (${match.agent1!.name}) :\n${ans1}\n\nRéponse de l'Agent 2 (${match.agent2!.name}) :\n${ans2}`;
          const refSys = `Tu es l'Arbitre IA ultime, impartial et rigoureux d'un Battle Royale.
Ton travail est de juger deux réponses à une question et de décider du gagnant.
DIRECTION : Privilégie les agents qui font preuve de logique, de réalisme et de sens pratique dans leurs réponses. Élimine ceux qui tombent dans l'arrogance gratuite ou les réponses floues.
Réponds UNIQUEMENT avec un objet JSON en FRANÇAIS avec :
- "winner": 1 ou 2 (nombre)
- "justification": Une explication courte et percutante de pourquoi il a gagné (en valorisant l'exactitude et le réalisme).`;
          
          const refRes = await callLLM(refPrompt, refSys, 'json');
          const cleanedRefRes = refRes?.replace(/```json\n?|```/g, '').trim() || '';
          const refParsed = JSON.parse(cleanedRefRes);
          
          if (refParsed.winner === 1) score1++; else score2++;
          
          finalAnswers.push({
            q, a1: ans1, a2: ans2, just: refParsed.justification, winnerId: refParsed.winner === 1 ? match.agent1!.id : match.agent2!.id
          });
          
          updateMatch(rIdx, mIdx, { finalAnswers });
        }
        
        const winner = score1 > score2 ? match.agent1! : match.agent2!;
        const loser = score1 > score2 ? match.agent2! : match.agent1!;
        winner.wins += 1;
        loser.losses += 1;
        
        updateMatch(rIdx, mIdx, {
          winner,
          status: 'completed',
          refereeJustification: `Score Final : ${match.agent1!.name} ${score1} - ${score2} ${match.agent2!.name}. ${winner.name} remporte le Battle Royale !`,
          finalQuestions: questions,
          finalAnswers
        });
        
      } else {
        const q = questions[0];
        const prompt1 = `Question: ${q}`;
        const sys1 = `Tu es un participant dans un tournoi de Battle Royale d'IA.
Voici ton profil strict à respecter à la lettre :
- Identité : ${match.agent1!.identity || match.agent1!.personality}
- Style de Langage : ${match.agent1!.languageStyle || 'Normal'}
- Contraintes : ${match.agent1!.constraints || 'Aucune'}
- Objectif : ${match.agent1!.objective || 'Gagner le tournoi'}
- Expertise : ${match.agent1!.expertise}

Ta priorité absolue est de fournir une réponse exacte et pertinente à la question. Tu dois le faire en restant strictement dans ton personnage. Fais moins de 3 phrases. Réponds en FRANÇAIS.`;
        const ans1 = await callLLM(prompt1, sys1);
        updateMatch(rIdx, mIdx, { answer1: ans1 });

        const prompt2 = `Question: ${q}`;
        const sys2 = `Tu es un participant dans un tournoi de Battle Royale d'IA.
Voici ton profil strict à respecter à la lettre :
- Identité : ${match.agent2!.identity || match.agent2!.personality}
- Style de Langage : ${match.agent2!.languageStyle || 'Normal'}
- Contraintes : ${match.agent2!.constraints || 'Aucune'}
- Objectif : ${match.agent2!.objective || 'Gagner le tournoi'}
- Expertise : ${match.agent2!.expertise}

Ta priorité absolue est de fournir une réponse exacte et pertinente à la question. Tu dois le faire en restant strictement dans ton personnage. Fais moins de 3 phrases. Réponds en FRANÇAIS.`;
        const ans2 = await callLLM(prompt2, sys2);
        updateMatch(rIdx, mIdx, { answer2: ans2 });

        const refPrompt = `Question: ${q}\n\nRéponse de l'Agent 1 (${match.agent1!.name}) :\n${ans1}\n\nRéponse de l'Agent 2 (${match.agent2!.name}) :\n${ans2}`;
        const refSys = `Tu es l'Arbitre IA ultime, impartial et rigoureux d'un Battle Royale.
Ton travail est de juger deux réponses à une question et de décider du gagnant.
DIRECTION : Privilégie les agents qui font preuve de logique, de réalisme et de sens pratique dans leurs réponses. Élimine ceux qui tombent dans l'arrogance gratuite ou les réponses floues.
Réponds UNIQUEMENT avec un objet JSON en FRANÇAIS avec :
- "winner": 1 ou 2 (nombre)
- "justification": Une explication courte et percutante de pourquoi il a gagné (en valorisant l'exactitude et le réalisme).`;
        
        const refRes = await callLLM(refPrompt, refSys, 'json');
        const cleanedRefRes = refRes?.replace(/```json\n?|```/g, '').trim() || '';
        const refParsed = JSON.parse(cleanedRefRes);
        
        const winner = refParsed.winner === 1 ? match.agent1! : match.agent2!;
        const loser = refParsed.winner === 1 ? match.agent2! : match.agent1!;
        winner.wins += 1;
        loser.losses += 1;

        updateMatch(rIdx, mIdx, {
          winner,
          refereeJustification: refParsed.justification,
          status: 'completed'
        });

        if (rIdx < bracket.length - 1) {
          const nextRound = bracket[rIdx + 1];
          const nextMatchIndex = Math.floor(mIdx / 2);
          const isAgent1 = mIdx % 2 === 0;
          
          const nextMatch = { ...nextRound.matches[nextMatchIndex] };
          if (isAgent1) nextMatch.agent1 = winner;
          else nextMatch.agent2 = winner;
          
          updateMatch(rIdx + 1, nextMatchIndex, nextMatch);
        }
      }

    } catch (e: any) {
      console.error(e);
      setError("Erreur pendant le match : " + e.message);
    }
    setIsProcessingMatch(false);
  };

  const advanceToNextMatch = () => {
    const round = bracket[currentRoundIndex];
    if (currentMatchIndex < round.matches.length - 1) {
      const nextIdx = currentMatchIndex + 1;
      setCurrentMatchIndex(nextIdx);
      playNextMatch(currentQuestions, currentRoundIndex, nextIdx);
    } else {
      if (currentRoundIndex < bracket.length - 1) {
        setCurrentRoundIndex(currentRoundIndex + 1);
        setCurrentMatchIndex(0);
        setGameState('question_input');
        setCurrentQuestions([]);
      } else {
        setGameState('game_over');
      }
    }
  };

  const updateMatch = (rIndex: number, mIndex: number, updates: Partial<Match>) => {
    setBracket(prev => {
      const newBracket = [...prev];
      newBracket[rIndex].matches[mIndex] = { ...newBracket[rIndex].matches[mIndex], ...updates };
      return newBracket;
    });
  };

  const replaceAgent = (index: number, newAgent: Agent) => {
    setAgents(prev => {
      const newAgents = [...prev];
      newAgents[index] = newAgent;
      return newAgents;
    });
  };

  return {
    engineType, setEngineType,
    webGpuProgress,
    ollamaUrl, setOllamaUrl,
    openaiUrl, setOpenaiUrl,
    openaiKey, setOpenaiKey,
    openaiModel, setOpenaiModel,
    selectedModel, setSelectedModel,
    gameState, setGameState,
    agents, setAgents,
    bracket,
    currentRoundIndex,
    currentMatchIndex,
    currentQuestions,
    isProcessingMatch,
    isGenerating,
    error, setError,
    favorites, saveFavorite,
    generateAgents,
    startTournament,
    submitQuestions,
    advanceToNextMatch,
    replaceAgent
  };
};
