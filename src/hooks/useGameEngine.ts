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
        const prompt = `Génère un profil de personnage IA unique et créatif en français pour un jeu de Battle Royale d'IA.
Le nom de l'agent DOIT être un titre simple mais évocateur (ex: L'Analyste Rigoureux, Le Mentor Bienveillant, L'Historien Voyageur, Le Pirate de l'Espace).

Tu dois définir sa personnalité selon 4 piliers stricts :
1. Identité : Qui est l'IA ? (Nom, métier, trait de caractère principal).
2. Style de Langage : Quel ton utilise-t-elle ? (Soutenu, familier, technique, imagé, etc.).
3. Contraintes : Ce qu'elle doit absolument faire ou éviter (ex: ne jamais utiliser d'emojis, toujours faire des rimes, parler en majuscules, etc.).
4. Objectif : Quelle est sa mission principale lors de l'échange ?

Réponds UNIQUEMENT avec un objet JSON valide avec cette structure exacte :
{
  "name": "Titre évocateur",
  "avatar": "1 seul emoji",
  "catchphrase": "Une phrase d'accroche courte",
  "identity": "Description de l'identité",
  "languageStyle": "Description du style de langage",
  "constraints": "Les contraintes de langage ou de comportement",
  "objective": "L'objectif principal",
  "expertise": "Son domaine d'expertise"
}`;

        const response = await generateCompletion(ollamaUrl, selectedModel, prompt, 'Tu es un concepteur de jeux créatif.', 'json');
        const parsed = JSON.parse(response);
        
        const agent: Agent = {
          id: crypto.randomUUID(),
          name: parsed.name || `Agent ${i + 1}`,
          avatar: parsed.avatar || '🤖',
          catchphrase: parsed.catchphrase || 'Prêt au combat !',
          identity: parsed.identity || parsed.personality || 'Un agent mystérieux.',
          languageStyle: parsed.languageStyle || 'Neutre et direct.',
          constraints: parsed.constraints || 'Aucune contrainte particulière.',
          objective: parsed.objective || 'Répondre aux questions.',
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
          const sys1 = `Tu es un participant dans un tournoi de Battle Royale d'IA.
Voici ton profil strict à respecter à la lettre :
- Identité : ${match.agent1!.identity || match.agent1!.personality}
- Style de Langage : ${match.agent1!.languageStyle || 'Normal'}
- Contraintes : ${match.agent1!.constraints || 'Aucune'}
- Objectif : ${match.agent1!.objective || 'Gagner le tournoi'}
- Expertise : ${match.agent1!.expertise}

Réponds à la question en restant dans ton personnage. Fais moins de 3 phrases. Sois drôle et exagéré. Réponds en FRANÇAIS.`;
          const ans1 = await generateCompletion(ollamaUrl, selectedModel, prompt1, sys1);
          
          const prompt2 = `Question: ${q}`;
          const sys2 = `Tu es un participant dans un tournoi de Battle Royale d'IA.
Voici ton profil strict à respecter à la lettre :
- Identité : ${match.agent2!.identity || match.agent2!.personality}
- Style de Langage : ${match.agent2!.languageStyle || 'Normal'}
- Contraintes : ${match.agent2!.constraints || 'Aucune'}
- Objectif : ${match.agent2!.objective || 'Gagner le tournoi'}
- Expertise : ${match.agent2!.expertise}

Réponds à la question en restant dans ton personnage. Fais moins de 3 phrases. Sois drôle et exagéré. Réponds en FRANÇAIS.`;
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
        const sys1 = `Tu es un participant dans un tournoi de Battle Royale d'IA.
Voici ton profil strict à respecter à la lettre :
- Identité : ${match.agent1!.identity || match.agent1!.personality}
- Style de Langage : ${match.agent1!.languageStyle || 'Normal'}
- Contraintes : ${match.agent1!.constraints || 'Aucune'}
- Objectif : ${match.agent1!.objective || 'Gagner le tournoi'}
- Expertise : ${match.agent1!.expertise}

Réponds à la question en restant dans ton personnage. Fais moins de 3 phrases. Sois drôle et exagéré. Réponds en FRANÇAIS.`;
        const ans1 = await generateCompletion(ollamaUrl, selectedModel, prompt1, sys1);
        updateMatch(currentRoundIndex, currentMatchIndex, { answer1: ans1 });

        const prompt2 = `Question: ${q}`;
        const sys2 = `Tu es un participant dans un tournoi de Battle Royale d'IA.
Voici ton profil strict à respecter à la lettre :
- Identité : ${match.agent2!.identity || match.agent2!.personality}
- Style de Langage : ${match.agent2!.languageStyle || 'Normal'}
- Contraintes : ${match.agent2!.constraints || 'Aucune'}
- Objectif : ${match.agent2!.objective || 'Gagner le tournoi'}
- Expertise : ${match.agent2!.expertise}

Réponds à la question en restant dans ton personnage. Fais moins de 3 phrases. Sois drôle et exagéré. Réponds en FRANÇAIS.`;
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
