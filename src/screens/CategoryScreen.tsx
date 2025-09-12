// src/screens/CategoryScreen.tsx - COM ÍCONES REACT NATIVE
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/Ionicons';
import XtreamAPI from '../services/XtreamAPI';
import ChannelItem from '../components/ChannelItem';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import OfflineMessage from '../components/OfflineMessage';
import { LiveStream, VODStream, Series, M3UChannel } from '../types';

interface RouteParams {
  categoryId?: string;
  categoryName: string;
  type: 'live' | 'vod' | 'series' | 'm3u';
  channels?: M3UChannel[];
}

const CategoryScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { categoryId, categoryName, type, channels } = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [allItems, setAllItems] = useState<(LiveStream | VODStream | Series | M3UChannel)[]>([]);
  const [filteredItems, setFilteredItems] = useState<(LiveStream | VODStream | Series | M3UChannel)[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (type === 'm3u' && channels) {
      setAllItems(channels);
      setFilteredItems(channels);
      setLoading(false);
    } else {
      loadItems();
    }
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, allItems]);

  const loadItems = async () => {
    setLoading(true);
    try {
      let data: any[] = [];

      switch (type) {
        case 'live':
          data = await XtreamAPI.getLiveStreams(categoryId);
          break;
        case 'vod':
          data = await XtreamAPI.getVODStreams(categoryId);
          break;
        case 'series':
          data = await XtreamAPI.getSeries(categoryId);
          break;
      }

      setAllItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      Alert.alert('Erro', 'Falha ao carregar conteúdo');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(allItems);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allItems.filter((item: any) => {
      if (type === 'm3u') {
        const m3uItem = item as M3UChannel;
        return m3uItem.name.toLowerCase().includes(query) ||
               (m3uItem.group && m3uItem.group.toLowerCase().includes(query));
      } else if (type === 'live') {
        const stream = item as LiveStream;
        return stream.name.toLowerCase().includes(query);
      } else if (type === 'vod') {
        const stream = item as VODStream;
        return stream.name.toLowerCase().includes(query);
      } else if (type === 'series') {
        const serie = item as Series;
        return serie.name.toLowerCase().includes(query) ||
               (serie.genre && serie.genre.toLowerCase().includes(query));
      }
      return false;
    });

    setFilteredItems(filtered);
  };

  const handleItemPress = (item: any) => {
    if (type === 'm3u') {
      const m3uItem = item as M3UChannel;
      navigation.navigate('Player', {
        url: m3uItem.url,
        title: m3uItem.name,
        type: 'live',
      });
    } else if (type === 'live') {
      const stream = item as LiveStream;
      const url = XtreamAPI.getStreamURL(stream.stream_id);
      navigation.navigate('Player', {
        url,
        title: stream.name,
        type: 'live',
        streamId: stream.stream_id,
      });
    } else if (type === 'vod') {
      const stream = item as VODStream;
      const url = XtreamAPI.getVODURL(stream.stream_id, stream.container_extension);
      navigation.navigate('Player', {
        url,
        title: stream.name,
        type: 'vod',
        streamId: stream.stream_id,
      });
    } else if (type === 'series') {
      const serie = item as Series;
      Alert.alert('Série', `${serie.name}\n\n${serie.plot}`);
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderSearchBar = () => {
    if (!showSearch) return null;

    return (
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder={`Buscar em ${categoryName}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          compact={true}
        />
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    let title = '';
    let subtitle = '';
    let imageUrl = '';

    if (type === 'm3u') {
      const m3uItem = item as M3UChannel;
      title = m3uItem.name;
      subtitle = m3uItem.group || '';
      imageUrl = m3uItem.logo || '';
    } else if (type === 'live') {
      const stream = item as LiveStream;
      title = stream.name;
      subtitle = `Canal ${stream.num}`;
      imageUrl = stream.stream_icon;
    } else if (type === 'vod') {
      const stream = item as VODStream;
      title = stream.name;
      subtitle = stream.rating ? `Rating: ${stream.rating}` : '';
      imageUrl = stream.stream_icon;
    } else if (type === 'series') {
      const serie = item as Series;
      title = serie.name;
      subtitle = serie.genre;
      imageUrl = serie.cover;
    }

    return (
      <ChannelItem
        title={title}
        subtitle={subtitle}
        imageUrl={imageUrl}
        onPress={() => handleItemPress(item)}
      />
    );
  };

  const getKeyExtractor = (item: any, index: number): string => {
    if (type === 'm3u') {
      return `m3u_${item.name}_${index}`;
    } else if (type === 'live' || type === 'vod') {
      return `stream_${item.stream_id}_${index}`;
    } else if (type === 'series') {
      return `series_${item.series_id}_${index}`;
    }
    return `item_${index}`;
  };

  const getItemCountText = () => {
    const total = allItems.length;
    const filtered = filteredItems.length;
    
    if (searchQuery && filtered !== total) {
      return `${filtered} de ${total} ${type === 'live' || type === 'm3u' ? 'canais' : 
               type === 'vod' ? 'filmes' : 'séries'}`;
    }
    
    return `${total} ${type === 'live' || type === 'm3u' ? 'canais' : 
            type === 'vod' ? 'filmes' : 'séries'}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    return <OfflineMessage onRetry={loadItems} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{categoryName}</Text>
            <Text style={styles.subtitle}>{getItemCountText()}</Text>
          </View>
          
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
        
        {renderSearchBar()}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          {searchQuery ? (
            <>
              <Icon name="search" size={48} color="#666" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                Nenhum resultado para "{searchQuery}"
              </Text>
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={clearSearch}
              >
                <Icon name="close-circle" size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.clearSearchButtonText}>Limpar busca</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Icon name="folder-open-outline" size={48} color="#666" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>Nenhum item encontrado</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={getKeyExtractor}
          renderItem={renderItem}
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
    marginBottom: 20,
    lineHeight: 22,
  },
  clearSearchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 4,
  },
});

export default CategoryScreen;