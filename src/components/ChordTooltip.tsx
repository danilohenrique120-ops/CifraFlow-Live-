import React from 'react';
import { CHORD_DIAGRAMS, getChordDiagram } from '../utils/chordEngine';
import { X, Volume2 } from 'lucide-react';

interface ChordModalProps {
  chord: string | null;
  onClose: () => void;
}

export const ChordModal: React.FC<ChordModalProps> = ({ chord, onClose }) => {
  if (!chord) return null;

  const diagram = getChordDiagram(chord);

  // Play simple synth sound for the chord notes using Web Audio
  const playChordAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const noteFrequencies: Record<string, number> = {
        'C': 261.63, 'C#': 277.18, 'Db': 277.18,
        'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
        'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
        'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
        'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
        'B': 493.88
      };

      const notesToPlay = diagram?.keyboardNotes || [chord.replace(/[^A-G#b]/g, '')];

      notesToPlay.forEach((noteName, index) => {
        const cleanNote = noteName.replace(/[0-9]/g, '');
        const freq = (noteFrequencies[cleanNote] || 440) * (index === 0 ? 0.5 : 1);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + index * 0.04);
        osc.stop(ctx.currentTime + 1.3);
      });
    } catch (e) {
      console.warn('Web Audio error', e);
    }
  };

  const parseGuitarFrets = (fretStr?: string) => {
    if (!fretStr) return ['x', 'x', 'x', 'x', 'x', 'x'];
    return fretStr.split(' ');
  };

  const frets = parseGuitarFrets(diagram?.guitarFrets);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/80 p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between pr-8 mb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Dicionário de Acordes</span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{chord}</h3>
          </div>
          <button
            onClick={playChordAudio}
            title="Ouvir Acorde"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition text-sm font-medium"
          >
            <Volume2 className="w-4 h-4" />
            Ouvir
          </button>
        </div>

        {/* Guitar diagram visualizer */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 mb-4 flex flex-col items-center">
          <span className="text-xs font-semibold text-zinc-400 mb-3">Diagrama para Violão / Guitarra</span>
          
          <div className="relative w-40 h-44 border-t-4 border-amber-200/90 border-b border-zinc-700 mx-auto grid grid-cols-5 relative">
            {/* Vertical strings */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-[1.5px] h-full bg-zinc-600" />
              ))}
            </div>

            {/* Horizontal frets */}
            {[...Array(4)].map((_, fIdx) => (
              <div key={fIdx} className="col-span-5 border-b border-zinc-700/80 h-10 relative">
                <span className="absolute -left-5 top-2 text-[10px] text-zinc-500 font-mono">{fIdx + 1}ª</span>
              </div>
            ))}

            {/* Finger / Mute markers */}
            <div className="absolute -top-6 inset-x-0 flex justify-between px-0.5 text-xs font-bold font-mono">
              {frets.map((fret, sIdx) => (
                <span
                  key={sIdx}
                  className={`w-3 text-center ${
                    fret === 'x' ? 'text-rose-400' : fret === '0' ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  {fret}
                </span>
              ))}
            </div>

            {/* Finger dots on the fretboard */}
            {frets.map((fret, sIdx) => {
              const fretNum = parseInt(fret, 10);
              if (isNaN(fretNum) || fretNum <= 0 || fretNum > 4) return null;
              
              const leftPercent = (sIdx / 5) * 100;
              const topPx = (fretNum - 0.5) * 40;

              return (
                <div
                  key={sIdx}
                  style={{ left: `calc(${leftPercent}% - 7px)`, top: `${topPx - 7}px` }}
                  className="absolute w-4 h-4 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50 border-2 border-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-950"
                >
                  ●
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between w-40 text-[10px] text-zinc-500 font-mono mt-2">
            <span>E</span>
            <span>A</span>
            <span>D</span>
            <span>G</span>
            <span>B</span>
            <span>e</span>
          </div>
        </div>

        {/* Keyboard notes */}
        {diagram?.keyboardNotes && (
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
            <span className="text-xs text-zinc-400 block mb-1 font-medium">Notas do Acorde (Teclado / Voz):</span>
            <div className="flex flex-wrap gap-1.5">
              {diagram.keyboardNotes.map((note, i) => (
                <span key={i} className="px-2.5 py-1 rounded bg-zinc-800 text-emerald-300 font-mono text-xs font-bold border border-zinc-700">
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
