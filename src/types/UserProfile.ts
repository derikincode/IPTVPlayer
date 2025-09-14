// src/types/UserProfile.ts
export interface UserProfile {
  id: string;
  name: string;
  type: 'xtream' | 'm3u';
  credentials: XtreamCredentials | M3UCredentials;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
}

export interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

export interface M3UCredentials {
  url: string;
}

// Adicionar ao arquivo src/types/index.ts existente
export interface UserProfile {
  id: string;
  name: string;
  type: 'xtream' | 'm3u';
  credentials: XtreamCredentials | M3UCredentials;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
}