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
        const prompt = `Generate 1 unique, funny, and highly exaggerated AI agent persona for a battle royale game.
Return ONLY a JSON object. Do not wrap it in an array.
Example format:
{
  "name": "Sir Computes-a-Lot",
  "avatar": "🤖",
  "personality": "Pompous and overly literal",
  "expertise": "18th-century French cheese making"
}`;

        const response = await generateCompletion(ollamaUrl, selectedModel, prompt, 'You are a creative game designer.', 'json');
        const parsed = JSON.parse(response);
        
        const agent: Agent = {
          id: crypto.randomUUID(),
          name: parsed.name || `Agent ${i + 1}`,
          avatar: parsed.avatar || '🤖',
          personality: parsed.personality || 'Mysterious',
          expertise: parsed.expertise || 'Everything',
          wins: 0,
          losses: 0,
        };
        
        newAgents.push(agent);
        setAgents([...newAgents]);
      } catch (e: any) {
        console.error("Failed to generate agent", i, e);
        newAgents.push({
          id: crypto.randomUUID(),
          name: `Glitchy Agent ${i + 1}`,
          avatar: '👾',
          personality: 'Corrupted data stream',
          expertise: 'Crashing the matrix',
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
      setError("Need exactly 16 agents to start.");
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
      { id: 'r1', name: 'Round of 16', matches: roundOf16 },
      { id: 'r2', name: 'Quarterfinals', matches: Array(4).fill(null).map(() => ({ id: crypto.randomUUID(), agent1: null, agent2: null, winner: null, status: 'pending' })) },
      { id: 'r3', name: 'Semifinals', matches: Array(2).fill(null).map(() => ({ id: crypto.randomUUID(), agent1: null, agent2: null, winner: null, status: 'pending' })) },
      { id: 'r4', name: 'Finals', matches: [{ id: crypto.randomUUID(), agent1: null, agent2: null, winner: null, status: 'pending', isFinal: true, finalQuestions: [], finalAnswers: [] }] },
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
          const sys1 = `You are ${match.agent1!.name}. Your personality is: ${match.agent1!.personality}. Your expertise is: ${match.agent1!.expertise}. Answer the question in character. Keep it under 3 sentences. Be funny and exaggerated.`;
          const ans1 = await generateCompletion(ollamaUrl, selectedModel, prompt1, sys1);
          
          const prompt2 = `Question: ${q}`;
          const sys2 = `You are ${match.agent2!.name}. Your personality is: ${match.agent2!.personality}. Your expertise is: ${match.agent2!.expertise}. Answer the question in character. Keep it under 3 sentences. Be funny and exaggerated.`;
          const ans2 = await generateCompletion(ollamaUrl, selectedModel, prompt2, sys2);
          
          const refPrompt = `Question: ${q}\n\nAgent 1 (${match.agent1!.name}) Answer:\n${ans1}\n\nAgent 2 (${match.agent2!.name}) Answer:\n${ans2}`;
          const refSys = `You are the ultimate, impartial, but highly entertaining AI Referee of a Battle Royale.
Your job is to judge two answers to a question and decide the winner based on creativity, humor, and adherence to their persona.
Return ONLY a JSON object with:
- "winner": 1 or 2 (number)
- "justification": A short, punchy explanation of why they won.`;
          
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
          refereeJustification: `Final Score: ${match.agent1!.name} ${score1} - ${score2} ${match.agent2!.name}. ${winner.name} wins the Battle Royale!`,
          finalQuestions: questions,
          finalAnswers
        });
        
      } else {
        const q = questions[0];
        const prompt1 = `Question: ${q}`;
        const sys1 = `You are ${match.agent1!.name}. Your personality is: ${match.agent1!.personality}. Your expertise is: ${match.agent1!.expertise}. Answer the question in character. Keep it under 3 sentences. Be funny and exaggerated.`;
        const ans1 = await generateCompletion(ollamaUrl, selectedModel, prompt1, sys1);
        updateMatch(currentRoundIndex, currentMatchIndex, { answer1: ans1 });

        const prompt2 = `Question: ${q}`;
        const sys2 = `You are ${match.agent2!.name}. Your personality is: ${match.agent2!.personality}. Your expertise is: ${match.agent2!.expertise}. Answer the question in character. Keep it under 3 sentences. Be funny and exaggerated.`;
        const ans2 = await generateCompletion(ollamaUrl, selectedModel, prompt2, sys2);
        updateMatch(currentRoundIndex, currentMatchIndex, { answer2: ans2 });

        const refPrompt = `Question: ${q}\n\nAgent 1 (${match.agent1!.name}) Answer:\n${ans1}\n\nAgent 2 (${match.agent2!.name}) Answer:\n${ans2}`;
        const refSys = `You are the ultimate, impartial, but highly entertaining AI Referee of a Battle Royale.
Your job is to judge two answers to a question and decide the winner based on creativity, humor, and adherence to their persona.
Return ONLY a JSON object with:
- "winner": 1 or 2 (number)
- "justification": A short, punchy explanation of why they won.`;
        
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
      setError("Error during match: " + e.message);
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
