import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Plus, Minus } from 'lucide-react';

interface MetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBpm?: number;
}

export const MetronomeModal: React.FC<MetronomeModalProps> = ({
  isOpen,
  onClose,
  initialBpm = 80
}) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Context and Scheduling
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerWorkerRef = useRef<number | null>(null);
  const currentBeatRef = useRef<number>(0);

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);

  // Update initial BPM when prop changes
  useEffect(() => {
    if (initialBpm) setBpm(initialBpm);
  }, [initialBpm]);

  const playClick = useCallback((time: number, isAccent: boolean) => {
    if (!audioContextRef.current || !soundEnabled) return;
    const ctx = audioContextRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  }, [soundEnabled]);

  const scheduleBeat = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const isAccent = currentBeatRef.current === 0;
      playClick(nextNoteTimeRef.current, isAccent);

      // UI state sync
      const beatForUi = currentBeatRef.current;
      setTimeout(() => {
        setCurrentBeat(beatForUi);
      }, Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000));

      // Advance
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerBar;
    }

    timerWorkerRef.current = window.setTimeout(scheduleBeat, 25);
  }, [bpm, beatsPerBar, playClick]);

  const startMetronome = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    currentBeatRef.current = 0;
    nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
    setIsPlaying(true);
    scheduleBeat();
  };

  const stopMetronome = () => {
    setIsPlaying(false);
    if (timerWorkerRef.current) {
      clearTimeout(timerWorkerRef.current);
      timerWorkerRef.current = null;
    }
    setCurrentBeat(0);
  };

  useEffect(() => {
    if (isPlaying) {
      if (timerWorkerRef.current) clearTimeout(timerWorkerRef.current);
      scheduleBeat();
    }
  }, [bpm, beatsPerBar, scheduleBeat, isPlaying]);

  useEffect(() => {
    return () => {
      if (timerWorkerRef.current) clearTimeout(timerWorkerRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    times.push(now);

    // Keep only last 4 taps
    if (times.length > 4) times.shift();

    if (times.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-700 p-6 text-white shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Ferramenta de Palco</span>
            <h3 className="text-xl font-black">Metrônomo Digital</h3>
          </div>
          <button
            onClick={() => {
              stopMetronome();
              onClose();
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BPM Display & Flashers */}
        <div className="text-center space-y-4">
          <div className="text-6xl font-black font-mono text-emerald-400 tracking-tight">
            {bpm}
            <span className="text-xs text-zinc-400 font-sans ml-2">BPM</span>
          </div>

          {/* Visual Beat Flasher */}
          <div className="flex justify-center gap-2">
            {[...Array(beatsPerBar)].map((_, idx) => (
              <div
                key={idx}
                className={`w-5 h-5 rounded-full border transition-all duration-75 ${
                  isPlaying && currentBeat === idx
                    ? idx === 0
                      ? 'bg-amber-400 border-amber-300 scale-125 shadow-lg shadow-amber-500/50'
                      : 'bg-emerald-400 border-emerald-300 scale-125 shadow-lg shadow-emerald-500/50'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* BPM Slider & Stepper */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBpm(prev => Math.max(40, prev - 1))}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="flex-1 accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <button
              onClick={() => setBpm(prev => Math.min(240, prev + 1))}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Time Signature Buttons */}
          <div className="flex justify-center gap-2">
            {[2, 3, 4, 6].map((num) => (
              <button
                key={num}
                onClick={() => setBeatsPerBar(num)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                  beatsPerBar === num
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {num}/4
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
          <button
            onClick={handleTapTempo}
            className="py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-black uppercase tracking-wider text-zinc-200 border border-zinc-700 transition active:scale-95"
          >
            Tap Tempo 👆
          </button>

          <button
            onClick={() => isPlaying ? stopMetronome() : startMetronome()}
            className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Parar' : 'Iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
};
