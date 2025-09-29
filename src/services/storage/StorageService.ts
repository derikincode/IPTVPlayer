// src/services/storage/StorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XtreamCredentials, M3UCredentials, AppSettings } from '../../types';

class StorageService {
  private static readonly KEYS = {
    XTREAM_CREDENTIALS: '@iptv_xtream_credentials',
    M3U_CREDENTIALS: '@iptv_m3u_credentials',
    LOGIN_TYPE: '@iptv_login_type',
    FAVORITES: '@iptv_favorites',
    RECENT_CHANNELS: '@iptv_recent_channels',
    APP_SETTINGS: '@iptv_app_settings',
  };

  // ✅ MÉTODO GENÉRICO PARA BUSCAR CREDENCIAIS
  async getCredentials(): Promise<XtreamCredentials | M3UCredentials | null> {
    try {
      const loginType = await this.getLoginType();
      
      if (loginType === 'xtream') {
        return await this.getXtreamCredentials();
      } else if (loginType === 'm3u') {
        return await this.getM3UCredentials();
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error);
      return null;
    }
  }

  // Xtream Credentials
  async saveXtreamCredentials(credentials: XtreamCredentials): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.XTREAM_CREDENTIALS,
        JSON.stringify(credentials)
      );
      await AsyncStorage.setItem(StorageService.KEYS.LOGIN_TYPE, 'xtream');
    } catch (error) {
      console.error('Erro ao salvar credenciais Xtream:', error);
      throw error;
    }
  }

  async getXtreamCredentials(): Promise<XtreamCredentials | null> {
    try {
      const credentials = await AsyncStorage.getItem(
        StorageService.KEYS.XTREAM_CREDENTIALS
      );
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Erro ao buscar credenciais Xtream:', error);
      return null;
    }
  }

  // M3U Credentials
  async saveM3UCredentials(credentials: M3UCredentials): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.M3U_CREDENTIALS,
        JSON.stringify(credentials)
      );
      await AsyncStorage.setItem(StorageService.KEYS.LOGIN_TYPE, 'm3u');
    } catch (error) {
      console.error('Erro ao salvar credenciais M3U:', error);
      throw error;
    }
  }

  async getM3UCredentials(): Promise<M3UCredentials | null> {
    try {
      const credentials = await AsyncStorage.getItem(
        StorageService.KEYS.M3U_CREDENTIALS
      );
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Erro ao buscar credenciais M3U:', error);
      return null;
    }
  }

  // Login Type
  async getLoginType(): Promise<'xtream' | 'm3u' | null> {
    try {
      return (await AsyncStorage.getItem(StorageService.KEYS.LOGIN_TYPE)) as 'xtream' | 'm3u' | null;
    } catch (error) {
      console.error('Erro ao buscar tipo de login:', error);
      return null;
    }
  }

  // Favorites
  async addToFavorites(itemId: string, type: 'live' | 'vod' | 'series'): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const newFavorite = {
        id: itemId,
        type,
        addedAt: Date.now(),
      };
      
      // Avoid duplicates
      const exists = favorites.find(fav => fav.id === itemId && fav.type === type);
      if (!exists) {
        favorites.push(newFavorite);
        await AsyncStorage.setItem(
          StorageService.KEYS.FAVORITES,
          JSON.stringify(favorites)
        );
      }
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
      throw error;
    }
  }

  async removeFromFavorites(itemId: string, type: 'live' | 'vod' | 'series'): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter(fav => !(fav.id === itemId && fav.type === type));
      
      await AsyncStorage.setItem(
        StorageService.KEYS.FAVORITES,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error);
      throw error;
    }
  }

  async getFavorites(): Promise<Array<{id: string; type: 'live' | 'vod' | 'series'; addedAt: number}>> {
    try {
      const favorites = await AsyncStorage.getItem(StorageService.KEYS.FAVORITES);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      return [];
    }
  }

  async isFavorite(itemId: string, type: 'live' | 'vod' | 'series'): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(fav => fav.id === itemId && fav.type === type);
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }
  }

  // Recent Channels
  async addToRecentChannels(channelId: string, channelName: string): Promise<void> {
    try {
      const recent = await this.getRecentChannels();
      const newRecent = {
        id: channelId,
        name: channelName,
        watchedAt: Date.now(),
      };
      
      // Remove if already exists
      const filtered = recent.filter(channel => channel.id !== channelId);
      
      // Add to beginning
      filtered.unshift(newRecent);
      
      // Keep only last 20
      const limited = filtered.slice(0, 20);
      
      await AsyncStorage.setItem(
        StorageService.KEYS.RECENT_CHANNELS,
        JSON.stringify(limited)
      );
    } catch (error) {
      console.error('Erro ao adicionar canal recente:', error);
      throw error;
    }
  }

  async getRecentChannels(): Promise<Array<{id: string; name: string; watchedAt: number}>> {
    try {
      const recent = await AsyncStorage.getItem(StorageService.KEYS.RECENT_CHANNELS);
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Erro ao buscar canais recentes:', error);
      return [];
    }
  }

  // App Settings
  async saveAppSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.APP_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }

  async getAppSettings(): Promise<AppSettings | null> {
    try {
      const settings = await AsyncStorage.getItem(StorageService.KEYS.APP_SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return null;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(StorageService.KEYS));
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw error;
    }
  }

  // Clear cache only
  async clearCache(): Promise<void> {
    try {
      // Clear only cache-related data, keep credentials and settings
      await AsyncStorage.multiRemove([
        StorageService.KEYS.RECENT_CHANNELS,
        StorageService.KEYS.FAVORITES,
      ]);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      throw error;
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const loginType = await this.getLoginType();
      if (!loginType) return false;
      
      const credentials = await this.getCredentials();
      return credentials !== null;
    } catch (error) {
      console.error('Erro ao verificar login:', error);
      return false;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        StorageService.KEYS.XTREAM_CREDENTIALS,
        StorageService.KEYS.M3U_CREDENTIALS,
        StorageService.KEYS.LOGIN_TYPE,
      ]);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }
}

export default new StorageService();