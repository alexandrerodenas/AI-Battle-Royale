import { useGameEngine } from './hooks/useGameEngine';
import SetupScreen from './components/SetupScreen';
import RosterScreen from './components/RosterScreen';
import QuestionScreen from './components/QuestionScreen';
import BattleScreen from './components/BattleScreen';
import GameOverScreen from './components/GameOverScreen';

export default function App() {
  const engine = useGameEngine();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-fuchsia-500 selection:text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
            AI BATTLE ROYALE
          </h1>
          <div className="text-sm font-mono text-slate-400">
            {engine.gameState !== 'setup' && engine.selectedModel && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {engine.selectedModel}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {engine.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 font-mono text-sm">
            ERROR: {engine.error}
          </div>
        )}

        {engine.gameState === 'setup' && <SetupScreen engine={engine} />}
        {engine.gameState === 'generating_agents' && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold animate-pulse text-fuchsia-400">Summoning Agents from the Void...</h2>
          </div>
        )}
        {engine.gameState === 'roster' && <RosterScreen engine={engine} />}
        {engine.gameState === 'question_input' && <QuestionScreen engine={engine} />}
        {engine.gameState === 'battling' && <BattleScreen engine={engine} />}
        {engine.gameState === 'game_over' && <GameOverScreen engine={engine} />}
      </main>
    </div>
  );
}
