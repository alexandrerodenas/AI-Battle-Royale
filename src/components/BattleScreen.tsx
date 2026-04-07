import { Match, Round } from '../types';
import { motion } from 'motion/react';
import { ChevronRight, Trophy, Gavel } from 'lucide-react';

export default function BattleScreen({ engine }: { engine: any }) {
  const currentRound = engine.bracket[engine.currentRoundIndex];
  const activeMatch = currentRound.matches[engine.currentMatchIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Bracket / Round Overview */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit sticky top-24">
        <h3 className="text-xl font-black uppercase tracking-tight text-fuchsia-400 border-b border-slate-800 pb-4">
          {currentRound.name}
        </h3>
        <div className="space-y-3">
          {currentRound.matches.map((match: Match, idx: number) => {
            const isActive = idx === engine.currentMatchIndex;
            const isPast = idx < engine.currentMatchIndex;
            return (
              <div 
                key={match.id} 
                className={`p-3 rounded-lg border ${isActive ? 'bg-fuchsia-900/20 border-fuchsia-500' : isPast ? 'bg-slate-950 border-slate-800 opacity-50' : 'bg-slate-950 border-slate-800'}`}
              >
                <div className="flex justify-between items-center text-sm">
                  <span className={`truncate ${match.winner?.id === match.agent1?.id ? 'text-green-400 font-bold' : ''}`}>
                    {match.agent1?.avatar} {match.agent1?.name || '???'}
                  </span>
                  <span className="text-slate-600 font-bold text-xs mx-2">VS</span>
                  <span className={`truncate text-right ${match.winner?.id === match.agent2?.id ? 'text-green-400 font-bold' : ''}`}>
                    {match.agent2?.name || '???'} {match.agent2?.avatar}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Match Area */}
      <div className="lg:col-span-2 space-y-6">
        {activeMatch && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Match en Cours</h2>
              {!activeMatch.isFinal && <p className="text-xl font-medium text-cyan-300 italic">"{activeMatch.question}"</p>}
              {activeMatch.isFinal && <p className="text-xl font-medium text-fuchsia-300 uppercase tracking-widest">MEILLEUR DES 3</p>}
            </div>

            {/* Final Match Display */}
            {activeMatch.isFinal && activeMatch.finalAnswers && activeMatch.finalAnswers.length > 0 && (
              <div className="space-y-8 mb-8">
                {activeMatch.finalAnswers.map((fa: any, i: number) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-cyan-400 font-bold mb-4">Q{i+1}: {fa.q}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className={`p-3 rounded-lg border ${fa.winnerId === activeMatch.agent1?.id ? 'border-green-500 bg-green-900/10' : 'border-slate-800'}`}>
                        <div className="font-bold mb-1">{activeMatch.agent1?.name}</div>
                        <div className="italic text-slate-300">"{fa.a1}"</div>
                      </div>
                      <div className={`p-3 rounded-lg border ${fa.winnerId === activeMatch.agent2?.id ? 'border-green-500 bg-green-900/10' : 'border-slate-800'}`}>
                        <div className="font-bold mb-1">{activeMatch.agent2?.name}</div>
                        <div className="italic text-slate-300">"{fa.a2}"</div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-fuchsia-300 bg-fuchsia-900/20 p-2 rounded">
                      <span className="font-bold">Arbitre :</span> {fa.just}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Normal Match Display */}
            {!activeMatch.isFinal && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-950 border-2 border-fuchsia-500 rounded-full items-center justify-center font-black text-fuchsia-500 z-10">
                  VS
                </div>

                <div className={`p-6 rounded-xl border ${activeMatch.winner?.id === activeMatch.agent1?.id ? 'bg-green-900/20 border-green-500' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-4">
                    <div className="text-5xl">{activeMatch.agent1?.avatar}</div>
                    <div>
                      <h3 className="font-bold text-lg">{activeMatch.agent1?.name}</h3>
                      <p className="text-xs text-slate-400">{activeMatch.agent1?.expertise}</p>
                    </div>
                  </div>
                  <div className="min-h-[100px] text-sm text-slate-300 italic">
                    {activeMatch.answer1 ? `"${activeMatch.answer1}"` : engine.isProcessingMatch ? <span className="animate-pulse">Réfléchit...</span> : ''}
                  </div>
                </div>

                <div className={`p-6 rounded-xl border ${activeMatch.winner?.id === activeMatch.agent2?.id ? 'bg-green-900/20 border-green-500' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-4">
                    <div className="text-5xl">{activeMatch.agent2?.avatar}</div>
                    <div>
                      <h3 className="font-bold text-lg">{activeMatch.agent2?.name}</h3>
                      <p className="text-xs text-slate-400">{activeMatch.agent2?.expertise}</p>
                    </div>
                  </div>
                  <div className="min-h-[100px] text-sm text-slate-300 italic">
                    {activeMatch.answer2 ? `"${activeMatch.answer2}"` : (engine.isProcessingMatch && activeMatch.answer1) ? <span className="animate-pulse">Réfléchit...</span> : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Referee Verdict */}
            {activeMatch.status === 'completed' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-fuchsia-900/10 border border-fuchsia-500/30 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-3 text-fuchsia-400 font-bold uppercase tracking-wider">
                  <Gavel className="w-5 h-5" /> Verdict de l'Arbitre
                </div>
                <p className="text-slate-200">{activeMatch.refereeJustification}</p>
                <div className="mt-4 flex items-center gap-2 text-green-400 font-black text-lg">
                  <Trophy className="w-6 h-6" />
                  {activeMatch.winner?.name} GAGNE !
                </div>
              </motion.div>
            )}

            {/* Next Button */}
            {activeMatch.status === 'completed' && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={engine.advanceToNextMatch}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
                >
                  {activeMatch.isFinal ? "Terminer le Tournoi" : "Match Suivant"} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {engine.isProcessingMatch && (
              <div className="mt-8 text-center text-slate-500 animate-pulse font-mono text-sm">
                En attente des réponses de l'IA...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
