export type MusicGenre = string;

// Type alias to maintain backwards-compatibility across components
export type LiturgicalMoment = string;

export interface GenreFolder {
  id: string;
  name: string;
  color: string;
  desc?: string;
  createdAt?: string;
}

export type CategoryTag =
  | 'Pop Rock'
  | 'MPB'
  | 'Sertanejo'
  | 'Pagode'
  | 'Gospel'
  | 'Forró'
  | 'Anos 80/90'
  | 'Acústico'
  | 'Romântica'
  | 'Baladas & Românticas'
  | 'Hits do Show'
  | 'Ao Vivo'
  | 'Internacional'
  | 'Clássicos'
  | 'Adoração'
  | 'Louvor'
  | 'Geral';

export interface ChordLine {
  type: 'chords-lyrics' | 'lyrics-only' | 'section-header' | 'chords-only' | 'comment';
  chords?: string;
  lyrics?: string;
  sectionTitle?: string;
  comment?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  currentKey?: string;
  bpm: number;
  timeSignature: string; // '4/4', '3/4', '6/8', etc.
  capo?: number;
  liturgicalMoment: MusicGenre; // Represents the MusicGenre / Show Block
  categories: CategoryTag[];
  coverGradient: string;
  tags: string[];
  content: string;
  parsedLines?: ChordLine[];
  videoUrl?: string;
  duration?: string;
  isCustom?: boolean;
  audioPreviewUrl?: string;
  albumName?: string;
  coverUrl?: string;
  privacy?: 'private' | 'unlisted' | 'public';
  parentSongId?: string;
  versionName?: string;
}

export interface OnlineSongResult {
  trackId: number | string;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  releaseDate?: string;
  source: 'online_spotify' | 'online_itunes';
}

export interface SetlistItem {
  songId: string;
  customKey: string;
  notes?: string;
  order: number;
  capo?: number;
}

export interface Setlist {
  id: string;
  title: string;
  description: string;
  date: string;
  targetEvent: string;
  items: SetlistItem[];
  createdAt: string;
  updatedAt: string;
  isCloudSynced?: boolean;
}

export type UserRole = 'leader' | 'member';

export type UserPlanTier = 'free' | 'pro_musician' | 'pro_band';

export interface UserSubscription {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  tier: UserPlanTier;
  planName: string;
  currentPeriodEnd: number; // Timestamp
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: 'free' | 'pro' | 'admin';
  instrument: string;
  avatarColor: string;
  subscription: UserSubscription;
  createdAt: number;
  lastLoginAt: number;
  cloudSetlists?: Setlist[];
  cloudCustomSongs?: Song[];
  cloudMomentOverrides?: Record<string, LiturgicalMoment>;
  lastCloudSync?: number;
}

export interface LiveMember {
  id: string;
  name: string;
  role: UserRole;
  instrument: string;
  joinedAt: number;
  isHost: boolean;
  avatarColor: string;
  isPro?: boolean;
}

export type BandAlert = {
  id: string;
  message: string;
  type: 'repeat-chorus' | 'outro' | 'bridge' | 'solo' | 'soft' | 'crescendo' | 'key-change' | 'custom';
  timestamp: number;
  senderName: string;
};

export interface LiveSessionState {
  roomId: string;
  pin: string;
  roomName: string;
  hostId: string;
  currentSongId: string | null;
  currentSong?: Song | null;
  currentKey: string;
  semitoneShift: number;
  currentCapo?: number;
  activeSetlistId: string | null;
  followScroll: boolean;
  scrollPercentage: number;
  currentAlert: BandAlert | null;
  members: LiveMember[];
  lastUpdated: number;
}


export type StageTheme = 'dark-stage' | 'oled' | 'sepia' | 'light-contrast';

export type FontScale = 'sm' | 'base' | 'lg' | 'xl' | '2xl';

export type ColumnMode = '1-col' | '2-col';

export type InstrumentKey =
  | 'guitar'
  | 'keyboard'
  | 'ukulele'
  | 'cavaquinho'
  | 'bass'
  | 'sax_alto'
  | 'trumpet'
  | 'flute'
  | 'vocals'
  | 'drums';

export interface InstrumentOption {
  id: InstrumentKey;
  label: string;
  tuning: string;
  transpositionSemitones: number;
  isTransposing: boolean;
  category: 'Cordas' | 'Teclas' | 'Sopros' | 'Ritmo e Voz';
  icon: string;
}

export const INSTRUMENT_OPTIONS: InstrumentOption[] = [
  { id: 'guitar', label: 'Violão / Guitarra', tuning: 'Afinação Padrão (E A D G B E)', transpositionSemitones: 0, isTransposing: false, category: 'Cordas', icon: '🎸' },
  { id: 'keyboard', label: 'Teclado / Piano', tuning: 'Padrão em Dó (C)', transpositionSemitones: 0, isTransposing: false, category: 'Teclas', icon: '🎹' },
  { id: 'ukulele', label: 'Ukulele', tuning: 'Afinação G C E A', transpositionSemitones: 0, isTransposing: false, category: 'Cordas', icon: '🏝️' },
  { id: 'cavaquinho', label: 'Cavaquinho', tuning: 'Afinação D G B D', transpositionSemitones: 0, isTransposing: false, category: 'Cordas', icon: '🪕' },
  { id: 'bass', label: 'Contrabaixo', tuning: 'Afinação E A D G (Foco em Tônicas)', transpositionSemitones: 0, isTransposing: false, category: 'Cordas', icon: '🎸' },
  { id: 'sax_alto', label: 'Sax Alto / Barítono (Eb)', tuning: 'Instrumento Transpositor em Mib (Eb)', transpositionSemitones: -3, isTransposing: true, category: 'Sopros', icon: '🎷' },
  { id: 'trumpet', label: 'Trompete / Sax Tenor (Bb)', tuning: 'Instrumento Transpositor em Sib (Bb)', transpositionSemitones: 2, isTransposing: true, category: 'Sopros', icon: '🎺' },
  { id: 'flute', label: 'Flauta / Violino', tuning: 'Padrão em Dó (C)', transpositionSemitones: 0, isTransposing: false, category: 'Sopros', icon: '🎼' },
  { id: 'vocals', label: 'Vocal / Voz', tuning: 'Melodia e Letra', transpositionSemitones: 0, isTransposing: false, category: 'Ritmo e Voz', icon: '🎤' },
  { id: 'drums', label: 'Bateria / Percussão', tuning: 'Andamento (BPM) e Dinâmica', transpositionSemitones: 0, isTransposing: false, category: 'Ritmo e Voz', icon: '🥁' }
];
