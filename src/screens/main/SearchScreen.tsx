import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import XtreamAPI from '../../services/api/XtreamAPI';
import M3UParser from '../../services/parsers/M3UParser';
import StorageService from '../../services/storage/StorageService';
import SearchBar from '../../components/common/SearchBar';
import ChannelItem from '../../components/cards/ChannelItem';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OfflineMessage from '../../components/common/OfflineMessage';
import { LiveStream, VODStream, Series, M3UChannel } from '../../types';

interface SearchResult {
  type: 'live' | 'vod' | 'series' | 'm3u';
  item: LiveStream | VODStream | Series | M3UChannel;
}

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loginType, setLoginType] = useState<'xtream' | 'm3u' | null>(null);
  const [m3uChannels, setM3uChannels] = useState<M3UChannel[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    initializeSearch();
  }, []);

  const initializeSearch = async () => {
    try {
      const type = await StorageService.getLoginType();
      setLoginType(type);

      if (type === 'm3u') {
        const credentials = await StorageService.getM3UCredentials();
        if (credentials) {
          const channels = await M3UParser.parseM3U(credentials.url);
          setM3uChannels(channels);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar busca:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setSearchQuery(query);

    try {
      let results: SearchResult[] = [];

      if (loginType === 'xtream') {
        const searchData = await XtreamAPI.searchContent(query);
        
        // Add live streams
        searchData.live.forEach(item => {
          results.push({ type: 'live', item });
        });

        // Add VOD streams
        searchData.vod.forEach(item => {
          results.push({ type: 'vod', item });
        });

        // Add series
        searchData.series.forEach(item => {
          results.push({ type: 'series', item });
        });
      } else if (loginType === 'm3u') {
        const filteredChannels = M3UParser.searchChannels(m3uChannels, query);
        filteredChannels.forEach(item => {
          results.push({ type: 'm3u', item });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca:', error);
      Alert.alert('Erro', 'Falha ao realizar busca');
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (result: SearchResult) => {
    const { type, item } = result;

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

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const { type, item: resultItem } = item;
    let title = '';
    let subtitle = '';
    let imageUrl = '';
    let typeLabel = '';

    if (type === 'm3u') {
      const m3uItem = resultItem as M3UChannel;
      title = m3uItem.name;
      subtitle = m3uItem.group || '';
      imageUrl = m3uItem.logo || '';
      typeLabel = 'Canal';
    } else if (type === 'live') {
      const stream = resultItem as LiveStream;
      title = stream.name;
      subtitle = `Canal ${stream.num}`;
      imageUrl = stream.stream_icon;
      typeLabel = 'Canal ao Vivo';
    } else if (type === 'vod') {
      const stream = resultItem as VODStream;
      title = stream.name;
      subtitle = stream.rating ? `Rating: ${stream.rating}` : '';
      imageUrl = stream.stream_icon;
      typeLabel = 'Filme';
    } else if (type === 'series') {
      const serie = resultItem as Series;
      title = serie.name;
      subtitle = serie.genre;
      imageUrl = serie.cover;
      typeLabel = 'Série';
    }

    return (
      <ChannelItem
        title={title}
        subtitle={`${typeLabel} • ${subtitle}`}
        imageUrl={imageUrl}
        onPress={() => handleItemPress(item)}
      />
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    if (!searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Busca Global</Text>
          <Text style={styles.emptyText}>
            Digite o nome de um canal, filme ou série para buscar
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>😔</Text>
        <Text style={styles.emptyTitle}>Nenhum resultado</Text>
        <Text style={styles.emptyText}>
          Não encontramos nada para "{searchQuery}"
        </Text>
      </View>
    );
  };

  if (!isConnected) {
    return <OfflineMessage onRetry={initializeSearch} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Buscar canais, filmes e séries..."
          onSearch={handleSearch}
          loading={loading}
        />
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item.type}_${index}`}
          renderItem={renderSearchResult}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsFooter}>
          <Text style={styles.resultsCount}>
            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
          </Text>
        </View>
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
  searchContainer: {
    padding: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  resultsCount: {
    color: '#666',
    fontSize: 12,
  },
});

export default SearchScreen;