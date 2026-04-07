import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, RotateCcw } from 'lucide-react';

export default function GameOverScreen({ engine }: { engine: any }) {
  const finalMatch = engine.bracket[3].matches[0];
  const winner = finalMatch.winner;

  useEffect(() => {
    if (winner) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [winner]);

  if (!winner) return null;

  return (
    <div className="max-w-3xl mx-auto mt-12 text-center space-y-8">
      <div className="space-y-4">
        <Trophy className="w-24 h-24 text-yellow-400 mx-auto animate-bounce" />
        <h1 className="text-6xl font-black uppercase tracking-tighter bg-gradient-to-r from-yellow-400 to-fuchsia-500 bg-clip-text text-transparent">
          CHAMPION
        </h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl shadow-yellow-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-fuchsia-500/10"></div>
        <div className="relative z-10">
          <div className="text-8xl mb-6">{winner.avatar}</div>
          <h2 className="text-4xl font-bold mb-2">{winner.name}</h2>
          
          {winner.catchphrase && (
            <div className="mb-6 inline-block bg-fuchsia-900/30 text-fuchsia-300 text-sm uppercase tracking-wider font-bold px-4 py-1.5 rounded-full border border-fuchsia-500/30">
              "{winner.catchphrase}"
            </div>
          )}

          <div className="text-sm text-slate-300 mb-8 space-y-2 max-w-xl mx-auto text-left bg-slate-950/50 p-6 rounded-xl border border-slate-800">
            <div><span className="font-bold text-cyan-400">Identité :</span> {winner.identity || winner.personality}</div>
            {winner.languageStyle && <div><span className="font-bold text-cyan-400">Style :</span> {winner.languageStyle}</div>}
            {winner.constraints && <div><span className="font-bold text-cyan-400">Contraintes :</span> {winner.constraints}</div>}
            {winner.objective && <div><span className="font-bold text-cyan-400">Objectif :</span> {winner.objective}</div>}
          </div>
          
          <div className="flex justify-center gap-8 text-sm font-mono text-cyan-400 mb-8">
            <div>Victoires : {winner.wins}</div>
            <div>Défaites : {winner.losses}</div>
            <div>Expertise : {winner.expertise}</div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => engine.saveFavorite(winner)}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all shadow-lg shadow-yellow-900/50 flex items-center justify-center gap-3"
            >
              <Star className="w-6 h-6" />
              Sauvegarder en Favori
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-6 h-6" />
              Rejouer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
