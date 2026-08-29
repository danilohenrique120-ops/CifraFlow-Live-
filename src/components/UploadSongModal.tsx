import React, { useState, useEffect } from 'react';
import { Song, MusicGenre, CategoryTag } from '../types';
import { detectCapoInText } from '../utils/chordEngine';
import {
  X,
  Upload,
  FileText,
  Music,
  Sparkles,
  Eye,
  Check,
  Plus,
  Sliders,
  FolderOpen
} from 'lucide-react';

interface UploadSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSong: (newSong: Song) => void;
  initialMoment?: MusicGenre;
}

const MUSIC_GENRES: MusicGenre[] = [
  'Pop Rock',
  'MPB',
  'Sertanejo',
  'Pagode & Samba',
  'Gospel & Louvor',
  'Forró & Piseiro',
  'Hits do Show',
  'Acústico',
  'Baladas & Românticas',
  'Abertura & Encerramento',
  'Geral'
];

const CATEGORIES: CategoryTag[] = [
  'Pop Rock',
  'MPB',
  'Sertanejo',
  'Pagode',
  'Gospel',
  'Forró',
  'Anos 80/90',
  'Acústico',
  'Romântica',
  'Ao Vivo',
  'Internacional',
  'Clássicos',
  'Adoração'
];

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Am', 'Em', 'Dm', 'Bm', 'F#m', 'C#m', 'G#m'];

const EXAMPLE_TEMPLATE = `[Intro] G  D/F#  Em  C

[Primeira Parte]
G                  D/F#
  Cante aqui a primeira estrofe da sua música
Em                 C
  Com as cifras alinhadas exatamente sobre o texto
G                  D/F#
  Você pode transpor o tom a qualquer momento
Em                 C
  E toda a sua banda acompanhará no ensaio

[Refrão]
G                  D/F#
  Este é o refrão poderoso e marcante
Em                 C
  Onde todo o público canta em uníssono
G                  D/F#
  O som que toca o coração da galera
Em        D/F#     C          G
  Vamos cantar juntos até o amanhecer!`;

export const UploadSongModal: React.FC<UploadSongModalProps> = ({
  isOpen,
  onClose,
  onSaveSong,
  initialMoment
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [originalKey, setOriginalKey] = useState('G');
  const [capo, setCapo] = useState<number>(0);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [liturgicalMoment, setLiturgicalMoment] = useState<MusicGenre>(initialMoment || 'Pop Rock');
  const [selectedCategories, setSelectedCategories] = useState<CategoryTag[]>(['Pop Rock', 'Ao Vivo']);
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (initialMoment) {
      setLiturgicalMoment(initialMoment);
    }
  }, [initialMoment, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    // Auto-fill title from filename if title is empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        const detectedCapo = detectCapoInText(text);
        if (detectedCapo) {
          setCapo(detectedCapo);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleCategoryToggle = (cat: CategoryTag) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleAutoFormat = () => {
    if (!content) return;
    // Auto format section headers
    let formatted = content
      .replace(/^(refrão|refrao|chorus):?/gim, '[Refrão]')
      .replace(/^(intro|introdução|introducao):?/gim, '[Intro]')
      .replace(/^(primeira parte|verso 1|parte 1):?/gim, '[Primeira Parte]')
      .replace(/^(segunda parte|verso 2|parte 2):?/gim, '[Segunda Parte]')
      .replace(/^(ponte|bridge):?/gim, '[Ponte]')
      .replace(/^(final|outro):?/gim, '[Final]');

    setContent(formatted);
  };

  const handleLoadExample = () => {
    setTitle('Meu Sucesso Inédito');
    setArtist('Banda Nova');
    setOriginalKey('G');
    setBpm(120);
    setContent(EXAMPLE_TEMPLATE);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Por favor, preencha o título e as cifras da música.');
      return;
    }

    const gradients = [
      'from-emerald-600 to-teal-900',
      'from-blue-600 to-indigo-900',
      'from-violet-600 to-purple-900',
      'from-amber-600 to-rose-900',
      'from-cyan-600 to-blue-800'
    ];
    const coverGradient = gradients[Math.floor(Math.random() * gradients.length)];

    const newSong: Song = {
      id: 'custom_' + Date.now(),
      title: title.trim(),
      artist: artist.trim() || 'Artista Próprio',
      originalKey,
      currentKey: originalKey,
      capo: capo > 0 ? capo : undefined,
      bpm: Number(bpm) || 120,
      timeSignature,
      liturgicalMoment,
      categories: selectedCategories.length > 0 ? selectedCategories : ['Ao Vivo'],
      coverGradient,
      tags: [title.toLowerCase(), artist.toLowerCase(), liturgicalMoment.toLowerCase(), 'minha cifra'],
      content: content.trim(),
      duration: '3:45',
      isCustom: true
    };

    onSaveSong(newSong);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 flex-none bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Adicionar Cifra ao Catálogo</h2>
              <p className="text-xs text-zinc-400">Importe seu arquivo TXT/PDF ou cole sua cifra personalizada</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="relative border-2 border-dashed border-zinc-700/80 hover:border-emerald-500/60 rounded-2xl p-4 bg-zinc-950/40 text-center transition cursor-pointer group">
            <input
              type="file"
              accept=".txt,.cifra,.chordpro"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-1.5 pointer-events-none">
              <FolderOpen className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-zinc-200">
                {fileName ? `Arquivo carregado: ${fileName}` : 'Clique para carregar arquivo TXT/Cifra ou arraste aqui'}
              </p>
              <p className="text-[10px] text-zinc-500">Auto-detectamos título, andamento, tom e capotraste</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Título da Música *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Tempo Perdido"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Artista / Banda</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ex: Legião Urbana"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Tom Original</label>
                <select
                  value={originalKey}
                  onChange={(e) => setOriginalKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  {KEYS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-400 block mb-1">Capotraste</label>
                <select
                  value={capo}
                  onChange={(e) => setCapo(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value={0}>Sem Capo</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((fret) => (
                    <option key={fret} value={fret}>{fret}ª casa</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">BPM</label>
                <input
                  type="number"
                  min="40"
                  max="240"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Compasso</label>
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="4/4">4/4</option>
                  <option value="3/4">3/4</option>
                  <option value="6/8">6/8</option>
                  <option value="2/4">2/4</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-bold text-zinc-300 block mb-1">Estilo / Bloco</label>
                <select
                  value={liturgicalMoment}
                  onChange={(e) => setLiturgicalMoment(e.target.value as MusicGenre)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {MUSIC_GENRES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Categories Multi-Select Chips */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Categorias / Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                        isChecked
                          ? 'bg-emerald-500 text-zinc-950 shadow-sm font-bold'
                          : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lyrics & Chords Editor with Auto-format & Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Letra com Cifras Alinhadas *
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFormat}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-emerald-400 border border-zinc-700 font-semibold transition"
                    title="Identificar e formatar tags como [Intro], [Refrão], etc."
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Formatar Seções
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {isPreview ? 'Voltar ao Editor' : 'Pré-visualizar'}
                  </button>
                </div>
              </div>

              {isPreview ? (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 max-h-60 overflow-y-auto font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {content || '(Nenhuma cifra digitada ainda)'}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Cole aqui sua cifra completa.\n\nExemplo:\n[Intro] G  D/F#  Em  C\n\nG                  D/F#\nTodos os dias quando acordo...`}
                  rows={9}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl p-3.5 font-mono text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  required
                />
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar Cifra no Meu Catálogo
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
