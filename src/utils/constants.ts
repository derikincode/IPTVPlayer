export const API_ENDPOINTS = {
  LIVE_CATEGORIES: 'get_live_categories',
  LIVE_STREAMS: 'get_live_streams',
  VOD_CATEGORIES: 'get_vod_categories',
  VOD_STREAMS: 'get_vod_streams',
  SERIES_CATEGORIES: 'get_series_categories',
  SERIES: 'get_series',
  EPG: 'get_short_epg',
  SERVER_INFO: 'get_server_info',
} as const;

export const STORAGE_KEYS = {
  XTREAM_CREDENTIALS: '@iptv_xtream_credentials',
  M3U_CREDENTIALS: '@iptv_m3u_credentials',
  LOGIN_TYPE: '@iptv_login_type',
  FAVORITES: '@iptv_favorites',
  RECENT_CHANNELS: '@iptv_recent_channels',
  APP_SETTINGS: '@iptv_app_settings',
  WATCH_HISTORY: '@iptv_watch_history',
} as const;

export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#FF6B35',
  BACKGROUND: '#1a1a1a',
  CARD_BACKGROUND: '#2a2a2a',
  SURFACE: '#3a3a3a',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#cccccc',
  TEXT_MUTED: '#666666',
  BORDER: '#333333',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  ERROR: '#dc3545',
  GRADIENT_START: '#1a1a1a',
  GRADIENT_END: '#2a2a2a',
} as const;

export const SIZES = {
  PADDING: 16,
  MARGIN: 16,
  BORDER_RADIUS: 8,
  ICON_SIZE: 24,
  AVATAR_SIZE: 40,
  HEADER_HEIGHT: 60,
  TAB_BAR_HEIGHT: 80,
} as const;

export const TYPOGRAPHY = {
  FONT_SIZE_SMALL: 12,
  FONT_SIZE_MEDIUM: 14,
  FONT_SIZE_LARGE: 16,
  FONT_SIZE_XL: 18,
  FONT_SIZE_XXL: 24,
  FONT_SIZE_TITLE: 28,
  FONT_WEIGHT_NORMAL: '400' as const,
  FONT_WEIGHT_MEDIUM: '500' as const,
  FONT_WEIGHT_BOLD: '700' as const,
} as const;

export const BUFFER_CONFIG = {
  DEFAULT: {
    minBufferMs: 15000,
    maxBufferMs: 50000,
    bufferForPlaybackMs: 2500,
    bufferForPlaybackAfterRebufferMs: 5000,
  },
  HIGH_QUALITY: {
    minBufferMs: 20000,
    maxBufferMs: 80000,
    bufferForPlaybackMs: 5000,
    bufferForPlaybackAfterRebufferMs: 8000,
  },
  LOW_LATENCY: {
    minBufferMs: 5000,
    maxBufferMs: 25000,
    bufferForPlaybackMs: 1000,
    bufferForPlaybackAfterRebufferMs: 2000,
  },
} as const;

export const VIDEO_QUALITIES = {
  AUTO: 'auto',
  HIGH: '1080p',
  MEDIUM: '720p',
  LOW: '480p',
} as const;