import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import XtreamAPI from '../../services/api/XtreamAPI';
import StorageService from '../../services/storage/StorageService';
import { VODStream } from '../../types';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  movie: VODStream;
}

const MovieDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { movie } = route.params as RouteParams;
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageHeight, setImageHeight] = useState<number>(500);

  useEffect(() => {
    console.log('🎬 Movie Object:', JSON.stringify(movie, null, 2));
  }, []);

  useEffect(() => {
    StatusBar.setHidden(true);
    checkFavoriteStatus();
    
    return () => {
      StatusBar.setHidden(false);
    };
  }, []);

  const checkFavoriteStatus = async () => {
    try {
      const favorite = await StorageService.isFavorite(movie.stream_id.toString(), 'vod');
      setIsFavorite(favorite);
    } catch (error) {
      console.log('Erro ao verificar favorito:', error);
      setIsFavorite(false);
    }
  };

  const handlePlay = () => {
    try {
      const url = XtreamAPI.getVODURL(movie.stream_id, movie.container_extension);
      navigation.navigate('Player', {
        url,
        title: movie.name,
        type: 'vod',
        streamId: movie.stream_id,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reproduzir este filme.');
    }
  };

  const handleDownload = () => {
    Alert.alert(
      'Download',
      'Funcionalidade de download será implementada em breve.',
      [{ text: 'OK' }]
    );
  };

  const handleFavoriteToggle = async () => {
    try {
      if (isFavorite) {
        await StorageService.removeFromFavorites(movie.stream_id.toString(), 'vod');
        setIsFavorite(false);
      } else {
        await StorageService.addToFavorites(movie.stream_id.toString(), 'vod');
        setIsFavorite(true);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar favoritos');
    }
  };

  const handleShare = () => {
    Alert.alert(
      'Compartilhar',
      `Compartilhar "${movie.name}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartilhar', onPress: () => {} },
      ]
    );
  };

  const getMovieYear = () => {
    if (!movie.added) return 'N/A';
    try {
      return new Date(parseInt(movie.added) * 1000).getFullYear().toString();
    } catch {
      return 'N/A';
    }
  };

  const getMovieRating = () => {
    return movie.rating ? parseFloat(movie.rating).toFixed(1) : 'N/A';
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleImageLoad = (event: any) => {
    const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
    console.log('Image dimensions:', imgWidth, 'x', imgHeight);
    
    // Calcula altura ideal baseada na proporção da imagem
    const aspectRatio = imgWidth / imgHeight;
    let optimalHeight = 500; // Altura padrão
    
    // Para imagens muito largas (paisagem), limitamos a altura
    if (aspectRatio > 1.5) {
      optimalHeight = Math.min(400, width / aspectRatio);
    }
    // Para imagens muito altas (retrato), limitamos a altura máxima
    else if (aspectRatio < 0.6) {
      optimalHeight = Math.min(600, width / aspectRatio);
    }
    // Para proporções normais de poster (entre 0.6 e 1.5)
    else {
      optimalHeight = width / aspectRatio;
    }
    
    setImageHeight(optimalHeight);
  };

  return (
    <View style={styles.container}>
      {/* Header sobreposto apenas na imagem */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
        >
          <Icon name="download-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Container scrollável */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagem do filme - AUTO-AJUSTADA DINAMICAMENTE */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {movie.stream_icon ? (
            <Image
              source={{ uri: movie.stream_icon }}
              style={[styles.movieImage, { height: imageHeight }]}
              resizeMode="contain"
              onLoad={handleImageLoad}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="film" size={80} color="#666" />
            </View>
          )}
        </View>

        {/* Informações do filme - SEPARADAS da imagem */}
        <View style={styles.movieInfo}>
          {/* Título */}
          <Text style={styles.title} numberOfLines={2}>{movie.name}</Text>
          
          {/* Meta informações em linha */}
          <View style={styles.metaRow}>
            <Text style={styles.yearText}>{getMovieYear()}</Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#000" />
              <Text style={styles.ratingText}>{getMovieRating()}</Text>
            </View>
            
            {/* Badge de qualidade */}
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>HD</Text>
            </View>
          </View>

          {/* Genre */}
          <Text style={styles.genre} numberOfLines={1}>
            {movie.genre || 'Ação, Drama'}
          </Text>

          {/* Botão de Play principal */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlay}
          >
            <Icon name="play" size={18} color="#000" />
            <Text style={styles.playButtonText}>Assistir</Text>
          </TouchableOpacity>
        </View>

        {/* Sinopse */}
        <View style={styles.plotSection}>
          <Text style={styles.plot}>
            {movie.plot || 'Uma história envolvente que combina elementos de ação e drama, explorando temas profundos através de personagens complexos e situações emocionantes que mantêm o espectador envolvido do início ao fim. Esta produção oferece uma experiência cinematográfica única com visuais impressionantes e uma narrativa cativante.'}
          </Text>
        </View>

        {/* Botões de ações secundárias */}
        <View style={styles.actionButtons}>
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFavoriteToggle}
            >
              <Icon 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#dc3545" : "#fff"} 
              />
              <Text style={styles.actionButtonText}>
                {isFavorite ? 'Remover' : 'Favoritar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownload}
            >
              <Icon name="download-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Icon name="share-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção de informações */}
        <View style={styles.castSection}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Diretor:</Text>
            <Text style={styles.castValue}>
              {movie.director || 'Christopher Nolan'}
            </Text>
          </View>

          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Elenco:</Text>
            <Text style={styles.castValue}>
              {movie.cast || 'Matthew McConaughey, Anne Hathaway, Jessica Chastain'}
            </Text>
          </View>

          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Gênero:</Text>
            <Text style={styles.castValue}>
              {movie.genre || 'Ficção Científica, Drama, Aventura'}
            </Text>
          </View>

          <View style={styles.castItem}>
            <Text style={styles.castLabel}>Duração:</Text>
            <Text style={styles.castValue}>2h 49m</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  // Header sobreposto apenas na imagem
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Container scrollável
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  // Imagem do filme - AUTO-AJUSTADA DINAMICAMENTE
  imageContainer: {
    width: width,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    // Altura será definida dinamicamente via props
  },
  movieImage: {
    width: width,
    resizeMode: 'contain', // Garante que toda imagem seja visível
    // Altura será definida dinamicamente via props
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Informações do filme - SEPARADAS da imagem
  movieInfo: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  yearText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 12,
  },
  ratingText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  qualityBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qualityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  genre: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 6,
    alignSelf: 'stretch',
  },
  playButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Sinopse
  plotSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  plot: {
    color: '#ddd',
    fontSize: 16,
    lineHeight: 24,
  },
  // Botões de ação
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  // Informações adicionais
  castSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  castItem: {
    marginBottom: 12,
  },
  castLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  castValue: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
});

export default MovieDetailsScreen;