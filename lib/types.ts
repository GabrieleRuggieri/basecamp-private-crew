/**
 * Tipi TypeScript per BASECAMP.
 * BasecampSession = dati in cookie dopo login NFC.
 * Altri tipi = modelli DB (members, gym, thoughts, travels, watchlist, moments, reactions).
 */
export type BasecampSession = {
  memberId: string;
  name: string;
  emoji: string;
  role: 'admin' | 'member';
};

export type Member = {
  id: string;
  nfc_token: string;
  name: string;
  emoji: string;
  role: 'admin' | 'member';
  active: boolean;
  created_at?: string;
};

export type GymSession = {
  id: string;
  member_id: string;
  started_at: string;
  ended_at: string | null;
  mood: string | null;
  note: string | null;
};

export type GymSet = {
  id: string;
  session_id: string;
  exercise: string;
  weight_kg: number | null;
  reps: number | null;
};

export type Travel = {
  id: string;
  member_id: string;
  place: string;
  country: string | null;
  visited: boolean;
  visited_at: string | null;
};

export type ThoughtTag = 'side_quest' | 'riflessione' | 'proposta';

export type Thought = {
  id: string;
  member_id: string;
  content: string;
  mood_tag?: string | null;
  tags: ThoughtTag[];
  anonymous: boolean;
  created_at: string;
};

export type WatchlistItem = {
  id: string;
  member_id: string;
  title: string;
  type: string | null;
  status: 'want' | 'doing' | 'done';
};

export type Moment = {
  id: string;
  member_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

export type Reaction = {
  id: string;
  member_id: string;
  target_type: string;
  target_id: string;
  emoji: string | null;
  comment: string | null;
};
