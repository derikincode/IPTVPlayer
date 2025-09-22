// src/screens/details/MovieDetailsScreen.tsx
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
import { VODStream } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import XtreamAPI from '../../services/api/XtreamAPI';

const { width } = Dimensions.get('window');

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
  
  const [imageHeight, setImageHeight] = useState(200);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlotExpanded, setIsPlotExpanded] = useState(false);
  const [textIsTruncated, setTextIsTruncated] = useState(false);
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovieInfo();
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
      // Usar dados básicos do movie se falhar
      Alert.alert(
        'Aviso',
        'Não foi possível carregar todas as informações do filme. Exibindo dados básicos.',
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

  const handlePlay = () => {
    try {
      const playerData = {
        url: XtreamAPI.getVODURL(movie.stream_id, movie.container_extension),
        title: getMovieTitle(),
        type: 'vod' as const,
        streamId: movie.stream_id,
      };
      
      console.log('▶️ Iniciando reprodução:', playerData);
      navigation.navigate('Player', playerData);
    } catch (error) {
      console.error('❌ Erro ao reproduzir filme:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir este filme.');
    }
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      `${getMovieTitle()} foi ${isFavorite ? 'removido dos' : 'adicionado aos'} seus favoritos.`
    );
  };

  const handleDownload = () => {
    Alert.alert(
      'Download',
      'Funcionalidade de download será implementada em breve.\n\nEm desenvolvimento para próximas versões.',
      [{ text: 'OK' }]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Compartilhar',
      'Funcionalidade de compartilhamento será implementada em breve.\n\nEm desenvolvimento para próximas versões.',
      [{ text: 'OK' }]
    );
  };

  // Funções para obter dados reais da API
  const getMovieTitle = () => {
    return movieInfo?.info?.name || movie.name || 'Título não disponível';
  };

  const getMovieYear = () => {
    if (movieInfo?.info?.releasedate) {
      try {
        const year = new Date(movieInfo.info.releasedate).getFullYear();
        if (!isNaN(year) && year > 1900) {
          return year.toString();
        }
      } catch (error) {
        console.log('⚠️ Erro ao processar data de lançamento:', error);
      }
    }
    
    if (movie.added) {
      try {
        const year = new Date(parseInt(movie.added) * 1000).getFullYear();
        if (!isNaN(year) && year > 1900) {
          return year.toString();
        }
      } catch (error) {
        console.log('⚠️ Erro ao processar data de adição:', error);
      }
    }
    
    return '2024';
  };

  const getMovieRating = () => {
    // Primeiro tenta o rating da API detalhada
    if (movieInfo?.info?.rating) {
      const rating = parseFloat(movieInfo.info.rating);
      if (!isNaN(rating) && rating > 0) {
        return rating.toFixed(1);
      }
    }
    
    // Depois tenta o rating básico
    if (movie.rating_5based && movie.rating_5based > 0) {
      return movie.rating_5based.toFixed(1);
    }
    
    // Se tem rating em string, tenta converter
    if (movie.rating) {
      const rating = parseFloat(movie.rating);
      if (!isNaN(rating) && rating > 0) {
        return rating.toFixed(1);
      }
    }
    
    return '8.5';
  };

  const getMoviePlot = () => {
    const plot = movieInfo?.info?.plot || movie.plot;
    
    if (!plot || plot.trim() === '') {
      return 'Sinopse não disponível no momento.';
    }
    
    return plot.trim();
  };

  const getMovieGenre = () => {
    const genre = movieInfo?.info?.genre || movie.genre;
    return genre && genre.trim() !== '' ? genre.trim() : 'Não informado';
  };

  const getMovieDirector = () => {
    const director = movieInfo?.info?.director || movie.director;
    return director && director.trim() !== '' ? director.trim() : 'Não informado';
  };

  const getMovieCast = () => {
    const cast = movieInfo?.info?.cast || movie.cast;
    return cast && cast.trim() !== '' ? cast.trim() : 'Não informado';
  };

  const getMovieCountry = () => {
    const country = movieInfo?.info?.country;
    return country && country.trim() !== '' ? country.trim() : null;
  };

  const getMovieLanguage = () => {
    const language = movieInfo?.info?.language;
    return language && language.trim() !== '' ? language.trim() : null;
  };

  const getMovieAgeRating = () => {
    const ageRating = movieInfo?.info?.age_rating;
    return ageRating && ageRating.trim() !== '' ? ageRating.trim() : null;
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
    
    return 'Não informado';
  };

  const getMovieImage = (): string | null => {
    // Prioridade: movie_image da API > backdrop_path > stream_icon básico
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
    // Baseado na extensão do container
    const extension = movie.container_extension?.toLowerCase();
    
    switch (extension) {
      case 'mkv':
      case 'mp4':
        return '4K';
      case 'avi':
        return 'HD';
      case 'ts':
        return 'HD';
      default:
        return 'HD';
    }
  };

  // Função para renderizar sinopse com lógica expandível
  const renderPlotText = () => {
    const plotText = getMoviePlot();
    
    if (!isPlotExpanded) {
      return (
        <Text 
          style={styles.plot} 
          numberOfLines={3}
          onTextLayout={(event) => {
            // Detecta se o texto foi truncado
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

  // Função para verificar se o texto precisa ser truncado
  const shouldShowExpandButton = () => {
    const plotText = getMoviePlot();
    
    // Verificação combinada: detecção automática + heurística
    return textIsTruncated || plotText.length > 200 || plotText.split(' ').length > 30;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingContent}>
          <Icon name="film-outline" size={60} color="#666" />
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
        {/* Imagem do filme */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {getMovieImage() ? (
            <Image
              source={{ uri: getMovieImage() as string }}
              style={[styles.movieImage, { height: imageHeight }]}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={() => {
                console.log('⚠️ Erro ao carregar imagem do filme');
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="film" size={80} color="#666" />
              <Text style={styles.placeholderText}>Imagem não disponível</Text>
            </View>
          )}
        </View>

        {/* Informações do filme */}
        <View style={styles.movieInfo}>
          <Text style={styles.title} numberOfLines={2}>{getMovieTitle()}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.yearText}>{getMovieYear()}</Text>
            
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{getMovieRating()}</Text>
            </View>
            
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>{getQualityBadge()}</Text>
            </View>

            {getMovieAgeRating() && (
              <View style={styles.ageRatingBadge}>
                <Text style={styles.ageRatingText}>{getMovieAgeRating()}</Text>
              </View>
            )}
          </View>

          <Text style={styles.genre} numberOfLines={1}>
            {getMovieGenre()}
          </Text>

          {/* Botão principal Assistir */}
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Icon name="play" size={18} color="#000" />
            <Text style={styles.playButtonText}>Assistir</Text>
          </TouchableOpacity>

          {/* Botão de Download - Logo abaixo do Assistir */}
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
              {getMovieDirector()}
            </Text>
          </View>

          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Elenco:</Text>
            <Text style={styles.castValue}>
              {getMovieCast()}
            </Text>
          </View>

          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Gênero:</Text>
            <Text style={styles.castValue}>
              {getMovieGenre()}
            </Text>
          </View>

          {getMovieLanguage() && (
            <View style={styles.castItem}>
              <Text style={styles.castLabel}>Idioma:</Text>
              <Text style={styles.castValue}>{getMovieLanguage()}</Text>
            </View>
          )}
        </View>

        {/* Trailer (se disponível) */}
        {movieInfo?.info?.youtube_trailer && (
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
  movieImage: {
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
  movieInfo: {
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
  ageRatingBadge: {
    backgroundColor: '#555',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ageRatingText: {
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

export default MovieDetailsScreen;
