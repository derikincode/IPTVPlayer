// src/screens/details/SeriesDetailsScreen.tsx - VERSÃO ESTÁVEL MELHORADA
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  StatusBar,
  Share,
  Vibration,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { Series } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import XtreamAPI from '../../services/api/XtreamAPI';

const { width, height } = Dimensions.get('window');

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

interface Episode {
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
}

const SeriesDetailsScreen = () => {
  const navigation = useNavigation<SeriesDetailsScreenNavigationProp>();
  const route = useRoute<SeriesDetailsScreenRouteProp>();
  const { series } = route.params;
  
  // Estados
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlotExpanded, setIsPlotExpanded] = useState(false);
  const [showFullCast, setShowFullCast] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [showSeasons, setShowSeasons] = useState(false);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('transparent', true);
    loadSeriesInfo();
    
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  // Animação do header baseada no scroll
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const opacity = Math.min(value / 200, 1);
      headerOpacity.setValue(opacity);
    });

    return () => scrollY.removeListener(listener);
  }, []);

  const loadSeriesInfo = async () => {
    try {
      setLoading(true);
      console.log('📺 Carregando informações da série:', series.series_id);
      
      const info = await XtreamAPI.getSeriesInfo(series.series_id);
      console.log('📊 Informações recebidas:', info);
      
      setSeriesInfo(info);
      
      // Define a primeira temporada como selecionada
      if (info?.seasons && info.seasons.length > 0) {
        setSelectedSeason(info.seasons[0].season_number);
      }
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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadSeriesInfo();
    setRefreshing(false);
  }, []);

  // Funções auxiliares
  const getSeriesTitle = () => {
    return seriesInfo?.info?.name || series.name || 'Título não disponível';
  };

  const getSeriesYear = () => {
    if (seriesInfo?.info?.releaseDate) {
      const year = new Date(seriesInfo.info.releaseDate).getFullYear();
      return year.toString();
    }
    
    if (series.last_modified) {
      try {
        const year = new Date(parseInt(series.last_modified) * 1000).getFullYear();
        return year.toString();
      } catch {
        return 'N/A';
      }
    }
    
    return 'N/A';
  };

  const getSeriesRating = () => {
    const rating = seriesInfo?.info?.rating || series.rating;
    if (rating && rating !== '0' && rating !== '0.0') {
      const numRating = parseFloat(rating);
      return numRating > 10 ? (numRating / 10).toFixed(1) : numRating.toFixed(1);
    }
    return '8.0';
  };

  const getSeriesPlot = () => {
    const plot = seriesInfo?.info?.plot || series.plot;
    return plot && plot.trim() !== '' ? plot.trim() : 'Sinopse não disponível para esta série.';
  };

  const getSeriesGenre = () => {
    const genre = seriesInfo?.info?.genre || series.genre;
    return genre && genre.trim() !== '' ? genre.trim() : 'Gênero não informado';
  };

  const getSeriesDirector = () => {
    const director = seriesInfo?.info?.director || series.director;
    return director && director.trim() !== '' ? director.trim() : 'Não informado';
  };

  const getSeriesCast = () => {
    const cast = seriesInfo?.info?.cast || series.cast;
    return cast && cast.trim() !== '' ? cast.trim() : 'Elenco não informado';
  };

  const getEpisodeRunTime = () => {
    const runtime = seriesInfo?.info?.episode_run_time || series.episode_run_time;
    return runtime && runtime.trim() !== '' ? runtime.trim() : '45min';
  };

  const getSeriesImage = (): string | null => {
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

  const getQualityBadge = () => {
    // Para séries, podemos assumir HD como padrão
    return 'HD';
  };

  const getSelectedSeasonEpisodes = (): Episode[] => {
    if (!seriesInfo?.episodes) return [];
    return seriesInfo.episodes[selectedSeason.toString()] || [];
  };

  // Handlers
  const handlePlay = () => {
    Vibration.vibrate(50);
    try {
      const firstSeasonKey = Object.keys(seriesInfo?.episodes || {}).sort()[0];
      const firstEpisode = seriesInfo?.episodes?.[firstSeasonKey]?.[0];
      
      if (firstEpisode) {
        const streamUrl = XtreamAPI.getSeriesURL(
          series.series_id, 
          parseInt(firstSeasonKey), 
          firstEpisode.episode_num, 
          firstEpisode.container_extension
        );
        
        navigation.navigate('Player', {
          url: streamUrl,
          title: `${getSeriesTitle()} - S${firstSeasonKey}E${firstEpisode.episode_num}`,
          type: 'vod',
          streamId: series.series_id,
        });
      } else {
        Alert.alert('Aviso', 'Episódios não encontrados para esta série.');
      }
    } catch (error) {
      console.error('Erro ao obter URL da série:', error);
      Alert.alert(
        'Erro',
        'Não foi possível reproduzir esta série. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEpisodePlay = (episode: Episode, seasonNumber: number) => {
    Vibration.vibrate(30);
    try {
      const streamUrl = XtreamAPI.getSeriesURL(
        series.series_id,
        seasonNumber,
        episode.episode_num,
        episode.container_extension
      );

      navigation.navigate('Player', {
        url: streamUrl,
        title: `${getSeriesTitle()} - S${seasonNumber}E${episode.episode_num} - ${episode.title}`,
        type: 'vod',
        streamId: series.series_id,
      });
    } catch (error) {
      console.error('Erro ao reproduzir episódio:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir este episódio.');
    }
  };

  const handleFavorite = () => {
    Vibration.vibrate(50);
    setIsFavorite(!isFavorite);
  };

  const handleDownload = () => {
    Vibration.vibrate(50);
    Alert.alert(
      'Download',
      'Funcionalidade de download será implementada em breve.',
      [{ text: 'OK' }]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira esta série: ${getSeriesTitle()} (${getSeriesYear()})`,
        title: getSeriesTitle(),
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const renderPlotText = () => {
    const plot = getSeriesPlot();
    const plotLimit = 150;
    const shouldTruncate = plot.length > plotLimit;
    
    return (
      <View>
        <Text style={styles.plot}>
          {isPlotExpanded || !shouldTruncate ? plot : `${plot.substring(0, plotLimit)}...`}
        </Text>
        
        {shouldTruncate && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setIsPlotExpanded(!isPlotExpanded)}
          >
            <Text style={styles.expandButtonText}>
              {isPlotExpanded ? 'Mostrar menos' : 'Mostrar mais'}
            </Text>
            <Icon 
              name={isPlotExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#007AFF" 
              style={styles.expandIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCastSection = () => {
    const cast = getSeriesCast();
    if (cast === 'Elenco não informado') return null;

    const castList = cast.split(',').map(actor => actor.trim());
    const displayCast = showFullCast ? castList : castList.slice(0, 3);

    return (
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Elenco</Text>
        <View style={styles.castContainer}>
          {displayCast.map((actor, index) => (
            <View key={index} style={styles.castItem}>
              <Text style={styles.castName}>{actor}</Text>
            </View>
          ))}
          
          {castList.length > 3 && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowFullCast(!showFullCast)}
            >
              <Text style={styles.showMoreText}>
                {showFullCast ? 'Mostrar menos' : `+${castList.length - 3} mais`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSeasonSelector = () => {
    if (!seriesInfo?.seasons || seriesInfo.seasons.length <= 1) return null;

    const selectedSeasonData = seriesInfo.seasons.find(s => s.season_number === selectedSeason);

    return (
      <View style={styles.seasonSelectorContainer}>
        <Text style={styles.sectionTitle}>Temporadas</Text>
        
        <TouchableOpacity 
          style={styles.seasonDropdown}
          onPress={() => setShowSeasons(!showSeasons)}
        >
          <View style={styles.seasonDropdownContent}>
            <View style={styles.seasonDropdownLeft}>
              <Text style={styles.seasonDropdownTitle}>
                Temporada {selectedSeason}
              </Text>
              <Text style={styles.seasonDropdownSubtitle}>
                {selectedSeasonData?.episode_count || 0} episódios
              </Text>
            </View>
            
            <Icon 
              name={showSeasons ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#007AFF" 
            />
          </View>
        </TouchableOpacity>

        {showSeasons && (
          <View style={styles.seasonDropdownList}>
            {seriesInfo.seasons.map((season) => (
              <TouchableOpacity
                key={season.season_number}
                style={[
                  styles.seasonDropdownItem,
                  selectedSeason === season.season_number && styles.seasonDropdownItemActive
                ]}
                onPress={() => {
                  setSelectedSeason(season.season_number);
                  setShowSeasons(false);
                }}
              >
                <View style={styles.seasonDropdownItemContent}>
                  <Text style={[
                    styles.seasonDropdownItemTitle,
                    selectedSeason === season.season_number && styles.seasonDropdownItemTitleActive
                  ]}>
                    Temporada {season.season_number}
                  </Text>
                  <Text style={styles.seasonDropdownItemSubtitle}>
                    {season.episode_count} episódios
                  </Text>
                </View>
                
                {selectedSeason === season.season_number && (
                  <Icon name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEpisodeItem = ({ item: episode, index }: { item: Episode; index: number }) => (
    <TouchableOpacity 
      style={styles.episodeItem}
      onPress={() => handleEpisodePlay(episode, selectedSeason)}
    >
      {/* Thumbnail menor ao lado esquerdo */}
      <View style={styles.episodeThumbnail}>
        {getSeriesImage() ? (
          <Image
            source={{ uri: getSeriesImage() as string }}
            style={styles.episodeThumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.episodeThumbnailPlaceholder}>
            <Icon name="play" size={20} color="#666" />
          </View>
        )}
        
        {/* Botão play sobreposto */}
        <View style={styles.episodeThumbnailOverlay}>
          <View style={styles.episodePlayButton}>
            <Icon name="play" size={16} color="#fff" />
          </View>
        </View>
        
        {/* Duração no canto inferior direito */}
        {episode.info?.duration && (
          <View style={styles.episodeDuration}>
            <Text style={styles.episodeDurationText}>
              {episode.info.duration}
            </Text>
          </View>
        )}
      </View>
      
      {/* Informações do episódio ao lado direito */}
      <View style={styles.episodeContent}>
        <View style={styles.episodeHeader}>
          <Text style={styles.episodeTitle} numberOfLines={1}>
            {episode.episode_num}. {episode.title || `Episódio ${episode.episode_num}`}
          </Text>
          
          <TouchableOpacity style={styles.episodeDownloadButton}>
            <Icon name="download-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {episode.info?.plot && (
          <Text style={styles.episodePlot} numberOfLines={2}>
            {episode.info.plot}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEpisodesSection = () => {
    const episodes = getSelectedSeasonEpisodes();
    if (episodes.length === 0) return null;

    return (
      <View style={styles.episodesSection}>
        <View style={styles.episodesSectionHeader}>
          <Text style={styles.sectionTitle}>
            Temporada {selectedSeason} • {episodes.length} episódios
          </Text>
        </View>
        
        <FlatList
          data={episodes}
          renderItem={renderEpisodeItem}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando informações...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header fixo sempre visível */}
      <View style={styles.headerFixed}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Icon name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
              <Icon 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={22} 
                color={isFavorite ? "#FF6B6B" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Header com fundo animado */}
      <Animated.View style={[styles.headerBackground, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(20,20,20,0.95)', 'rgba(20,20,20,0.8)', 'transparent']}
          style={styles.headerGradient}
        />
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
            progressBackgroundColor="#2a2a2a"
          />
        }
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {getSeriesImage() ? (
            <Image
              source={{ uri: getSeriesImage() as string }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderHero}>
              <Icon name="tv" size={80} color="#666" />
            </View>
          )}
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#141414']}
            style={styles.heroOverlay}
          />
          
          {/* Series Info Overlay */}
          <Animated.View 
            style={[
              styles.heroInfo,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.heroTitle}>{getSeriesTitle()}</Text>
            
            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                <Icon name="calendar-outline" size={14} color="#ccc" />
                <Text style={styles.metaText}>{getSeriesYear()}</Text>
              </View>
              
              <View style={styles.metaDivider} />
              
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={14} color="#ccc" />
                <Text style={styles.metaText}>{getEpisodeRunTime()}</Text>
              </View>
              
              <View style={styles.metaDivider} />
              
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityText}>{getQualityBadge()}</Text>
              </View>
            </View>

            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{getSeriesRating()}</Text>
              <Text style={styles.ratingMaxText}>/10</Text>
            </View>

            <View style={styles.seriesStats}>
              <Text style={styles.statsText}>
                {getSeasonsCount()} temporada{getSeasonsCount() > 1 ? 's' : ''} • {getTotalEpisodes()} episódios
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Icon name="play" size={20} color="#fff" />
            <Text style={styles.playButtonText}>Assistir S1E1</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDownload}>
              <Icon name="download-outline" size={20} color="#fff" />
              <Text style={styles.secondaryButtonText}>Baixar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleFavorite}>
              <Icon 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorite ? "#FF6B6B" : "#fff"} 
              />
              <Text style={styles.secondaryButtonText}>
                {isFavorite ? 'Favoritado' : 'Favoritar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plot Section */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Sinopse</Text>
          {renderPlotText()}
        </View>

        {/* Series Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Gênero</Text>
            <Text style={styles.detailValue}>{getSeriesGenre()}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Criador</Text>
            <Text style={styles.detailValue}>{getSeriesDirector()}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duração do episódio</Text>
            <Text style={styles.detailValue}>{getEpisodeRunTime()}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Temporadas</Text>
            <Text style={styles.detailValue}>{getSeasonsCount()}</Text>
          </View>
        </View>

        {/* Cast Section */}
        {renderCastSection()}

        {/* Season Selector */}
        {renderSeasonSelector()}

        {/* Episodes Section */}
        {renderEpisodesSection()}

        {/* Trailer Section */}
        {seriesInfo?.info?.youtube_trailer && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Trailer</Text>
            <TouchableOpacity style={styles.trailerButton}>
              <Icon name="play-circle" size={24} color="#007AFF" />
              <Text style={styles.trailerButtonText}>Assistir Trailer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  heroContainer: {
    height: height * 0.6,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderHero: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#666',
    marginHorizontal: 12,
  },
  qualityBadge: {
    backgroundColor: 'rgba(0,122,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingMaxText: {
    color: '#999',
    fontSize: 14,
  },
  seriesStats: {
    marginTop: 4,
  },
  statsText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  actionSection: {
    padding: 20,
    gap: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  plot: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    gap: 4,
  },
  expandButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIcon: {
    marginLeft: 2,
  },
  detailsGrid: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  castContainer: {
    gap: 8,
  },
  castItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  castName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  showMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  showMoreText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  seasonSelectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  seasonDropdown: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  seasonDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  seasonDropdownLeft: {
    flex: 1,
  },
  seasonDropdownTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  seasonDropdownSubtitle: {
    color: '#999',
    fontSize: 14,
  },
  seasonDropdownList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  seasonDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  seasonDropdownItemActive: {
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  seasonDropdownItemContent: {
    flex: 1,
  },
  seasonDropdownItemTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  seasonDropdownItemTitleActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  seasonDropdownItemSubtitle: {
    color: '#999',
    fontSize: 13,
  },
  episodesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  episodesSectionHeader: {
    marginBottom: 16,
  },
  episodeItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 0,
  },
  episodeThumbnail: {
    width: 150,
    height: 84,
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
  },
  episodeThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  episodeThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeThumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  episodeDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  episodeDurationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  episodeContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-start',
  },
  episodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  episodeTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  episodeDownloadButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodePlot: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  trailerButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SeriesDetailsScreen;