import { useState } from 'react';
import { Agent, Match, Round } from '../types';
import { generateCompletion } from '../services/ollama';

export type GameState = 'setup' | 'generating_agents' | 'roster' | 'question_input' | 'battling' | 'game_over';

export const useGameEngine = () => {
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [selectedModel, setSelectedModel] = useState('');
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

  const generateAgents = async (count: number = 16) => {
    setGameState('generating_agents');
    setAgents([]);
    setError(null);
    setIsGenerating(true);

    const newAgents: Agent[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const prompt = `Génère 1 persona d'agent IA unique, drôle et très exagéré pour un jeu de battle royale.
Réponds UNIQUEMENT avec un objet JSON. Ne l'enveloppe pas dans un tableau. Les valeurs doivent être en FRANÇAIS.
Exemple de format :
{
  "name": "Monsieur Calcule-Tout",
  "avatar": "🤖",
  "personality": "Pompeux et prend tout au pied de la lettre",
  "expertise": "Fabrication de fromage français du 18ème siècle"
}`;

        const response = await generateCompletion(ollamaUrl, selectedModel, prompt, 'Tu es un concepteur de jeux créatif.', 'json');
        const parsed = JSON.parse(response);
        
        const agent: Agent = {
          id: crypto.randomUUID(),
          name: parsed.name || `Agent ${i + 1}`,
          avatar: parsed.avatar || '🤖',
          personality: parsed.personality || 'Mystérieux',
          expertise: parsed.expertise || 'Tout et n\'importe quoi',
          wins: 0,
          losses: 0,
        };
        
        newAgents.push(agent);
        setAgents([...newAgents]);
      } catch (e: any) {
        console.error("Failed to generate agent", i, e);
        newAgents.push({
          id: crypto.randomUUID(),
          name: `Agent Buggé ${i + 1}`,
          avatar: '👾',
          personality: 'Flux de données corrompu',
          expertise: 'Faire planter la matrice',
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
    playNextMatch(questions);
  };

  const playNextMatch = async (questions: string[]) => {
    setIsProcessingMatch(true);
    const round = bracket[currentRoundIndex];
    const match = round.matches[currentMatchIndex];
    
    updateMatch(currentRoundIndex, currentMatchIndex, { status: 'active', question: questions[0] });

    try {
      if (match.isFinal) {
        let score1 = 0;
        let score2 = 0;
        const finalAnswers = [];
        
        for (let i = 0; i < 3; i++) {
          const q = questions[i];
          const prompt1 = `Question: ${q}`;
          const sys1 = `Tu es ${match.agent1!.name}. Ta personnalité est : ${match.agent1!.personality}. Ton expertise est : ${match.agent1!.expertise}. Réponds à la question en restant dans ton personnage. Fais moins de 3 phrases. Sois drôle et exagéré. Réponds en FRANÇAIS.`;
          const ans1 = await generateCompletion(ollamaUrl, selectedModel, prompt1, sys1);
          
          const prompt2 = `Question: ${q}`;
          const sys2 = `Tu es ${match.agent2!.name}. Ta personnalité est : ${match.agent2!.personality}. Ton expertise est : ${match.agent2!.expertise}. Réponds à la question en restant dans ton personnage. Fais moins de 3 phrases. Sois drôle et exagéré. Réponds en FRANÇAIS.`;
          const ans2 = await generateCompletion(ollamaUrl, selectedModel, prompt2, sys2);
          
          const refPrompt = `Question: ${q}\n\nRéponse de l'Agent 1 (${match.agent1!.name}) :\n${ans1}\n\nRéponse de l'Agent 2 (${match.agent2!.name}) :\n${ans2}`;
          const refSys = `Tu es l'Arbitre IA ultime, impartial mais très divertissant d'un Battle Royale.
Ton travail est de juger deux réponses à une question et de décider du gagnant en fonction de la créativité, de l'humour et du respect de leur persona.
Réponds UNIQUEMENT avec un objet JSON en FRANÇAIS avec :
- "winner": 1 ou 2 (nombre)
- "justification": Une explication courte et percutante de pourquoi il a gagné.`;
          
          const refRes = await generateCompletion(ollamaUrl, selectedModel, refPrompt, refSys, 'json');
          const refParsed = JSON.parse(refRes);
          
          if (refParsed.winner === 1) score1++; else score2++;
          
          finalAnswers.push({
            q, a1: ans1, a2: ans2, just: refParsed.justification, winnerId: refParsed.winner === 1 ? match.agent1!.id : match.agent2!.id
          });
          
          updateMatch(currentRoundIndex, currentMatchIndex, { finalAnswers });
        }
        
        const winner = score1 > score2 ? match.agent1! : match.agent2!;
        const loser = score1 > score2 ? match.agent2! : match.agent1!;
        winner.wins += 1;
        loser.losses += 1;
        
        updateMatch(currentRoundIndex, currentMatchIndex, {
          winner,
          status: 'completed',
          refereeJustification: `Score Final : ${match.agent1!.name} ${score1} - ${score2} ${match.agent2!.name}. ${winner.name} remporte le Battle Royale !`,
          finalQuestions: questions,
          finalAnswers
        });
        
      } else {
        const q = questions[0];
        const prompt1 = `Question: ${q}`;
        const sys1 = `Tu es ${match.agent1!.name}. Ta personnalité est : ${match.agent1!.personality}. Ton expertise est : ${match.agent1!.expertise}. Réponds à la question en restant dans ton personnage. Fais moins de 3 phrases. Sois drôle et exagéré. Réponds en FRANÇAIS.`;
        const ans1 = await generateCompletion(ollamaUrl, selectedModel, prompt1, sys1);
        updateMatch(currentRoundIndex, currentMatchIndex, { answer1: ans1 });

        const prompt2 = `Question: ${q}`;
        const sys2 = `Tu es ${match.agent2!.name}. Ta personnalité est : ${match.agent2!.personality}. Ton expertise est : ${match.agent2!.expertise}. Réponds à la question en restant dans ton personnage. Fais moins de 3 phrases. Sois drôle et exagéré. Réponds en FRANÇAIS.`;
        const ans2 = await generateCompletion(ollamaUrl, selectedModel, prompt2, sys2);
        updateMatch(currentRoundIndex, currentMatchIndex, { answer2: ans2 });

        const refPrompt = `Question: ${q}\n\nRéponse de l'Agent 1 (${match.agent1!.name}) :\n${ans1}\n\nRéponse de l'Agent 2 (${match.agent2!.name}) :\n${ans2}`;
        const refSys = `Tu es l'Arbitre IA ultime, impartial mais très divertissant d'un Battle Royale.
Ton travail est de juger deux réponses à une question et de décider du gagnant en fonction de la créativité, de l'humour et du respect de leur persona.
Réponds UNIQUEMENT avec un objet JSON en FRANÇAIS avec :
- "winner": 1 ou 2 (nombre)
- "justification": Une explication courte et percutante de pourquoi il a gagné.`;
        
        const refRes = await generateCompletion(ollamaUrl, selectedModel, refPrompt, refSys, 'json');
        const refParsed = JSON.parse(refRes);
        
        const winner = refParsed.winner === 1 ? match.agent1! : match.agent2!;
        const loser = refParsed.winner === 1 ? match.agent2! : match.agent1!;
        winner.wins += 1;
        loser.losses += 1;

        updateMatch(currentRoundIndex, currentMatchIndex, {
          winner,
          refereeJustification: refParsed.justification,
          status: 'completed'
        });

        if (currentRoundIndex < bracket.length - 1) {
          const nextRound = bracket[currentRoundIndex + 1];
          const nextMatchIndex = Math.floor(currentMatchIndex / 2);
          const isAgent1 = currentMatchIndex % 2 === 0;
          
          const nextMatch = { ...nextRound.matches[nextMatchIndex] };
          if (isAgent1) nextMatch.agent1 = winner;
          else nextMatch.agent2 = winner;
          
          updateMatch(currentRoundIndex + 1, nextMatchIndex, nextMatch);
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
      setCurrentMatchIndex(currentMatchIndex + 1);
      playNextMatch(currentQuestions);
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
    ollamaUrl, setOllamaUrl,
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
