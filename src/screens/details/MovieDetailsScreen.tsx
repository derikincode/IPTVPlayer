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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    StatusBar.setHidden(true);
    checkFavoriteStatus();
    
    return () => {
      StatusBar.setHidden(false);
    };
  }, []);

  const checkFavoriteStatus = async () => {
    const favorite = await StorageService.isFavorite(movie.stream_id.toString(), 'vod');
    setIsFavorite(favorite);
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

  const toggleFavorite = async () => {
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

  const getQualityBadge = () => {
    const ext = movie.container_extension?.toLowerCase();
    if (ext === 'mkv' || ext === 'mp4') return 'HD';
    return 'SD';
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background Image */}
      <View style={styles.imageContainer}>
        {movie.stream_icon ? (
          <Image
            source={{ uri: movie.stream_icon }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="film" size={80} color="#666" />
          </View>
        )}
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(26,26,26,0.7)', '#1a1a1a']}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Icon name="download-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Movie Info */}
        <View style={styles.movieInfo}>
          {/* Title */}
          <Text style={styles.title}>{movie.name}</Text>
          
          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{getMovieRating()}</Text>
            </View>
            
            <Text style={styles.yearText}>{getMovieYear()}</Text>
            
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>{getQualityBadge()}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Play Button */}
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlay}
            >
              <Icon name="play" size={20} color="#000" />
              <Text style={styles.playButtonText}>Assistir</Text>
            </TouchableOpacity>
            
            {/* Secondary Actions */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={toggleFavorite}
              >
                <Icon 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? "#FF6B35" : "#fff"} 
                />
                <Text style={styles.actionButtonText}>
                  {isFavorite ? 'Remover' : 'Minha Lista'}
                </Text>
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

          {/* Movie Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Detalhes</Text>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Formato:</Text>
              <Text style={styles.detailValue}>
                {movie.container_extension?.toUpperCase() || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Adicionado em:</Text>
              <Text style={styles.detailValue}>
                {movie.added ? 
                  new Date(parseInt(movie.added) * 1000).toLocaleDateString('pt-BR') 
                  : 'N/A'
                }
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ID do Stream:</Text>
              <Text style={styles.detailValue}>{movie.stream_id}</Text>
            </View>
            
            {movie.rating && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Avaliação:</Text>
                <View style={styles.ratingDetail}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={styles.detailValue}>{movie.rating}/10</Text>
                </View>
              </View>
            )}
          </View>

          {/* Technical Info */}
          <View style={styles.technicalSection}>
            <Text style={styles.sectionTitle}>Informações Técnicas</Text>
            
            <View style={styles.techGrid}>
              <View style={styles.techItem}>
                <Text style={styles.techLabel}>Qualidade</Text>
                <Text style={styles.techValue}>{getQualityBadge()}</Text>
              </View>
              
              <View style={styles.techItem}>
                <Text style={styles.techLabel}>Formato</Text>
                <Text style={styles.techValue}>
                  {movie.container_extension?.toUpperCase() || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.techItem}>
                <Text style={styles.techLabel}>Tipo</Text>
                <Text style={styles.techValue}>Filme</Text>
              </View>
            </View>
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
  imageContainer: {
    height: height * 0.6,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
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
  content: {
    flex: 1,
    marginTop: -100,
    zIndex: 5,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  movieInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 34,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  yearText: {
    color: '#ccc',
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
  actionButtons: {
    marginBottom: 30,
  },
  playButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  playButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
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
    color: '#ccc',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technicalSection: {
    marginBottom: 30,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  techItem: {
    width: '30%',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  techLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  techValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MovieDetailsScreen;