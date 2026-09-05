import React, { useState, useEffect } from 'react';
import { GenreFolder } from '../types';
import { X, Folder, Check, Trash2 } from 'lucide-react';

interface GenreFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder?: GenreFolder | null;
  existingFolders: GenreFolder[];
  isPro: boolean;
  onSaveFolder: (folder: GenreFolder) => void;
  onDeleteFolder?: (folderId: string) => void;
  onOpenPricing: (reason?: string) => void;
}

const PRESET_COLORS = [
  { label: 'Azul & Índigo', value: 'from-blue-600 to-indigo-900' },
  { label: 'Âmbar & Laranja', value: 'from-amber-600 to-orange-800' },
  { label: 'Amarelo & Ouro', value: 'from-amber-700 to-yellow-900' },
  { label: 'Esmeralda & Verde', value: 'from-emerald-600 to-teal-900' },
  { label: 'Roxo & Violeta', value: 'from-purple-700 to-indigo-950' },
  { label: 'Laranja & Vermelho', value: 'from-orange-600 to-red-800' },
  { label: 'Rosa & Magenta', value: 'from-rose-600 to-pink-900' },
  { label: 'Ciano & Azul Petróleo', value: 'from-cyan-600 to-blue-900' },
  { label: 'Violeta & Fúcsia', value: 'from-violet-700 to-fuchsia-950' },
  { label: 'Grafite & Chumbo', value: 'from-slate-700 to-zinc-900' }
];

export const GenreFolderModal: React.FC<GenreFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  existingFolders,
  isPro,
  onSaveFolder,
  onDeleteFolder,
  onOpenPricing
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0].value);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDesc(folder.desc || '');
      setColor(folder.color || PRESET_COLORS[0].value);
    } else {
      setName('');
      setDesc('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)].value);
    }
  }, [folder, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(folder);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Por favor, informe um nome para a pasta.');
      return;
    }

    if (!isEditing && !isPro && existingFolders.length >= 3) {
      onClose();
      onOpenPricing('Usuários gratuitos podem ter até 3 pastas de estilos. Faça upgrade para o Plano Pro para criar pastas ilimitadas na nuvem.');
      return;
    }

    const folderToSave: GenreFolder = {
      id: folder?.id || ('folder_' + Date.now()),
      name: trimmed,
      desc: desc.trim() || undefined,
      color,
      createdAt: folder?.createdAt || new Date().toISOString()
    };

    onSaveFolder(folderToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isEditing ? 'Editar Pasta de Estilo' : 'Nova Pasta de Estilo'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? 'Altere o nome e a cor da sua pasta musical'
                  : 'Organize suas músicas por blocos ou gêneros do show'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Nome da Pasta / Estilo *
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pop Rock, Barzinho, Clássicos, Acústico..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Descrição Curta (Opcional)
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex: Músicas para o início do show e animação"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-2">
              Cor de Destaque da Pasta
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setColor(item.value)}
                  className={`h-10 rounded-xl bg-gradient-to-br ${item.value} border transition-all flex items-center justify-center relative ${
                    color === item.value
                      ? 'border-white scale-105 ring-2 ring-emerald-400'
                      : 'border-white/10 hover:scale-102 hover:border-white/40'
                  }`}
                  title={item.label}
                >
                  {color === item.value && (
                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
              Pré-visualização do Card
            </span>
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
              <span className="text-[10px] font-black uppercase text-white/80 tracking-wider block">
                0 músicas
              </span>
              <h4 className="text-base font-black text-white mt-1 leading-snug">
                {name.trim() || 'Nome da Pasta'}
              </h4>
              <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                {desc.trim() || 'Descrição da sua pasta'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
            {isEditing && onDeleteFolder && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Deseja realmente excluir a pasta "${folder?.name}"? As músicas atribuídas a ela continuarão no seu catálogo.`)) {
                    onDeleteFolder(folder!.id);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-800/50 hover:bg-rose-900/40 transition text-xs font-bold flex items-center gap-1.5"
                title="Excluir Pasta"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Salvar Alterações' : 'Criar Pasta'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
