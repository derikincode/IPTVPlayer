// Configuração centralizada de ícones para diferentes categorias
export const CATEGORY_ICONS = {
  // Categorias de TV ao vivo
  LIVE: {
    default: { name: 'tv', library: 'ionicons' as const },
    news: { name: 'newspaper', library: 'ionicons' as const },
    sports: { name: 'sports-football', library: 'ionicons' as const },
    entertainment: { name: 'game-controller', library: 'ionicons' as const },
    movies: { name: 'film', library: 'ionicons' as const },
    kids: { name: 'happy', library: 'ionicons' as const },
    music: { name: 'musical-notes', library: 'ionicons' as const },
    documentary: { name: 'library', library: 'ionicons' as const },
    religion: { name: 'church', library: 'materialcommunity' as const },
    international: { name: 'globe', library: 'ionicons' as const },
  },
  
  // Categorias de filmes
  VOD: {
    default: { name: 'movie', library: 'material' as const },
    action: { name: 'flash', library: 'ionicons' as const },
    comedy: { name: 'happy-outline', library: 'ionicons' as const },
    drama: { name: 'heart', library: 'ionicons' as const },
    horror: { name: 'skull', library: 'ionicons' as const },
    romance: { name: 'heart-outline', library: 'ionicons' as const },
    scifi: { name: 'rocket', library: 'ionicons' as const },
    thriller: { name: 'eye', library: 'ionicons' as const },
    animation: { name: 'color-palette', library: 'ionicons' as const },
    adventure: { name: 'compass', library: 'ionicons' as const },
  },

  // Categorias de séries
  SERIES: {
    default: { name: 'tv-outline', library: 'ionicons' as const },
    drama: { name: 'theater-masks', library: 'materialcommunity' as const },
    comedy: { name: 'emoticon-happy', library: 'materialcommunity' as const },
    crime: { name: 'shield-check', library: 'materialcommunity' as const },
    fantasy: { name: 'magic-staff', library: 'materialcommunity' as const },
    reality: { name: 'camera', library: 'ionicons' as const },
  },

  // Ícones do sistema
  SYSTEM: {
    home: { name: 'home', library: 'material' as const },
    search: { name: 'search', library: 'material' as const },
    settings: { name: 'settings', library: 'material' as const },
    favorite: { name: 'favorite', library: 'material' as const },
    download: { name: 'download', library: 'material' as const },
    history: { name: 'history', library: 'material' as const },
    logout: { name: 'logout', library: 'material' as const },
    folder: { name: 'folder', library: 'material' as const },
    info: { name: 'info', library: 'material' as const },
  },

  // Ícones do player
  PLAYER: {
    play: { name: 'play-arrow', library: 'material' as const },
    pause: { name: 'pause', library: 'material' as const },
    stop: { name: 'stop', library: 'material' as const },
    forward: { name: 'fast-forward', library: 'ionicons' as const },
    backward: { name: 'play-back', library: 'ionicons' as const },
    fullscreen: { name: 'fullscreen', library: 'material' as const },
    exitFullscreen: { name: 'fullscreen-exit', library: 'material' as const },
    volume: { name: 'volume-high', library: 'ionicons' as const },
    volumeMute: { name: 'volume-mute', library: 'ionicons' as const },
  },

  // Estados da aplicação
  STATE: {
    loading: { name: 'refresh', library: 'material' as const },
    error: { name: 'error', library: 'material' as const },
    success: { name: 'check-circle', library: 'material' as const },
    warning: { name: 'warning', library: 'material' as const },
    offline: { name: 'wifi-off', library: 'materialcommunity' as const },
    empty: { name: 'inbox', library: 'material' as const },
  }
};

// Função helper para obter ícone baseado na categoria
export const getCategoryIcon = (categoryName: string, type: 'live' | 'vod' | 'series' = 'live') => {
  const normalizedName = categoryName.toLowerCase();
  
  let categoryGroup;
  switch (type) {
    case 'vod':
      categoryGroup = CATEGORY_ICONS.VOD;
      break;
    case 'series':
      categoryGroup = CATEGORY_ICONS.SERIES;
      break;
    default:
      categoryGroup = CATEGORY_ICONS.LIVE;
  }

  // Procura por palavras-chave no nome da categoria
  for (const [key, icon] of Object.entries(categoryGroup)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon;
    }
  }

  // Retorna ícone padrão se não encontrar correspondência
  return categoryGroup.default;
};

// Mapeamento de qualidade de rede para ícones
export const getNetworkIcon = (quality: 'excellent' | 'good' | 'fair' | 'poor') => {
  const icons = {
    excellent: { name: 'wifi', library: 'ionicons' as const, color: '#28a745' },
    good: { name: 'wifi', library: 'ionicons' as const, color: '#ffc107' },
    fair: { name: 'wifi', library: 'ionicons' as const, color: '#fd7e14' },
    poor: { name: 'wifi', library: 'ionicons' as const, color: '#dc3545' },
  };
  
  return icons[quality];
};