// src/screens/MoviesScreen.tsx - CORRIGIDO
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
import StorageService from '../services/StorageService';
import CategoryCard from '../components/CategoryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import OfflineMessage from '../components/OfflineMessage';
import { Category } from '../types';

const MoviesScreen: React.FC = () => {
  const navigation = useNavigation<any>(); // Correção da tipagem
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
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
          const vodCategories = await XtreamAPI.getVODCategories();
          setCategories(vodCategories);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar categorias de filmes:', error);
      Alert.alert('Erro', 'Falha ao carregar categorias de filmes');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('Category', {
      categoryId,
      categoryName,
      type: 'vod',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    return <OfflineMessage onRetry={loadCategories} />;
  }

  if (loginType !== 'xtream') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filmes</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Filmes disponíveis apenas com Xtream Codes API
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filmes</Text>
      </View>
      
      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
        </View>
      ) : (
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
      )}
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

export default MoviesScreen;