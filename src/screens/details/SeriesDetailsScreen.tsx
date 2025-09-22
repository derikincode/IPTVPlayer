// src/screens/details/SeriesDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Series } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import XtreamAPI from '../../services/api/XtreamAPI';

const { width } = Dimensions.get('window');

type SeriesDetailsScreenRouteProp = RouteProp<RootStackParamList, 'SeriesDetails'>;
type SeriesDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SeriesDetails'>;

interface SeriesInfo {
  info: {
    name: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    rating: string;
    last_modified: string;
    cover: string;
    backdrop_path: string[];
    youtube_trailer: string;
    episode_run_time: string;
    category_id: string;
  };
  seasons: Array<{
    season_number: number;
    name: string;
    episode_count: number;
    cover: string;
    overview: string;
    air_date: string;
  }>;
  episodes: { [key: string]: Array<{
    id: string;
    episode_num: number;
    title: string;
    container_extension: string;
    info: {
      plot: string;
      duration: string;
      rating: string;
      air_date: string;
    };
  }> };
}

const SeriesDetailsScreen = () => {
  const navigation = useNavigation<SeriesDetailsScreenNavigationProp>();
  const route = useRoute<SeriesDetailsScreenRouteProp>();
  const { series } = route.params;
  
  const [imageHeight, setImageHeight] = useState(200);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlotExpanded, setIsPlotExpanded] = useState(false);
  const [textIsTruncated, setTextIsTruncated] = useState(false);
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeriesInfo();
  }, []);

  const loadSeriesInfo = async () => {
    try {
      setLoading(true);
      console.log('📺 Carregando informações da série:', series.series_id);
      
      const info = await XtreamAPI.getSeriesInfo(series.series_id);
      console.log('📊 Informações recebidas:', info);
      
      setSeriesInfo(info);
    } catch (error) {
      console.error('❌ Erro ao carregar informações da série:', error);
      Alert.alert(
        'Aviso',
        'Não foi possível carregar todas as informações da série. Exibindo dados básicos.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (event: any) => {
    const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
    const aspectRatio = imgHeight / imgWidth;
    const calculatedHeight = width * aspectRatio;
    const maxHeight = Dimensions.get('window').height * 0.6;
    setImageHeight(Math.min(calculatedHeight, maxHeight));
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleWatch = () => {
    try {
      // Para séries, podemos começar com o primeiro episódio da primeira temporada
      const firstSeasonKey = Object.keys(seriesInfo?.episodes || {}).sort()[0];
      const firstEpisode = seriesInfo?.episodes?.[firstSeasonKey]?.[0];
      
      if (firstEpisode) {
        const playerData = {
          url: XtreamAPI.getSeriesURL(
            series.series_id, 
            parseInt(firstSeasonKey), 
            firstEpisode.episode_num, 
            firstEpisode.container_extension
          ),
          title: `${getSeriesTitle()} - S${firstSeasonKey}E${firstEpisode.episode_num}`,
          type: 'vod' as const,
          streamId: series.series_id,
        };
        
        console.log('▶️ Iniciando reprodução da série:', playerData);
        navigation.navigate('Player', playerData);
      } else {
        Alert.alert('Aviso', 'Episódios não encontrados para esta série.');
      }
    } catch (error) {
      console.error('❌ Erro ao reproduzir série:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir esta série.');
    }
  };

  const handleDownload = () => {
    Alert.alert(
      'Download',
      'Funcionalidade de download será implementada em breve.\n\nEm desenvolvimento para próximas versões.',
      [{ text: 'OK' }]
    );
  };

  // Funções para obter dados reais da API
  const getSeriesTitle = () => {
    return seriesInfo?.info?.name || series.name || 'Título não disponível';
  };

  const getSeriesYear = () => {
    if (seriesInfo?.info?.releaseDate) {
      try {
        const year = new Date(seriesInfo.info.releaseDate).getFullYear();
        if (!isNaN(year) && year > 1900) {
          return year.toString();
        }
      } catch (error) {
        console.log('⚠️ Erro ao processar data de lançamento:', error);
      }
    }
    
    if (series.releaseDate) {
      try {
        const year = new Date(series.releaseDate).getFullYear();
        if (!isNaN(year) && year > 1900) {
          return year.toString();
        }
      } catch (error) {
        console.log('⚠️ Erro ao processar data de lançamento:', error);
      }
    }
    
    return '2024';
  };

  const getSeriesRating = () => {
    // Primeiro tenta o rating da API detalhada
    if (seriesInfo?.info?.rating) {
      const rating = parseFloat(seriesInfo.info.rating);
      if (!isNaN(rating) && rating > 0) {
        return rating.toFixed(1);
      }
    }
    
    // Depois tenta o rating básico
    if (series.rating_5based && series.rating_5based > 0) {
      return series.rating_5based.toFixed(1);
    }
    
    // Se tem rating em string, tenta converter
    if (series.rating) {
      const rating = parseFloat(series.rating);
      if (!isNaN(rating) && rating > 0) {
        return rating.toFixed(1);
      }
    }
    
    return '8.5';
  };

  const getSeriesPlot = () => {
    const plot = seriesInfo?.info?.plot || series.plot;
    
    if (!plot || plot.trim() === '') {
      return 'Sinopse não disponível no momento.';
    }
    
    return plot.trim();
  };

  const getSeriesGenre = () => {
    const genre = seriesInfo?.info?.genre || series.genre;
    return genre && genre.trim() !== '' ? genre.trim() : 'Não informado';
  };

  const getSeriesDirector = () => {
    const director = seriesInfo?.info?.director || series.director;
    return director && director.trim() !== '' ? director.trim() : 'Não informado';
  };

  const getSeriesCast = () => {
    const cast = seriesInfo?.info?.cast || series.cast;
    return cast && cast.trim() !== '' ? cast.trim() : 'Não informado';
  };

  const getEpisodeRunTime = () => {
    const runtime = seriesInfo?.info?.episode_run_time || series.episode_run_time;
    return runtime && runtime.trim() !== '' ? runtime.trim() : 'Não informado';
  };

  const getSeriesImage = (): string | null => {
    // Prioridade: cover da API > backdrop_path > cover básico
    if (seriesInfo?.info?.cover) {
      return XtreamAPI.getImageURL(seriesInfo.info.cover);
    }
    
    if (seriesInfo?.info?.backdrop_path && seriesInfo.info.backdrop_path.length > 0) {
      return XtreamAPI.getImageURL(seriesInfo.info.backdrop_path[0]);
    }
    
    if (series.cover) {
      return series.cover;
    }
    
    return null;
  };

  const getSeasonsCount = () => {
    const seasons = seriesInfo?.seasons || [];
    return seasons.length;
  };

  const getTotalEpisodes = () => {
    const episodes = seriesInfo?.episodes || {};
    const totalEpisodes = Object.values(episodes).reduce((total, seasonEpisodes) => {
      return total + seasonEpisodes.length;
    }, 0);
    return totalEpisodes;
  };

  // Função para renderizar sinopse com lógica expandível
  const renderPlotText = () => {
    const plotText = getSeriesPlot();
    
    if (!isPlotExpanded) {
      return (
        <Text 
          style={styles.plot} 
          numberOfLines={3}
          onTextLayout={(event) => {
            const { lines } = event.nativeEvent;
            setTextIsTruncated(lines.length >= 3);
          }}
        >
          {plotText}
        </Text>
      );
    }
    
    return (
      <Text style={styles.plot}>
        {plotText}
      </Text>
    );
  };

  const shouldShowExpandButton = () => {
    const plotText = getSeriesPlot();
    return textIsTruncated || plotText.length > 200 || plotText.split(' ').length > 30;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingContent}>
          <Icon name="videocam-outline" size={60} color="#666" />
          <Text style={styles.loadingText}>Carregando informações...</Text>
          <Text style={styles.loadingSubtext}>Aguarde um momento</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header sobreposto */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Imagem da série */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {getSeriesImage() ? (
            <Image
              source={{ uri: getSeriesImage() as string }}
              style={[styles.seriesImage, { height: imageHeight }]}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={() => {
                console.log('⚠️ Erro ao carregar imagem da série');
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="videocam" size={80} color="#666" />
              <Text style={styles.placeholderText}>Imagem não disponível</Text>
            </View>
          )}
        </View>

        {/* Informações da série */}
        <View style={styles.seriesInfo}>
          <Text style={styles.title} numberOfLines={2}>{getSeriesTitle()}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.yearText}>{getSeriesYear()}</Text>
            
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{getSeriesRating()}</Text>
            </View>
            
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>HD</Text>
            </View>

            {getSeasonsCount() > 0 && (
              <View style={styles.seasonsBadge}>
                <Text style={styles.seasonsText}>{getSeasonsCount()} Temporadas</Text>
              </View>
            )}
          </View>

          <Text style={styles.genre} numberOfLines={1}>
            {getSeriesGenre()}
          </Text>

          {/* Botão principal Assistir */}
          <TouchableOpacity style={styles.playButton} onPress={handleWatch}>
            <Icon name="play" size={18} color="#000" />
            <Text style={styles.playButtonText}>Assistir</Text>
          </TouchableOpacity>

          {/* Botão de Download */}
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <View style={styles.downloadIconContainer}>
              <Icon name="arrow-down" size={16} color="#fff" />
              <View style={styles.downloadUnderline} />
            </View>
            <Text style={styles.downloadButtonText}>Baixar</Text>
          </TouchableOpacity>
        </View>

        {/* Sinopse com expansão */}
        <View style={styles.plotSection}>
          {renderPlotText()}
          
          {shouldShowExpandButton() && (
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setIsPlotExpanded(!isPlotExpanded)}
            >
              <Text style={styles.expandButtonText}>
                {isPlotExpanded ? 'Menos' : 'Mais'}
              </Text>
              <Icon 
                name={isPlotExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#999" 
                style={styles.expandIcon}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Seção de informações */}
        <View style={styles.castSection}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Diretor:</Text>
            <Text style={styles.castValue}>
              {getSeriesDirector()}
            </Text>
          </View>

          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Elenco:</Text>
            <Text style={styles.castValue}>
              {getSeriesCast()}
            </Text>
          </View>

          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Gênero:</Text>
            <Text style={styles.castValue}>
              {getSeriesGenre()}
            </Text>
          </View>

          {getEpisodeRunTime() !== 'Não informado' && (
            <View style={styles.castItem}>
              <Text style={styles.castLabel}>Duração dos episódios:</Text>
              <Text style={styles.castValue}>{getEpisodeRunTime()}</Text>
            </View>
          )}

          {getSeasonsCount() > 0 && (
            <View style={styles.castItem}>
              <Text style={styles.castLabel}>Temporadas:</Text>
              <Text style={styles.castValue}>{getSeasonsCount()}</Text>
            </View>
          )}

          {getTotalEpisodes() > 0 && (
            <View style={styles.castItem}>
              <Text style={styles.castLabel}>Total de episódios:</Text>
              <Text style={styles.castValue}>{getTotalEpisodes()}</Text>
            </View>
          )}
        </View>

        {/* Trailer (se disponível) */}
        {seriesInfo?.info?.youtube_trailer && (
          <View style={styles.trailerSection}>
            <Text style={styles.sectionTitle}>Trailer</Text>
            <TouchableOpacity 
              style={styles.trailerButton}
              onPress={() => {
                Alert.alert(
                  'Trailer',
                  'Funcionalidade de trailer será implementada em breve.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Icon name="play-circle" size={24} color="#fff" />
              <Text style={styles.trailerButtonText}>Assistir Trailer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seriesImage: {
    width: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  seriesInfo: {
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  yearText: {
    color: '#999',
    fontSize: 14,
    marginRight: 15,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  qualityBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
  },
  qualityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  seasonsBadge: {
    backgroundColor: '#555',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  seasonsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  genre: {
    color: '#999',
    fontSize: 15,
    marginBottom: 24,
    fontWeight: '400',
  },
  playButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  playButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  downloadButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    marginBottom: 24,
  },
  downloadIconContainer: {
    position: 'relative',
    marginRight: 8,
  },
  downloadUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  plotSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  plot: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '400',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  expandButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIcon: {
    marginLeft: 4,
  },
  castSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  castItem: {
    marginBottom: 16,
  },
  castLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  castValue: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  trailerSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  trailerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SeriesDetailsScreen;