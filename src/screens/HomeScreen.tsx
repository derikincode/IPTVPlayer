// src/screens/HomeScreen.tsx - VERSÃO LIMPA
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/Ionicons';
import StorageService from '../services/StorageService';
import UserManager from '../services/UserManager';
import XtreamAPI from '../services/XtreamAPI';
import OfflineMessage from '../components/OfflineMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserProfile } from '../types';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [recentChannels, setRecentChannels] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loginType, setLoginType] = useState<'xtream' | 'm3u' | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Migrar dados antigos se necessário
      await UserManager.migrateOldData();
      
      // Obter usuário atual
      const activeUser = await UserManager.getActiveUser();
      setCurrentUser(activeUser);

      if (activeUser) {
        setLoginType(activeUser.type);
        
        // Configurar credenciais do usuário ativo
        if (activeUser.type === 'xtream') {
          await XtreamAPI.authenticate(activeUser.credentials as any);
        }
      } else {
        // Verificar método antigo
        const type = await StorageService.getLoginType();
        setLoginType(type);

        if (type === 'xtream') {
          const credentials = await StorageService.getXtreamCredentials();
          if (credentials) {
            await XtreamAPI.authenticate(credentials);
          }
        }
      }

      const recent = await StorageService.getRecentChannels();
      setRecentChannels(recent.slice(0, 6));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserList = () => {
    navigation.navigate('UserList' as never);
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Deseja sair da conta atual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAllData();
            await UserManager.clearAllUserData();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    return <OfflineMessage onRetry={loadData} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>IPTV Player</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleUserList}>
            <Icon name="people" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
            <Icon name="settings" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('LiveTV' as never)}
        >
          <View style={styles.menuIcon}>
            <Icon name="tv" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Canais ao Vivo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Movies' as never)}
        >
          <View style={styles.menuIcon}>
            <Icon name="film" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Filmes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Series' as never)}
        >
          <View style={styles.menuIcon}>
            <Icon name="videocam" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Séries</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Search' as never)}
        >
          <View style={styles.menuIcon}>
            <Icon name="search" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Buscar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.settingsMenuItem]}
          onPress={handleSettings}
        >
          <View style={[styles.menuIcon, styles.settingsIcon]}>
            <Icon name="settings" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Configurações</Text>
        </TouchableOpacity>
      </View>

      {recentChannels.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Canais Recentes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentChannels.map((channel, index) => (
              <TouchableOpacity key={index} style={styles.recentItem}>
                <View style={styles.recentChannelIcon}>
                  <Text style={styles.recentChannelText}>
                    {channel.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.recentChannelName} numberOfLines={2}>
                  {channel.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  settingsMenuItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 0,
    marginRight: 15,
    backgroundColor: '#FF6B35',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  recentSection: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  recentItem: {
    width: 100,
    marginRight: 15,
    alignItems: 'center',
  },
  recentChannelIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentChannelText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recentChannelName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default HomeScreen;