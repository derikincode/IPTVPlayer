// src/services/UserManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, XtreamCredentials, M3UCredentials } from '../types';

class UserManagerService {
  private static readonly STORAGE_KEY = '@iptv_user_profiles';
  private static readonly ACTIVE_USER_KEY = '@iptv_active_user';

  // Salvar perfis de usuários
  async saveUserProfiles(profiles: UserProfile[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        UserManagerService.STORAGE_KEY,
        JSON.stringify(profiles)
      );
    } catch (error) {
      console.error('Erro ao salvar perfis de usuários:', error);
      throw error;
    }
  }

  // Obter todos os perfis
  async getUserProfiles(): Promise<UserProfile[]> {
    try {
      const profiles = await AsyncStorage.getItem(UserManagerService.STORAGE_KEY);
      return profiles ? JSON.parse(profiles) : [];
    } catch (error) {
      console.error('Erro ao buscar perfis de usuários:', error);
      return [];
    }
  }

  // Criar novo perfil
  async createUserProfile(
    name: string,
    type: 'xtream' | 'm3u',
    credentials: XtreamCredentials | M3UCredentials
  ): Promise<UserProfile> {
    try {
      const profiles = await this.getUserProfiles();
      
      const newProfile: UserProfile = {
        id: Date.now().toString(),
        name: name.trim(),
        type,
        credentials,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isActive: false,
      };

      profiles.push(newProfile);
      await this.saveUserProfiles(profiles);
      
      return newProfile;
    } catch (error) {
      console.error('Erro ao criar perfil de usuário:', error);
      throw error;
    }
  }

  // Definir usuário ativo
  async setActiveUser(userId: string): Promise<void> {
    try {
      const profiles = await this.getUserProfiles();
      
      // Desativar todos os usuários
      profiles.forEach(profile => {
        profile.isActive = false;
      });

      // Ativar o usuário selecionado
      const targetProfile = profiles.find(p => p.id === userId);
      if (targetProfile) {
        targetProfile.isActive = true;
        targetProfile.lastUsed = Date.now();
      }

      await this.saveUserProfiles(profiles);
      await AsyncStorage.setItem(UserManagerService.ACTIVE_USER_KEY, userId);
    } catch (error) {
      console.error('Erro ao definir usuário ativo:', error);
      throw error;
    }
  }

  // Obter usuário ativo
  async getActiveUser(): Promise<UserProfile | null> {
    try {
      const activeUserId = await AsyncStorage.getItem(UserManagerService.ACTIVE_USER_KEY);
      if (!activeUserId) return null;

      const profiles = await this.getUserProfiles();
      return profiles.find(p => p.id === activeUserId) || null;
    } catch (error) {
      console.error('Erro ao buscar usuário ativo:', error);
      return null;
    }
  }

  // Excluir perfil
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      const profiles = await this.getUserProfiles();
      const filteredProfiles = profiles.filter(p => p.id !== userId);
      
      await this.saveUserProfiles(filteredProfiles);

      // Se o usuário deletado era o ativo, limpar
      const activeUserId = await AsyncStorage.getItem(UserManagerService.ACTIVE_USER_KEY);
      if (activeUserId === userId) {
        await AsyncStorage.removeItem(UserManagerService.ACTIVE_USER_KEY);
      }
    } catch (error) {
      console.error('Erro ao excluir perfil de usuário:', error);
      throw error;
    }
  }

  // Atualizar perfil
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const profiles = await this.getUserProfiles();
      const profileIndex = profiles.findIndex(p => p.id === userId);
      
      if (profileIndex !== -1) {
        profiles[profileIndex] = { ...profiles[profileIndex], ...updates };
        await this.saveUserProfiles(profiles);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil de usuário:', error);
      throw error;
    }
  }

  // Limpar todos os dados
  async clearAllUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        UserManagerService.STORAGE_KEY,
        UserManagerService.ACTIVE_USER_KEY,
      ]);
    } catch (error) {
      console.error('Erro ao limpar dados de usuários:', error);
      throw error;
    }
  }

  // Verificar se existe usuário ativo
  async hasActiveUser(): Promise<boolean> {
    try {
      const activeUser = await this.getActiveUser();
      return activeUser !== null;
    } catch (error) {
      return false;
    }
  }

  // Migrar dados antigos para o novo sistema
  async migrateOldData(): Promise<void> {
    try {
      const profiles = await this.getUserProfiles();
      
      // Se já tem perfis, não precisa migrar
      if (profiles.length > 0) return;

      // Verificar se existem credenciais antigas
      const oldXtreamCreds = await AsyncStorage.getItem('@iptv_xtream_credentials');
      const oldM3UCreds = await AsyncStorage.getItem('@iptv_m3u_credentials');
      const oldLoginType = await AsyncStorage.getItem('@iptv_login_type');

      if (oldXtreamCreds && oldLoginType === 'xtream') {
        const credentials = JSON.parse(oldXtreamCreds);
        await this.createUserProfile(
          `Usuário Principal (${credentials.username})`,
          'xtream',
          credentials
        );
      } else if (oldM3UCreds && oldLoginType === 'm3u') {
        const credentials = JSON.parse(oldM3UCreds);
        await this.createUserProfile(
          'Lista M3U Principal',
          'm3u',
          credentials
        );
      }
    } catch (error) {
      console.error('Erro na migração de dados antigos:', error);
    }
  }
}

export default new UserManagerService();