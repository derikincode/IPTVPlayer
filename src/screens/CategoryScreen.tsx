// src/screens/CategoryScreen.tsx - COMPLETO E CORRIGIDO
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import XtreamAPI from '../services/XtreamAPI';
import ChannelItem from '../components/ChannelItem';
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
  const [items, setItems] = useState<(LiveStream | VODStream | Series | M3UChannel)[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (type === 'm3u' && channels) {
      setItems(channels);
      setLoading(false);
    } else {
      loadItems();
    }
  }, []);

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

      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      Alert.alert('Erro', 'Falha ao carregar conteúdo');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    return <OfflineMessage onRetry={loadItems} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{categoryName}</Text>
        <Text style={styles.subtitle}>
          {items.length} {type === 'live' || type === 'm3u' ? 'canais' : 
           type === 'vod' ? 'filmes' : 'séries'}
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum item encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={items}
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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

export default CategoryScreen;