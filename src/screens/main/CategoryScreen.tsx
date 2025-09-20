// src/screens/CategoryScreen.tsx - COMPLETO E ATUALIZADO
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
import XtreamAPI from '../../services/api/XtreamAPI';
import ChannelItem from '../../components/cards/ChannelItem';
import MovieListItem from '../../components/cards/MovieListItem';
import SeriesListItem from '../../components/cards/SeriesListItem';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OfflineMessage from '../../components/common/OfflineMessage';
import { LiveStream, VODStream, Series, M3UChannel } from '../../types';

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
          if (categoryId === 'all_channels' || !categoryId) {
            data = await XtreamAPI.getLiveStreams();
          } else {
            data = await XtreamAPI.getLiveStreams(categoryId);
          }
          break;
        case 'vod':
          if (categoryId === 'all_movies' || !categoryId) {
            data = await XtreamAPI.getVODStreams();
          } else {
            data = await XtreamAPI.getVODStreams(categoryId);
          }
          break;
        case 'series':
          if (categoryId === 'all_series' || !categoryId) {
            data = await XtreamAPI.getSeries();
          } else {
            data = await XtreamAPI.getSeries(categoryId);
          }
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
               (serie.genre && serie.genre.toLowerCase().includes(query)) ||
               (serie.plot && serie.plot.toLowerCase().includes(query));
      }
      return false;
    });

    setFilteredItems(filtered);
  };

  // HANDLERS ATUALIZADOS
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
      const movie = item as VODStream;
      // NOVO: Navegar para tela de detalhes em vez de reproduzir diretamente
      navigation.navigate('MovieDetails', { movie });
    } else if (type === 'series') {
      const series = item as Series;
      // NOVO: Navegar para tela de detalhes em vez de mostrar alert
      navigation.navigate('SeriesDetails', { series });
    }
  };

  // NOVO: Handler separado para reprodução direta
  const handlePlayPress = (item: any) => {
    if (type === 'vod') {
      const movie = item as VODStream;
      try {
        const url = XtreamAPI.getVODURL(movie.stream_id, movie.container_extension);
        navigation.navigate('Player', {
          url,
          title: movie.name,
          type: 'vod',
          streamId: movie.stream_id,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('Erro ao reproduzir filme:', errorMessage);
        Alert.alert('Erro', 'Não foi possível reproduzir este filme.');
      }
    }
  };

  // NOVO: Handler para "Ver Episódios"
  const handleWatchPress = (item: any) => {
    if (type === 'series') {
      const series = item as Series;
      Alert.alert('Em Desenvolvimento', 'Funcionalidade de episódios será implementada em breve');
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

  // RENDERIZADORES ATUALIZADOS
  const renderMovieItem = ({ item }: { item: any }) => {
    const vodItem = item as VODStream;
    
    return (
      <MovieListItem
        movie={vodItem} // Passa o objeto completo
        onPress={handleItemPress} // Vai para detalhes
        onPlayPress={handlePlayPress} // Reproduz diretamente
      />
    );
  };

  const renderSeriesItem = ({ item }: { item: any }) => {
    const seriesItem = item as Series;
    
    return (
      <SeriesListItem
        series={seriesItem} // Passa o objeto completo
        onPress={handleItemPress} // Vai para detalhes
        onWatchPress={handleWatchPress} // Ver episódios
      />
    );
  };

  const renderChannelItem = ({ item }: { item: any }) => {
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

  const getRenderItem = () => {
    switch (type) {
      case 'vod':
        return renderMovieItem;
      case 'series':
        return renderSeriesItem;
      default:
        return renderChannelItem;
    }
  };

  const getNumColumns = () => {
    return (type === 'vod' || type === 'series') ? 2 : 1;
  };

  const getContainerStyle = () => {
    return (type === 'vod' || type === 'series') ? styles.gridContainer : styles.listContainer;
  };

  const getColumnWrapperStyle = () => {
    return (type === 'vod' || type === 'series') ? styles.gridRow : undefined;
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
          renderItem={getRenderItem()}
          numColumns={getNumColumns()}
          key={`${type}_${getNumColumns()}`} // Force re-render when changing layout
          contentContainerStyle={getContainerStyle()}
          columnWrapperStyle={getColumnWrapperStyle()}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
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
  gridContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
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