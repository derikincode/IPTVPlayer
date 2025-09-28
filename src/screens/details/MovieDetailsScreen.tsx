// src/screens/details/MovieDetailsScreen.tsx - VERSÃO ESTÁVEL
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { VODStream } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import XtreamAPI from '../../services/api/XtreamAPI';

const { width, height } = Dimensions.get('window');

type MovieDetailsScreenRouteProp = RouteProp<RootStackParamList, 'MovieDetails'>;
type MovieDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MovieDetails'>;

interface MovieInfo {
  info: {
    name: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releasedate: string;
    rating: string;
    duration: string;
    duration_secs: number;
    movie_image: string;
    trailer: string;
    country: string;
    language: string;
    age_rating: string;
    backdrop_path: string[];
    youtube_trailer: string;
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string;
    direct_source: string;
    rating: string;
    rating_5based: number;
  };
}

const MovieDetailsScreen = () => {
  const navigation = useNavigation<MovieDetailsScreenNavigationProp>();
  const route = useRoute<MovieDetailsScreenRouteProp>();
  const { movie } = route.params;
  
  // Estados
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlotExpanded, setIsPlotExpanded] = useState(false);
  const [showFullCast, setShowFullCast] = useState(false);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('transparent', true);
    loadMovieInfo();
    
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

  const loadMovieInfo = async () => {
    try {
      setLoading(true);
      console.log('🎬 Carregando informações do filme:', movie.stream_id);
      
      const info = await XtreamAPI.getVODInfo(movie.stream_id);
      console.log('📊 Informações recebidas:', info);
      
      setMovieInfo(info);
    } catch (error) {
      console.error('❌ Erro ao carregar informações do filme:', error);
      Alert.alert(
        'Aviso',
        'Não foi possível carregar todas as informações do filme. Exibindo dados básicos.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadMovieInfo();
    setRefreshing(false);
  }, []);

  // Funções auxiliares
  const getMovieTitle = () => {
    return movieInfo?.info?.name || movie.name || 'Título não disponível';
  };

  const getMovieYear = () => {
    if (movieInfo?.info?.releasedate) {
      const year = new Date(movieInfo.info.releasedate).getFullYear();
      return year.toString();
    }
    
    if (movie.added) {
      try {
        const year = new Date(parseInt(movie.added) * 1000).getFullYear();
        return year.toString();
      } catch {
        return 'N/A';
      }
    }
    
    return 'N/A';
  };

  const getMovieRating = () => {
    const rating = movieInfo?.info?.rating || movie.rating;
    if (rating && rating !== '0' && rating !== '0.0') {
      const numRating = parseFloat(rating);
      return numRating > 10 ? (numRating / 10).toFixed(1) : numRating.toFixed(1);
    }
    return '7.5';
  };

  const getMoviePlot = () => {
    const plot = movieInfo?.info?.plot;
    return plot && plot.trim() !== '' ? plot.trim() : 'Sinopse não disponível para este filme.';
  };

  const getMovieGenre = () => {
    const genre = movieInfo?.info?.genre;
    return genre && genre.trim() !== '' ? genre.trim() : 'Gênero não informado';
  };

  const getMovieDirector = () => {
    const director = movieInfo?.info?.director;
    return director && director.trim() !== '' ? director.trim() : 'Não informado';
  };

  const getMovieCast = () => {
    const cast = movieInfo?.info?.cast;
    return cast && cast.trim() !== '' ? cast.trim() : 'Elenco não informado';
  };

  const getMovieDuration = () => {
    if (movieInfo?.info?.duration && movieInfo.info.duration.trim() !== '') {
      return movieInfo.info.duration.trim();
    }
    
    if (movieInfo?.info?.duration_secs && movieInfo.info.duration_secs > 0) {
      const totalSeconds = movieInfo.info.duration_secs;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    }
    
    return '120m';
  };

  const getMovieImage = (): string | null => {
    if (movieInfo?.info?.movie_image) {
      return XtreamAPI.getImageURL(movieInfo.info.movie_image);
    }
    
    if (movieInfo?.info?.backdrop_path && movieInfo.info.backdrop_path.length > 0) {
      return XtreamAPI.getImageURL(movieInfo.info.backdrop_path[0]);
    }
    
    if (movie.stream_icon) {
      return movie.stream_icon;
    }
    
    return null;
  };

  const getQualityBadge = () => {
    const extension = movieInfo?.movie_data?.container_extension || movie.container_extension || '';
    
    if (extension.includes('4k') || extension.includes('uhd')) return '4K';
    if (extension.includes('1080') || extension.includes('fhd')) return 'HD';
    if (extension.includes('720') || extension.includes('hd')) return 'HD';
    
    return 'SD';
  };

  // Handlers
  const handlePlay = () => {
    Vibration.vibrate(50);
    try {
      const streamUrl = XtreamAPI.getVODURL(movie.stream_id, movie.container_extension);
      
      navigation.navigate('Player', {
        url: streamUrl,
        title: getMovieTitle(),
        type: 'vod',
        streamId: movie.stream_id,
      });
    } catch (error) {
      console.error('Erro ao obter URL do filme:', error);
      Alert.alert(
        'Erro',
        'Não foi possível reproduzir este filme. Tente novamente.',
        [{ text: 'OK' }]
      );
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
        message: `Confira este filme: ${getMovieTitle()} (${getMovieYear()})`,
        title: getMovieTitle(),
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const renderPlotText = () => {
    const plot = getMoviePlot();
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
    const cast = getMovieCast();
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
          {getMovieImage() ? (
            <Image
              source={{ uri: getMovieImage() as string }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderHero}>
              <Icon name="film" size={80} color="#666" />
            </View>
          )}
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#141414']}
            style={styles.heroOverlay}
          />
          
          {/* Movie Info Overlay */}
          <Animated.View 
            style={[
              styles.heroInfo,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.heroTitle}>{getMovieTitle()}</Text>
            
            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                <Icon name="calendar-outline" size={14} color="#ccc" />
                <Text style={styles.metaText}>{getMovieYear()}</Text>
              </View>
              
              <View style={styles.metaDivider} />
              
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={14} color="#ccc" />
                <Text style={styles.metaText}>{getMovieDuration()}</Text>
              </View>
              
              <View style={styles.metaDivider} />
              
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityText}>{getQualityBadge()}</Text>
              </View>
            </View>

            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{getMovieRating()}</Text>
              <Text style={styles.ratingMaxText}>/10</Text>
            </View>
          </Animated.View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Icon name="play" size={20} color="#fff" />
            <Text style={styles.playButtonText}>Assistir Agora</Text>
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

        {/* Movie Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Gênero</Text>
            <Text style={styles.detailValue}>{getMovieGenre()}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Diretor</Text>
            <Text style={styles.detailValue}>{getMovieDirector()}</Text>
          </View>
          
          {movieInfo?.info?.country && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>País</Text>
              <Text style={styles.detailValue}>{movieInfo.info.country}</Text>
            </View>
          )}
          
          {movieInfo?.info?.language && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Idioma</Text>
              <Text style={styles.detailValue}>{movieInfo.info.language}</Text>
            </View>
          )}
        </View>

        {/* Cast Section */}
        {renderCastSection()}

        {/* Trailer Section */}
        {movieInfo?.info?.youtube_trailer && (
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

export default MovieDetailsScreen;