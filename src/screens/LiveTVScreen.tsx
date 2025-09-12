import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/Ionicons';
import XtreamAPI from '../services/XtreamAPI';
import M3UParser from '../services/M3UParser';
import StorageService from '../services/StorageService';
import CategoryCard from '../components/CategoryCard';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import OfflineMessage from '../components/OfflineMessage';
import { getCategoryIcon } from '../utils/iconConfig';
import { Category, M3UChannel } from '../types';

const LiveTVScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [m3uCategories, setM3uCategories] = useState<{ [key: string]: M3UChannel[] }>({});
  const [loginType, setLoginType] = useState<'xtream' | 'm3u' | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search');
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const filteredCategories = () => {
    if (!searchQuery.trim()) {
      return categories;
    }
    
    const query = searchQuery.toLowerCase();
    return categories.filter(category =>
      category.category_name.toLowerCase().includes(query)
    );
  };

  const filteredM3UCategories = () => {
    if (!searchQuery.trim()) {
      return Object.keys(m3uCategories);
    }
    
    const query = searchQuery.toLowerCase();
    return Object.keys(m3uCategories).filter(categoryName =>
      categoryName.toLowerCase().includes(query)
    );
  };

  const renderXtreamCategories = () => {
    const filtered = filteredCategories();
    
    // Criar array com "Todos os Canais" no início (quando não está pesquisando)
    const allCategories = [];
    
    // Adicionar categoria "Todos os Canais" apenas quando não está pesquisando
    if (!searchQuery.trim()) {
      allCategories.push({
        category_id: 'all_channels',
        category_name: 'Todos os Canais',
        parent_id: 0,
      });
    }
    
    // Adicionar as categorias existentes
    allCategories.push(...filtered);
    
    if (allCategories.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={48} color="#666" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            {searchQuery ? `Nenhuma categoria encontrada para "${searchQuery}"` : 'Nenhuma categoria encontrada'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={allCategories}
        keyExtractor={(item) => item.category_id}
        renderItem={({ item }) => {
          const iconConfig = getCategoryIcon(item.category_name, 'live');
          
          return (
            <CategoryCard
              title={item.category_name}
              onPress={() => handleCategoryPress(item.category_id, item.category_name)}
              iconName={iconConfig.name}
              iconLibrary={iconConfig.library}
            />
          );
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderM3UCategories = () => {
    const filtered = filteredM3UCategories();
    
    // Criar array com "Todos os Canais" no início (quando não está pesquisando)
    const allCategories = [];
    
    // Adicionar categoria "Todos os Canais" apenas quando não está pesquisando
    if (!searchQuery.trim()) {
      allCategories.push('Todos os Canais');
    }
    
    // Adicionar as categorias existentes
    allCategories.push(...filtered);
    
    if (allCategories.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={48} color="#666" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            {searchQuery ? `Nenhuma categoria encontrada para "${searchQuery}"` : 'Nenhuma categoria encontrada'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={allCategories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          // Para a categoria "Todos os Canais", combinar todos os canais
          if (item === 'Todos os Canais') {
            const allChannels = Object.values(m3uCategories).flat();
            return (
              <CategoryCard
                title={item}
                subtitle={`${allChannels.length} canais`}
                onPress={() => handleM3UCategoryPress(item, allChannels)}
                iconName="tv"
                iconLibrary="ionicons"
              />
            );
          }
          
          const iconConfig = getCategoryIcon(item, 'live');
          
          return (
            <CategoryCard
              title={item}
              subtitle={`${m3uCategories[item].length} canais`}
              onPress={() => handleM3UCategoryPress(item, m3uCategories[item])}
              iconName={iconConfig.name}
              iconLibrary={iconConfig.library}
            />
          );
        }}
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
        <View style={styles.headerTop}>
          <Text style={styles.title}>Canais ao Vivo</Text>
          <TouchableOpacity
            style={[styles.searchButton, showSearch && styles.searchButtonActive]}
            onPress={toggleSearch}
          >
            <Icon 
              name={showSearch ? "close" : "search"} 
              size={20} 
              color={showSearch ? '#007AFF' : '#fff'} 
            />
          </TouchableOpacity>
        </View>
        
        {showSearch && (
          <View style={styles.searchContainer}>
            <SearchBar
              placeholder="Buscar categorias..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSearch={handleSearch}
              autoFocus={true}
              compact={true}
              showButton={searchQuery.length > 0}
            />
          </View>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTop: {
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
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
  },
  searchButtonActive: {
    backgroundColor: '#1a3a5c',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 15,
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default LiveTVScreen;