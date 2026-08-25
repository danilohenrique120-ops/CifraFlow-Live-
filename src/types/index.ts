export type LiturgicalMoment =
  | 'Entrada'
  | 'Ato Penitencial'
  | 'Glória'
  | 'Salmo / Aclamação'
  | 'Ofertório'
  | 'Santo'
  | 'Cordeiro de Deus'
  | 'Comunhão'
  | 'Ação de Graças'
  | 'Envio'
  | 'Geral';

export type CategoryTag =
  | 'Adoração'
  | 'Louvor'
  | 'Missa / Liturgia'
  | 'Mariana'
  | 'Espírito Santo'
  | 'Cura e Libertação'
  | 'Quaresma'
  | 'Páscoa'
  | 'Natal'
  | 'Jovem';

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
  liturgicalMoment: LiturgicalMoment;
  categories: CategoryTag[];
  coverGradient: string;
  tags: string[];
  content: string;
  parsedLines?: ChordLine[];
  videoUrl?: string;
  duration?: string;
}

export interface SetlistItem {
  songId: string;
  customKey: string;
  notes?: string;
  order: number;
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

export type UserPlanTier = 'free' | 'pro_musician' | 'pro_ministry';

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
  currentKey: string;
  semitoneShift: number;
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
