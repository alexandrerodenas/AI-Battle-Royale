export interface Agent {
  id: string;
  name: string;
  avatar: string;
  catchphrase?: string;
  personality?: string; // Kept for backward compatibility with old favorites
  identity: string;
  languageStyle: string;
  constraints: string;
  objective: string;
  expertise: string;
  wins: number;
  losses: number;
  isFavorite?: boolean;
}

export interface Match {
  id: string;
  agent1: Agent | null;
  agent2: Agent | null;
  winner: Agent | null;
  status: 'pending' | 'active' | 'completed';
  question?: string;
  answer1?: string;
  answer2?: string;
  refereeJustification?: string;
  isFinal?: boolean;
  finalQuestions?: string[];
  finalAnswers?: { q: string; a1: string; a2: string; just: string; winnerId: string }[];
}

export interface Round {
  id: string;
  name: string;
  matches: Match[];
}
