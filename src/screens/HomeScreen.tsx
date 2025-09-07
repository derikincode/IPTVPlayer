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
import StorageService from '../services/StorageService';
import XtreamAPI from '../services/XtreamAPI';
import OfflineMessage from '../components/OfflineMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import AppIcon from '../components/AppIcon';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [recentChannels, setRecentChannels] = useState<any[]>([]);
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
      const type = await StorageService.getLoginType();
      setLoginType(type);

      if (type === 'xtream') {
        const credentials = await StorageService.getXtreamCredentials();
        if (credentials) {
          await XtreamAPI.authenticate(credentials);
        }
      }

      const recent = await StorageService.getRecentChannels();
      setRecentChannels(recent.slice(0, 6)); // Show only 6 recent channels
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <AppIcon name="logout" size={16} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('LiveTV' as never)}
        >
          <View style={styles.menuIcon}>
            <AppIcon name="tv" library="ionicons" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Canais ao Vivo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Movies' as never)}
        >
          <View style={styles.menuIcon}>
            <AppIcon name="movie" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Filmes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Series' as never)}
        >
          <View style={styles.menuIcon}>
            <AppIcon name="tv-outline" library="ionicons" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Séries</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Search' as never)}
        >
          <View style={styles.menuIcon}>
            <AppIcon name="search" size={28} color="#fff" />
          </View>
          <Text style={styles.menuText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {recentChannels.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Canais Recentes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentChannels.map((channel, index) => (
              <TouchableOpacity key={index} style={styles.recentItem}>
                <View style={styles.recentChannelIcon}>
                  <AppIcon 
                    name="tv" 
                    library="ionicons" 
                    size={24} 
                    color="#fff" 
                  />
                </View>
                <Text style={styles.recentChannelName} numberOfLines={2}>
                  {channel.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <AppIcon name="info" size={20} color="#007AFF" style={styles.infoIcon} />
          <Text style={styles.infoTitle}>Tipo de Conexão</Text>
        </View>
        <Text style={styles.infoText}>
          {loginType === 'xtream' ? 'Xtream Codes API' : 'Lista M3U'}
        </Text>
      </View>
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
  logoutButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 5,
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
  menuIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  recentSection: {
    padding: 20,
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
  recentChannelName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
  },
});

export default HomeScreen;