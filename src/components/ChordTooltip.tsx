import React, { useState } from 'react';
import { getChordDiagram } from '../utils/chordEngine';
import { X, Volume2, Sparkles, Lock } from 'lucide-react';

interface ChordModalProps {
  chord: string | null;
  onClose: () => void;
  userInstrument?: string;
  isPro?: boolean;
  onOpenPricing?: (reason?: string) => void;
}

type InstrumentDiagramTab = 'guitar' | 'keyboard' | 'ukulele' | 'cavaquinho' | 'bass';

export const ChordModal: React.FC<ChordModalProps> = ({
  chord,
  onClose,
  userInstrument = 'Violão',
  isPro = false,
  onOpenPricing
}) => {
  if (!chord) return null;

  // Determine initial tab based on user's instrument
  const getInitialTab = (): InstrumentDiagramTab => {
    const lower = userInstrument.toLowerCase();
    if (lower.includes('teclado') || lower.includes('piano')) return 'keyboard';
    if (lower.includes('ukulele')) return 'ukulele';
    if (lower.includes('cavaquinho') || lower.includes('cavaco')) return 'cavaquinho';
    if (lower.includes('baixo') || lower.includes('bass')) return 'bass';
    return 'guitar';
  };

  const [activeTab, setActiveTab] = useState<InstrumentDiagramTab>(getInitialTab);

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

  const parseFrets = (fretStr?: string, defaultStringsCount = 6) => {
    if (!fretStr) return Array(defaultStringsCount).fill('x');
    return fretStr.split(' ');
  };

  const guitarFrets = parseFrets(diagram?.guitarFrets, 6);
  const ukeFrets = parseFrets(diagram?.ukuleleFrets || '0 0 0 0', 4);
  const cavacoFrets = parseFrets(diagram?.cavaquinhoFrets || '0 0 0 0', 4);

  const handleTabClick = (tab: InstrumentDiagramTab) => {
    if (tab !== 'guitar' && !isPro) {
      if (onOpenPricing) {
        onOpenPricing(`A visualização de diagramas para ${tab === 'keyboard' ? 'Teclado' : tab === 'ukulele' ? 'Ukulele' : tab === 'cavaquinho' ? 'Cavaquinho' : 'Contrabaixo'} é exclusiva do Plano Pro.`);
      }
      return;
    }
    setActiveTab(tab);
  };

  const keyboardNotesClean = (diagram?.keyboardNotes || []).map(n => n.replace(/[0-9]/g, ''));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700/80 p-5 sm:p-6 shadow-2xl text-white space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Title & Audio button */}
        <div className="flex items-center justify-between pr-8">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 block">
              Dicionário de Acordes Adaptativo
            </span>
            <h3 className="text-3xl font-black text-white tracking-tight">{chord}</h3>
          </div>
          <button
            onClick={playChordAudio}
            title="Ouvir som do Acorde"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition text-xs font-bold"
          >
            <Volume2 className="w-4 h-4" />
            Ouvir Som
          </button>
        </div>

        {/* Instrument Selector Tabs */}
        <div className="flex bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800 text-xs overflow-x-auto gap-1">
          {[
            { id: 'guitar', label: 'Violão (6c)', icon: '🎸' },
            { id: 'keyboard', label: 'Teclado', icon: '🎹' },
            { id: 'ukulele', label: 'Ukulele', icon: '🏝️' },
            { id: 'cavaquinho', label: 'Cavaco', icon: '🪕' },
            { id: 'bass', label: 'Baixo', icon: '🎸' }
          ].map((item) => {
            const isTabActive = activeTab === item.id;
            const isLocked = item.id !== 'guitar' && !isPro;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as InstrumentDiagramTab)}
                className={`flex-1 min-w-[72px] py-1.5 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 text-[11px] whitespace-nowrap ${
                  isTabActive
                    ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {isLocked && <Lock className="w-2.5 h-2.5 text-amber-400 ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Visualizer Body */}
        <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px]">
          {/* 1. GUITAR TAB */}
          {activeTab === 'guitar' && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-zinc-400 mb-3">Braço do Violão / Guitarra (E A D G B e)</span>
              
              <div className="relative w-40 h-40 border-t-4 border-amber-200/90 border-b border-zinc-700 grid grid-cols-5 relative">
                {/* 6 Vertical strings */}
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
                  {guitarFrets.map((fret, sIdx) => (
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

                {/* Finger dots */}
                {guitarFrets.map((fret, sIdx) => {
                  const fretNum = parseInt(fret, 10);
                  if (isNaN(fretNum) || fretNum <= 0 || fretNum > 4) return null;
                  const leftPercent = (sIdx / 5) * 100;
                  const topPx = (fretNum - 0.5) * 40;

                  return (
                    <div
                      key={sIdx}
                      style={{ left: `calc(${leftPercent}% - 7px)`, top: `${topPx - 7}px` }}
                      className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50 border border-zinc-950 flex items-center justify-center text-[8px] font-black text-zinc-950 z-10"
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
          )}

          {/* 2. KEYBOARD (PIANO) TAB */}
          {activeTab === 'keyboard' && (
            <div className="flex flex-col items-center w-full">
              <span className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1.5">
                Teclas do Piano / Teclado: 
                <strong className="text-emerald-400">{keyboardNotesClean.join(' - ')}</strong>
              </span>

              {/* Interactive Mini Piano Keyboard */}
              <div className="relative flex justify-center bg-zinc-900 p-2 rounded-2xl border border-zinc-700 shadow-inner">
                {/* White Keys: C, D, E, F, G, A, B, C */}
                {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'].map((whiteKey, idx) => {
                  const isHighlighted = keyboardNotesClean.includes(whiteKey);
                  return (
                    <div
                      key={idx}
                      className={`relative w-8 sm:w-9 h-32 rounded-b-lg border border-zinc-400 transition flex flex-col justify-end items-center pb-2 ${
                        isHighlighted
                          ? 'bg-emerald-400 text-zinc-950 font-black shadow-lg shadow-emerald-500/40'
                          : 'bg-zinc-100 text-zinc-600 font-bold'
                      }`}
                    >
                      <span className="text-[10px] font-mono">{whiteKey}</span>
                      {isHighlighted && (
                        <div className="w-2 h-2 rounded-full bg-zinc-950 mb-1" />
                      )}
                    </div>
                  );
                })}

                {/* Black Keys: C#, D#, F#, G#, A# */}
                <div className="absolute top-2 left-2 flex pointer-events-none">
                  {/* C# */}
                  <div className={`w-5 h-20 rounded-b-md mx-[9px] ${keyboardNotesClean.includes('C#') || keyboardNotesClean.includes('Db') ? 'bg-amber-400 border border-amber-500 shadow-md' : 'bg-zinc-950 border border-zinc-800'}`} />
                  {/* D# */}
                  <div className={`w-5 h-20 rounded-b-md mx-[9px] ${keyboardNotesClean.includes('D#') || keyboardNotesClean.includes('Eb') ? 'bg-amber-400 border border-amber-500 shadow-md' : 'bg-zinc-950 border border-zinc-800'}`} />
                  {/* Spacer between E & F */}
                  <div className="w-8" />
                  {/* F# */}
                  <div className={`w-5 h-20 rounded-b-md mx-[9px] ${keyboardNotesClean.includes('F#') || keyboardNotesClean.includes('Gb') ? 'bg-amber-400 border border-amber-500 shadow-md' : 'bg-zinc-950 border border-zinc-800'}`} />
                  {/* G# */}
                  <div className={`w-5 h-20 rounded-b-md mx-[9px] ${keyboardNotesClean.includes('G#') || keyboardNotesClean.includes('Ab') ? 'bg-amber-400 border border-amber-500 shadow-md' : 'bg-zinc-950 border border-zinc-800'}`} />
                  {/* A# */}
                  <div className={`w-5 h-20 rounded-b-md mx-[9px] ${keyboardNotesClean.includes('A#') || keyboardNotesClean.includes('Bb') ? 'bg-amber-400 border border-amber-500 shadow-md' : 'bg-zinc-950 border border-zinc-800'}`} />
                </div>
              </div>
            </div>
          )}

          {/* 3. UKULELE TAB */}
          {activeTab === 'ukulele' && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-zinc-400 mb-3">Braço do Ukulele (G C E A)</span>
              
              <div className="relative w-32 h-40 border-t-4 border-amber-200/90 border-b border-zinc-700 grid grid-cols-3 relative">
                {/* 4 Vertical strings */}
                <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[1.5px] h-full bg-zinc-600" />
                  ))}
                </div>

                {/* Horizontal frets */}
                {[...Array(4)].map((_, fIdx) => (
                  <div key={fIdx} className="col-span-3 border-b border-zinc-700/80 h-10 relative">
                    <span className="absolute -left-5 top-2 text-[10px] text-zinc-500 font-mono">{fIdx + 1}ª</span>
                  </div>
                ))}

                {/* Finger / Mute markers */}
                <div className="absolute -top-6 inset-x-0 flex justify-between px-0.5 text-xs font-bold font-mono">
                  {ukeFrets.map((fret, sIdx) => (
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

                {/* Finger dots */}
                {ukeFrets.map((fret, sIdx) => {
                  const fretNum = parseInt(fret, 10);
                  if (isNaN(fretNum) || fretNum <= 0 || fretNum > 4) return null;
                  const leftPercent = (sIdx / 3) * 100;
                  const topPx = (fretNum - 0.5) * 40;

                  return (
                    <div
                      key={sIdx}
                      style={{ left: `calc(${leftPercent}% - 7px)`, top: `${topPx - 7}px` }}
                      className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50 border border-zinc-950 flex items-center justify-center text-[8px] font-black text-zinc-950 z-10"
                    >
                      ●
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between w-32 text-[10px] text-zinc-500 font-mono mt-2">
                <span>G</span>
                <span>C</span>
                <span>E</span>
                <span>A</span>
              </div>
            </div>
          )}

          {/* 4. CAVAQUINHO TAB */}
          {activeTab === 'cavaquinho' && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-zinc-400 mb-3">Braço do Cavaquinho (D G B D)</span>
              
              <div className="relative w-32 h-40 border-t-4 border-amber-200/90 border-b border-zinc-700 grid grid-cols-3 relative">
                {/* 4 Vertical strings */}
                <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[1.5px] h-full bg-zinc-600" />
                  ))}
                </div>

                {/* Horizontal frets */}
                {[...Array(4)].map((_, fIdx) => (
                  <div key={fIdx} className="col-span-3 border-b border-zinc-700/80 h-10 relative">
                    <span className="absolute -left-5 top-2 text-[10px] text-zinc-500 font-mono">{fIdx + 1}ª</span>
                  </div>
                ))}

                {/* Finger / Mute markers */}
                <div className="absolute -top-6 inset-x-0 flex justify-between px-0.5 text-xs font-bold font-mono">
                  {cavacoFrets.map((fret, sIdx) => (
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

                {/* Finger dots */}
                {cavacoFrets.map((fret, sIdx) => {
                  const fretNum = parseInt(fret, 10);
                  if (isNaN(fretNum) || fretNum <= 0 || fretNum > 4) return null;
                  const leftPercent = (sIdx / 3) * 100;
                  const topPx = (fretNum - 0.5) * 40;

                  return (
                    <div
                      key={sIdx}
                      style={{ left: `calc(${leftPercent}% - 7px)`, top: `${topPx - 7}px` }}
                      className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 shadow-md shadow-amber-500/50 border border-zinc-950 flex items-center justify-center text-[8px] font-black text-zinc-950 z-10"
                    >
                      ●
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between w-32 text-[10px] text-zinc-500 font-mono mt-2">
                <span>D</span>
                <span>G</span>
                <span>B</span>
                <span>D</span>
              </div>
            </div>
          )}

          {/* 5. BASS TAB */}
          {activeTab === 'bass' && (
            <div className="flex flex-col items-center w-full py-4 text-center space-y-3">
              <span className="text-xs font-bold text-zinc-400">Guia da Tônica / Baixo:</span>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 w-full">
                <span className="text-xs text-zinc-400 block mb-1">Nota Fundamental do Contrabaixo:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {diagram?.bassNote || chord.split('/')[0]}
                </span>
                {chord.includes('/') && (
                  <div className="mt-2 pt-2 border-t border-zinc-800 text-xs text-amber-300">
                    <span>Baixo Invertido na nota: </span>
                    <strong className="font-mono font-black">{chord.split('/')[1]}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pro Instrument Customizer Banner if Free */}
        {!isPro && (
          <div
            onClick={() => onOpenPricing && onOpenPricing('Desbloqueie diagramas e transposições automáticas para Teclado, Ukulele, Cavaquinho e Sopros com o Plano Pro.')}
            className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-900 border border-emerald-500/40 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500 transition"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-none" />
              <div>
                <span className="text-xs font-extrabold text-white block">Adaptação Inteligente de Instrumentos</span>
                <span className="text-[10px] text-zinc-400">Disponível no Plano Pro (Teclado, Ukulele, Cavaco e Sopros)</span>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase">
              Pro
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
