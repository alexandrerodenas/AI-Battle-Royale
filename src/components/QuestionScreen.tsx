import { useState } from 'react';
import { MessageSquare, Play } from 'lucide-react';

export default function QuestionScreen({ engine }: { engine: any }) {
  const isFinal = engine.currentRoundIndex === 3;
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');

  const handleSubmit = () => {
    if (isFinal) {
      if (q1 && q2 && q3) engine.submitQuestions([q1, q2, q3]);
    } else {
      if (q1) engine.submitQuestions([q1]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl shadow-cyan-900/20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tight text-cyan-400">
          {engine.bracket[engine.currentRoundIndex].name}
        </h2>
        <p className="text-slate-400">
          {isFinal ? "The Grand Finale! Enter 3 questions to decide the ultimate champion." : "Enter the question for this round."}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <MessageSquare className="absolute left-4 top-4 w-6 h-6 text-slate-500" />
            <textarea
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              placeholder="e.g., How would you solve world hunger using only cheese?"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-4 py-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium min-h-[120px] resize-none"
            />
          </div>
          
          {isFinal && (
            <>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-6 h-6 text-slate-500" />
                <textarea
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  placeholder="Question 2..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-4 py-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium min-h-[120px] resize-none"
                />
              </div>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-6 h-6 text-slate-500" />
                <textarea
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  placeholder="Question 3..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-4 py-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium min-h-[120px] resize-none"
                />
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isFinal ? (!q1 || !q2 || !q3) : !q1}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6" />
          Let the Battles Begin
        </button>
      </div>
    </div>
  );
}
