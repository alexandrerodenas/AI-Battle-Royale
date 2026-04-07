import { Match, Round } from '../types';
import { motion } from 'motion/react';
import { ChevronRight, Trophy, Gavel } from 'lucide-react';

export default function BattleScreen({ engine }: { engine: any }) {
  const currentRound = engine.bracket[engine.currentRoundIndex];
  const activeMatch = currentRound.matches[engine.currentMatchIndex];

  return (
    <div className="flex flex-col gap-8">
      {/* Bracket / Round Overview (Top, Full Width) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto shadow-2xl">
        <h2 className="text-2xl font-black uppercase tracking-widest text-fuchsia-400 mb-6 text-center">Arbre du Tournoi</h2>
        <div className="flex justify-between gap-8 min-w-[800px]">
          {engine.bracket.map((round: Round, rIdx: number) => (
            <div key={round.id} className="flex flex-col justify-around gap-4 flex-1">
              <h4 className="text-center text-slate-500 font-bold text-sm uppercase tracking-widest mb-2">{round.name}</h4>
              {round.matches.map((match: Match, mIdx: number) => {
                const isActive = rIdx === engine.currentRoundIndex && mIdx === engine.currentMatchIndex;
                const isPast = rIdx < engine.currentRoundIndex || (rIdx === engine.currentRoundIndex && mIdx < engine.currentMatchIndex);
                
                return (
                  <div 
                    key={match.id} 
                    className={`p-2 rounded-lg border relative transition-all ${
                      isActive 
                        ? 'border-fuchsia-500 bg-fuchsia-900/30 shadow-[0_0_15px_rgba(217,70,239,0.5)] scale-105 z-10' 
                        : isPast 
                          ? 'border-slate-700 bg-slate-800/50 opacity-70' 
                          : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    <div className={`flex justify-between items-center text-xs p-1.5 border-b border-slate-800/50 ${match.winner?.id === match.agent1?.id ? 'text-green-400 font-bold' : 'text-slate-300'}`}>
                      <span className="truncate max-w-[100px]" title={match.agent1?.name}>{match.agent1?.name || '???'}</span>
                      <span className="text-lg">{match.agent1?.avatar}</span>
                    </div>
                    <div className={`flex justify-between items-center text-xs p-1.5 ${match.winner?.id === match.agent2?.id ? 'text-green-400 font-bold' : 'text-slate-300'}`}>
                      <span className="truncate max-w-[100px]" title={match.agent2?.name}>{match.agent2?.name || '???'}</span>
                      <span className="text-lg">{match.agent2?.avatar}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Active Match Area (Bottom, Centered) */}
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {activeMatch && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Détail de l'Affrontement</h2>
              {!activeMatch.isFinal && <p className="text-lg font-medium text-cyan-300 italic">"{activeMatch.question}"</p>}
              {activeMatch.isFinal && <p className="text-lg font-medium text-fuchsia-300 uppercase tracking-widest">MEILLEUR DES 3</p>}
            </div>

            {/* Final Match Display */}
            {activeMatch.isFinal && activeMatch.finalAnswers && activeMatch.finalAnswers.length > 0 && (
              <div className="space-y-6 mb-6">
                {activeMatch.finalAnswers.map((fa: any, i: number) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-cyan-400 font-bold mb-3 text-sm">Q{i+1}: {fa.q}</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className={`p-3 rounded-lg border ${fa.winnerId === activeMatch.agent1?.id ? 'border-green-500 bg-green-900/10' : 'border-slate-800'}`}>
                        <div className="font-bold mb-1 flex items-center gap-2">{activeMatch.agent1?.avatar} {activeMatch.agent1?.name}</div>
                        <div className="italic text-slate-300">"{fa.a1}"</div>
                      </div>
                      <div className={`p-3 rounded-lg border ${fa.winnerId === activeMatch.agent2?.id ? 'border-green-500 bg-green-900/10' : 'border-slate-800'}`}>
                        <div className="font-bold mb-1 flex items-center gap-2">{activeMatch.agent2?.avatar} {activeMatch.agent2?.name}</div>
                        <div className="italic text-slate-300">"{fa.a2}"</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-fuchsia-300 bg-fuchsia-900/20 p-2 rounded">
                      <span className="font-bold">Arbitre :</span> {fa.just}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Normal Match Display */}
            {!activeMatch.isFinal && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950 border-2 border-fuchsia-500 rounded-full items-center justify-center font-black text-fuchsia-500 z-10 text-sm">
                  VS
                </div>

                <div className={`p-4 rounded-xl border relative group hover:z-50 ${activeMatch.winner?.id === activeMatch.agent1?.id ? 'bg-green-900/20 border-green-500' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center gap-3 mb-3 border-b border-slate-800 pb-3">
                    <div className="text-4xl">{activeMatch.agent1?.avatar}</div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate">{activeMatch.agent1?.name}</h3>
                      {activeMatch.agent1?.catchphrase && (
                        <span className="inline-block bg-fuchsia-900/30 text-fuchsia-300 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border border-fuchsia-500/30 truncate max-w-full">
                          "{activeMatch.agent1?.catchphrase}"
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-h-[80px] text-xs text-slate-300 italic">
                    {activeMatch.answer1 ? `"${activeMatch.answer1}"` : engine.isProcessingMatch ? <span className="animate-pulse">Réfléchit...</span> : ''}
                  </div>
                  
                  {/* Hover Tooltip for Personality */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-slate-950 text-slate-200 text-xs rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all border border-cyan-500/50 text-left space-y-1.5">
                    <div><span className="font-bold text-cyan-400">Identité :</span> {activeMatch.agent1?.identity || activeMatch.agent1?.personality}</div>
                    {activeMatch.agent1?.languageStyle && <div><span className="font-bold text-cyan-400">Style :</span> {activeMatch.agent1?.languageStyle}</div>}
                    {activeMatch.agent1?.constraints && <div><span className="font-bold text-cyan-400">Contraintes :</span> {activeMatch.agent1?.constraints}</div>}
                    {activeMatch.agent1?.objective && <div><span className="font-bold text-cyan-400">Objectif :</span> {activeMatch.agent1?.objective}</div>}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-b border-r border-cyan-500/50 rotate-45"></div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border relative group hover:z-50 ${activeMatch.winner?.id === activeMatch.agent2?.id ? 'bg-green-900/20 border-green-500' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center gap-3 mb-3 border-b border-slate-800 pb-3">
                    <div className="text-4xl">{activeMatch.agent2?.avatar}</div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate">{activeMatch.agent2?.name}</h3>
                      {activeMatch.agent2?.catchphrase && (
                        <span className="inline-block bg-fuchsia-900/30 text-fuchsia-300 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border border-fuchsia-500/30 truncate max-w-full">
                          "{activeMatch.agent2?.catchphrase}"
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-h-[80px] text-xs text-slate-300 italic">
                    {activeMatch.answer2 ? `"${activeMatch.answer2}"` : (engine.isProcessingMatch && activeMatch.answer1) ? <span className="animate-pulse">Réfléchit...</span> : ''}
                  </div>

                  {/* Hover Tooltip for Personality */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-slate-950 text-slate-200 text-xs rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all border border-cyan-500/50 text-left space-y-1.5">
                    <div><span className="font-bold text-cyan-400">Identité :</span> {activeMatch.agent2?.identity || activeMatch.agent2?.personality}</div>
                    {activeMatch.agent2?.languageStyle && <div><span className="font-bold text-cyan-400">Style :</span> {activeMatch.agent2?.languageStyle}</div>}
                    {activeMatch.agent2?.constraints && <div><span className="font-bold text-cyan-400">Contraintes :</span> {activeMatch.agent2?.constraints}</div>}
                    {activeMatch.agent2?.objective && <div><span className="font-bold text-cyan-400">Objectif :</span> {activeMatch.agent2?.objective}</div>}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-b border-r border-cyan-500/50 rotate-45"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Referee Verdict */}
            {activeMatch.status === 'completed' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-fuchsia-900/10 border border-fuchsia-500/30 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2 text-fuchsia-400 font-bold uppercase tracking-wider text-sm">
                  <Gavel className="w-4 h-4" /> Verdict de l'Arbitre
                </div>
                <p className="text-slate-200 text-sm">{activeMatch.refereeJustification}</p>
                <div className="mt-3 flex items-center gap-2 text-green-400 font-black text-base">
                  <Trophy className="w-5 h-5" />
                  {activeMatch.winner?.name} GAGNE !
                </div>
              </motion.div>
            )}

            {/* Next Button */}
            {activeMatch.status === 'completed' && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={engine.advanceToNextMatch}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm"
                >
                  {activeMatch.isFinal ? "Terminer le Tournoi" : "Match Suivant"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {engine.isProcessingMatch && (
              <div className="mt-6 text-center text-slate-500 animate-pulse font-mono text-xs">
                En attente des réponses de l'IA...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
