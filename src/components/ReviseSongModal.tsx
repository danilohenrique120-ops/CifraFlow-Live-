import React, { useState, useEffect } from 'react';
import { Song, MusicGenre, CategoryTag } from '../types';
import { isChordLine } from '../utils/chordEngine';
import {
  X,
  Sparkles,
  Eye,
  Check,
  RotateCcw,
  Lock,
  Globe,
  Link2,
  FileText,
  Sliders,
  Music,
  Plus,
  HelpCircle
} from 'lucide-react';

interface ReviseSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  onSaveVersion: (newSongVersion: Song) => void;
}

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Am', 'Em', 'Dm', 'Bm', 'F#m', 'C#m', 'G#m'];

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

export const ReviseSongModal: React.FC<ReviseSongModalProps> = ({
  isOpen,
  onClose,
  song,
  onSaveVersion
}) => {
  const [title, setTitle] = useState(`${song.title} (Minha Versão)`);
  const [artist, setArtist] = useState(song.artist);
  const [originalKey, setOriginalKey] = useState(song.originalKey);
  const [capo, setCapo] = useState<number>(song.capo || 0);
  const [bpm, setBpm] = useState<number>(song.bpm || 120);
  const [timeSignature, setTimeSignature] = useState(song.timeSignature || '4/4');
  const [liturgicalMoment, setLiturgicalMoment] = useState<MusicGenre>(song.liturgicalMoment || 'Pop Rock');
  const [content, setContent] = useState(song.content || '');
  const [privacy, setPrivacy] = useState<'private' | 'unlisted' | 'public'>('private');
  const [versionNotes, setVersionNotes] = useState('Arranjo personalizado para show');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (isOpen && song) {
      setTitle(song.title.includes('(Minha Versão)') ? song.title : `${song.title} (Minha Versão)`);
      setArtist(song.artist);
      setOriginalKey(song.originalKey);
      setCapo(song.capo || 0);
      setBpm(song.bpm || 120);
      setTimeSignature(song.timeSignature || '4/4');
      setLiturgicalMoment(song.liturgicalMoment || 'Pop Rock');
      setContent(song.content || '');
      setPrivacy(song.privacy || 'private');
      setVersionNotes(song.versionName || 'Arranjo personalizado para show');
      setIsPreview(false);
    }
  }, [isOpen, song]);

  if (!isOpen) return null;

  const handleAutoFormat = () => {
    if (!content) return;
    let formatted = content
      .replace(/^(refrão|refrao|chorus):?/gim, '[Refrão]')
      .replace(/^(intro|introdução|introducao):?/gim, '[Intro]')
      .replace(/^(primeira parte|verso 1|parte 1):?/gim, '[Primeira Parte]')
      .replace(/^(segunda parte|verso 2|parte 2):?/gim, '[Segunda Parte]')
      .replace(/^(ponte|bridge):?/gim, '[Ponte]')
      .replace(/^(solo|solo de guitarra|solo instrumental):?/gim, '[Solo]')
      .replace(/^(final|outro):?/gim, '[Final]');

    setContent(formatted);
  };

  const handleInsertSection = (tag: string) => {
    setContent(prev => `${prev}\n\n${tag}\n`);
  };

  const handleResetToOriginal = () => {
    if (window.confirm('Deseja restaurar o texto da cifra original? As suas alterações não salvas serão descartadas.')) {
      setContent(song.content);
      setOriginalKey(song.originalKey);
      setCapo(song.capo || 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Por favor, preencha o título e as cifras da sua versão.');
      return;
    }

    const newSongVersion: Song = {
      id: `custom_rev_${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || song.artist,
      originalKey,
      currentKey: originalKey,
      capo: capo > 0 ? capo : undefined,
      bpm: Number(bpm) || 120,
      timeSignature,
      liturgicalMoment,
      categories: song.categories && song.categories.length > 0 ? song.categories : ['Ao Vivo'],
      coverGradient: song.coverGradient || 'from-emerald-600 to-teal-900',
      tags: [title.toLowerCase(), artist.toLowerCase(), 'minha versao', 'revisao pessoal', privacy],
      content: content.trim(),
      duration: song.duration || '3:30',
      isCustom: true,
      parentSongId: song.id,
      privacy,
      versionName: versionNotes.trim() || 'Minha Versão',
      audioPreviewUrl: song.audioPreviewUrl,
      albumName: song.albumName,
      coverUrl: song.coverUrl
    };

    onSaveVersion(newSongVersion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 flex-none bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Criar Minha Versão (Revisão Pessoal)</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Sem alterar a original
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Altere acordes, corrija letras, ajuste a sincronia das marcações e salve como sua versão personalizada
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Metadata Parameters Grid */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Título da Sua Versão *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Tempo Perdido (Versão Simplificada)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Tom Original</label>
                <select
                  value={originalKey}
                  onChange={(e) => setOriginalKey(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Compasso</label>
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {MUSIC_GENRES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Selector Cards */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center justify-between">
              <span>Definir Privacidade da Sua Cifra:</span>
              <span className="text-[10px] text-zinc-500">Escolha quem pode visualizar sua versão</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Private */}
              <div
                onClick={() => setPrivacy('private')}
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  privacy === 'private'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 flex-none ${privacy === 'private' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div>
                  <span className="text-xs font-bold block text-white">Privada (Só Você)</span>
                  <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5">
                    Fica salva somente na sua conta para seus estudos e ensaios.
                  </span>
                </div>
              </div>

              {/* Unlisted */}
              <div
                onClick={() => setPrivacy('unlisted')}
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  privacy === 'unlisted'
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Link2 className={`w-4 h-4 mt-0.5 flex-none ${privacy === 'unlisted' ? 'text-blue-400' : 'text-zinc-500'}`} />
                <div>
                  <span className="text-xs font-bold block text-white">Não Listada (Banda)</span>
                  <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5">
                    Acessível aos músicos conectados na sua sala ao vivo (Live Sync).
                  </span>
                </div>
              </div>

              {/* Public */}
              <div
                onClick={() => setPrivacy('public')}
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  privacy === 'public'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 flex-none ${privacy === 'public' ? 'text-amber-400' : 'text-zinc-500'}`} />
                <div>
                  <span className="text-xs font-bold block text-white">Pública (Comunidade)</span>
                  <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5">
                    Visível no seu perfil e disponível para todos os usuários do app.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Editor Header & Quick Section Buttons */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                Editor de Letras e Cifras Alinhadas *
              </label>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoFormat}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-emerald-400 border border-zinc-700 font-semibold transition"
                  title="Formatar marcadores de Refrão, Intro, Ponte, etc."
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Formatar
                </button>

                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 hover:text-white border border-zinc-700 transition"
                  title="Restaurar o texto da cifra original"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Recarregar Original
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreview(!isPreview)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition border ${
                    isPreview
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isPreview ? 'Editar Cifra' : 'Pré-visualizar'}
                </button>
              </div>
            </div>

            {/* Quick Section Insertion Pills */}
            {!isPreview && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
                <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">Inserir:</span>
                {['[Intro]', '[Primeira Parte]', '[Refrão]', '[Segunda Parte]', '[Ponte]', '[Solo]', '[Final]'].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleInsertSection(sec)}
                    className="px-2 py-0.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-mono transition"
                  >
                    + {sec}
                  </button>
                ))}
              </div>
            )}

            {/* Editor vs Preview Display */}
            {isPreview ? (
              <div className="p-4 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 max-h-80 overflow-y-auto font-mono text-xs sm:text-sm text-zinc-100 whitespace-pre leading-relaxed shadow-inner select-text">
                {content ? (
                  content.split('\n').map((line, idx) => {
                    const isChord = isChordLine(line);
                    const isSec = line.trim().startsWith('[') && line.trim().endsWith(']');

                    if (isSec) {
                      return (
                        <div key={idx} className="text-emerald-400 font-bold py-1">
                          {line}
                        </div>
                      );
                    }
                    if (isChord) {
                      return (
                        <div key={idx} className="text-amber-400 font-black">
                          {line}
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="text-zinc-200">
                        {line || ' '}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-zinc-500">(Nenhuma cifra digitada ainda)</span>
                )}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Cole ou edite as cifras aqui.\n\nExemplo:\n[Intro] G  Em  C  D\n\nG                  Em\nLetra da música com acordes alinhados`}
                rows={12}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl p-4 font-mono text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
                required
              />
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>A cifra original permanecerá intacta no catálogo.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar Minha Versão
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
