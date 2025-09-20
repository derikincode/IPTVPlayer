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
import StorageService from '../../services/storage/StorageService';
import { Series } from '../../types';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  series: Series;
}

const SeriesDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { series } = route.params as RouteParams;
  
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    StatusBar.setHidden(true);
    checkFavoriteStatus();
    
    return () => {
      StatusBar.setHidden(false);
    };
  }, []);

  const checkFavoriteStatus = async () => {
    const favorite = await StorageService.isFavorite(series.series_id.toString(), 'series');
    setIsFavorite(favorite);
  };

  const handleViewEpisodes = () => {
    Alert.alert(
      'Episódios', 
      'Funcionalidade de episódios será implementada em breve.'
    );
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await StorageService.removeFromFavorites(series.series_id.toString(), 'series');
        setIsFavorite(false);
      } else {
        await StorageService.addToFavorites(series.series_id.toString(), 'series');
        setIsFavorite(true);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar favoritos');
    }
  };

  const handleShare = () => {
    Alert.alert(
      'Compartilhar',
      `Compartilhar "${series.name}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartilhar', onPress: () => {} },
      ]
    );
  };

  const getSeriesYear = () => {
    if (!series.releaseDate) return 'N/A';
    try {
      return new Date(series.releaseDate).getFullYear().toString();
    } catch {
      return series.releaseDate;
    }
  };

  const getSeriesRating = () => {
    return series.rating ? parseFloat(series.rating).toFixed(1) : 'N/A';
  };

  const getRuntime = () => {
    return series.episode_run_time || 'N/A';
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background Image */}
      <View style={styles.imageContainer}>
        {series.cover ? (
          <Image
            source={{ uri: series.cover }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="tv" size={80} color="#666" />
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
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Series Info */}
        <View style={styles.seriesInfo}>
          {/* Title */}
          <Text style={styles.title}>{series.name}</Text>
          
          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{getSeriesRating()}</Text>
            </View>
            
            <Text style={styles.yearText}>{getSeriesYear()}</Text>
            
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>SÉRIE</Text>
            </View>
          </View>

          {/* Genre */}
          {series.genre && (
            <Text style={styles.genre}>{series.genre}</Text>
          )}

          {/* Plot */}
          {series.plot && (
            <Text style={styles.plot}>{series.plot}</Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Watch Button */}
            <TouchableOpacity
              style={styles.watchButton}
              onPress={handleViewEpisodes}
            >
              <Icon name="play" size={20} color="#000" />
              <Text style={styles.watchButtonText}>Ver Episódios</Text>
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

          {/* Cast & Crew */}
          {(series.cast || series.director) && (
            <View style={styles.castSection}>
              <Text style={styles.sectionTitle}>Elenco e Produção</Text>
              
              {series.director && (
                <View style={styles.castItem}>
                  <Text style={styles.castLabel}>Direção:</Text>
                  <Text style={styles.castValue}>{series.director}</Text>
                </View>
              )}
              
              {series.cast && (
                <View style={styles.castItem}>
                  <Text style={styles.castLabel}>Elenco:</Text>
                  <Text style={styles.castValue}>{series.cast}</Text>
                </View>
              )}
            </View>
          )}

          {/* Series Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Detalhes</Text>
            
            {series.genre && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Gênero:</Text>
                <Text style={styles.detailValue}>{series.genre}</Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Data de Lançamento:</Text>
              <Text style={styles.detailValue}>{getSeriesYear()}</Text>
            </View>
            
            {series.episode_run_time && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Duração do Episódio:</Text>
                <Text style={styles.detailValue}>{getRuntime()}</Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ID da Série:</Text>
              <Text style={styles.detailValue}>{series.series_id}</Text>
            </View>
            
            {series.rating && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Avaliação:</Text>
                <View style={styles.ratingDetail}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={styles.detailValue}>{series.rating}/10</Text>
                </View>
              </View>
            )}

            {series.last_modified && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Última Atualização:</Text>
                <Text style={styles.detailValue}>
                  {new Date(series.last_modified).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            )}
          </View>

          {/* Trailer Section */}
          {series.youtube_trailer && (
            <View style={styles.trailerSection}>
              <Text style={styles.sectionTitle}>Trailer</Text>
              <TouchableOpacity style={styles.trailerButton}>
                <Icon name="logo-youtube" size={24} color="#FF0000" />
                <Text style={styles.trailerText}>Assistir Trailer</Text>
              </TouchableOpacity>
            </View>
          )}
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
  content: {
    flex: 1,
    marginTop: -100,
    zIndex: 5,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  seriesInfo: {
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
    marginBottom: 12,
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
  typeBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  genre: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  plot: {
    color: '#ddd',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButtons: {
    marginBottom: 30,
  },
  watchButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  watchButtonText: {
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
  castSection: {
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
  detailsSection: {
    marginBottom: 30,
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
  trailerSection: {
    marginBottom: 30,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  trailerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default SeriesDetailsScreen;