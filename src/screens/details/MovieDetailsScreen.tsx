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

const { width } = Dimensions.get('window');

type MovieDetailsScreenRouteProp = RouteProp<RootStackParamList, 'MovieDetails'>;
type MovieDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MovieDetails'>;

const MovieDetailsScreen = () => {
  const navigation = useNavigation<MovieDetailsScreenNavigationProp>();
  const route = useRoute<MovieDetailsScreenRouteProp>();
  const { movie } = route.params;
  
  const [imageHeight, setImageHeight] = useState(200);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlotExpanded, setIsPlotExpanded] = useState(false);
  const [textIsTruncated, setTextIsTruncated] = useState(false);

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
    const playerData = {
      url: `http://your-server.com/movie/${movie.stream_id}.${movie.container_extension}`,
      title: movie.name,
      type: 'vod' as const,
      streamId: movie.stream_id,
    };
    navigation.navigate('Player', playerData);
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      `${movie.name} foi ${isFavorite ? 'removido dos' : 'adicionado aos'} seus favoritos.`
    );
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Funcionalidade de download será implementada em breve.');
  };

  const handleShare = () => {
    Alert.alert('Compartilhar', 'Funcionalidade de compartilhamento será implementada em breve.');
  };

  const getMovieYear = () => {
    if (movie.added) {
      return new Date(parseInt(movie.added) * 1000).getFullYear().toString();
    }
    return '2024';
  };

  const getMovieRating = () => {
    if (movie.rating_5based && movie.rating_5based > 0) {
      return movie.rating_5based.toFixed(1);
    }
    return '8.5';
  };

  // Função para renderizar sinopse com lógica expandível
  const renderPlotText = () => {
    const plotText = movie.plot || 'Uma história envolvente que combina elementos de ação e drama, explorando temas profundos através de personagens complexos e situações emocionantes que mantêm o espectador envolvido do início ao fim. Esta produção oferece uma experiência cinematográfica única com visuais impressionantes e uma narrativa cativante.';
    
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
    const plotText = movie.plot || 'Uma história envolvente que combina elementos de ação e drama, explorando temas profundos através de personagens complexos e situações emocionantes que mantêm o espectador envolvido do início ao fim. Esta produção oferece uma experiência cinematográfica única com visuais impressionantes e uma narrativa cativante.';
    
    // Verificação combinada: detecção automática + heurística
    return textIsTruncated || plotText.length > 200 || plotText.split(' ').length > 30;
  };

  return (
    <View style={styles.container}>
      {/* Header sobreposto */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Icon name="download-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Imagem do filme */}
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

        {/* Informações do filme */}
        <View style={styles.movieInfo}>
          <Text style={styles.title} numberOfLines={2}>{movie.name}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.yearText}>{getMovieYear()}</Text>
            
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#000" />
              <Text style={styles.ratingText}>{getMovieRating()}</Text>
            </View>
            
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>HD</Text>
            </View>
          </View>

          <Text style={styles.genre} numberOfLines={1}>
            {movie.genre || 'Ação, Drama'}
          </Text>

          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Icon name="play" size={18} color="#000" />
            <Text style={styles.playButtonText}>Assistir</Text>
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

        {/* Botões de ações secundárias */}
        <View style={styles.actionButtons}>
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleFavoriteToggle}>
              <Icon 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#dc3545" : "#fff"} 
              />
              <Text style={styles.actionButtonText}>
                {isFavorite ? 'Remover' : 'Favoritar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
              <Icon name="download-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  imageContainer: {
    width: width,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieImage: {
    width: width,
    resizeMode: 'contain',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  // Sinopse expandível
  plotSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  plot: {
    color: '#ddd',
    fontSize: 16,
    lineHeight: 24,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  expandButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  expandIcon: {
    marginLeft: 4,
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