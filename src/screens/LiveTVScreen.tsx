// src/screens/LiveTVScreen.tsx - CORRIGIDO
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import XtreamAPI from '../services/XtreamAPI';
import M3UParser from '../services/M3UParser';
import StorageService from '../services/StorageService';
import CategoryCard from '../components/CategoryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import OfflineMessage from '../components/OfflineMessage';
import { Category, M3UChannel } from '../types';

const LiveTVScreen: React.FC = () => {
  const navigation = useNavigation<any>(); // Correção da tipagem
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [m3uCategories, setM3uCategories] = useState<{ [key: string]: M3UChannel[] }>({});
  const [loginType, setLoginType] = useState<'xtream' | 'm3u' | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const type = await StorageService.getLoginType();
      setLoginType(type);

      if (type === 'xtream') {
        const credentials = await StorageService.getXtreamCredentials();
        if (credentials) {
          await XtreamAPI.authenticate(credentials);
          const liveCategories = await XtreamAPI.getLiveCategories();
          setCategories(liveCategories);
        }
      } else if (type === 'm3u') {
        const credentials = await StorageService.getM3UCredentials();
        if (credentials) {
          const channels = await M3UParser.parseM3U(credentials.url);
          const grouped = M3UParser.groupChannelsByCategory(channels);
          setM3uCategories(grouped);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Falha ao carregar categorias de canais');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('Category', {
      categoryId,
      categoryName,
      type: 'live',
    });
  };

  const handleM3UCategoryPress = (categoryName: string, channels: M3UChannel[]) => {
    navigation.navigate('Category', {
      categoryName,
      type: 'm3u',
      channels,
    });
  };

  const renderXtreamCategories = () => {
    if (categories.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={categories}
        keyExtractor={(item) => item.category_id}
        renderItem={({ item }) => (
          <CategoryCard
            title={item.category_name}
            onPress={() => handleCategoryPress(item.category_id, item.category_name)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderM3UCategories = () => {
    const categoryNames = Object.keys(m3uCategories);
    
    if (categoryNames.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={categoryNames}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <CategoryCard
            title={item}
            subtitle={`${m3uCategories[item].length} canais`}
            onPress={() => handleM3UCategoryPress(item, m3uCategories[item])}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    return <OfflineMessage onRetry={loadCategories} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Canais ao Vivo</Text>
      </View>
      
      {loginType === 'xtream' ? renderXtreamCategories() : renderM3UCategories()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LiveTVScreen;