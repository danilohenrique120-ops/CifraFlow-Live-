import React, { useState } from 'react';
import { X, Volume2, Music } from 'lucide-react';

interface TunerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PITCHES = [
  { note: 'C', freq: 261.63, label: 'Dó (C4)' },
  { note: 'D', freq: 293.66, label: 'Ré (D4)' },
  { note: 'E', freq: 329.63, label: 'Mi (E4)' },
  { note: 'F', freq: 349.23, label: 'Fá (F4)' },
  { note: 'G', freq: 392.00, label: 'Sol (G4)' },
  { note: 'A', freq: 440.00, label: 'Lá (A4 - 440Hz)' },
  { note: 'B', freq: 493.88, label: 'Si (B4)' }
];

export const TunerModal: React.FC<TunerModalProps> = ({ isOpen, onClose }) => {
  const [playingNote, setPlayingNote] = useState<string | null>(null);

  const playPitch = (note: string, freq: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.1);

      setPlayingNote(note);
      setTimeout(() => setPlayingNote(null), 2000);
    } catch (e) {
      console.warn('Audio error', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-700 p-6 text-white shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Afinação & Referência</span>
            <h3 className="text-xl font-black">Tom de Referência Vocal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Toque na nota desejada para emitir o som de referência antes de iniciar o canto:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PITCHES.map((item) => (
            <button
              key={item.note}
              onClick={() => playPitch(item.note, item.freq)}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                playingNote === item.note
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/40 font-black'
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xl font-black font-mono">{item.note}</span>
              <span className="text-[10px] text-zinc-400 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
