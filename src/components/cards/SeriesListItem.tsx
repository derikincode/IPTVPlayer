// src/components/cards/SeriesListItem.tsx - ATUALIZADO
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Series } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 cards per row with margins

interface SeriesListItemProps {
  series: Series; // Agora recebe o objeto completo da série
  onPress: (series: Series) => void; // Passa o objeto completo
  onWatchPress?: (series: Series) => void; // Função separada para assistir
  featured?: boolean;
}

const SeriesListItem: React.FC<SeriesListItemProps> = ({
  series,
  onPress,
  onWatchPress,
  featured = false,
}) => {
  const cardWidth = featured ? width - 40 : CARD_WIDTH;
  const cardHeight = featured ? 200 : 280;

  const getYear = () => {
    if (!series.releaseDate) return null;
    try {
      return new Date(series.releaseDate).getFullYear().toString();
    } catch {
      return series.releaseDate;
    }
  };

  const handleWatchPress = (e: any) => {
    e.stopPropagation(); // Previne que o onPress do card seja chamado
    if (onWatchPress) {
      onWatchPress(series);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cardWidth, height: cardHeight },
        featured && styles.featuredContainer,
      ]}
      onPress={() => onPress(series)} // Passa o objeto completo da série
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {series.cover ? (
          <Image
            source={{ uri: series.cover }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>📺</Text>
          </View>
        )}
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradientOverlay}
        />
        
        {/* Rating badge */}
        {series.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {series.rating}</Text>
          </View>
        )}

        {/* Series badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>SÉRIE</Text>
        </View>

        {/* Content container - apenas para os cartões featured */}
        {featured && (
          <View style={styles.contentContainer}>
            <View style={styles.metaContainer}>
              {getYear() && (
                <Text style={styles.metaText}>{getYear()}</Text>
              )}
              {series.genre && getYear() && (
                <Text style={styles.metaSeparator}>•</Text>
              )}
              {series.genre && (
                <Text style={styles.metaText} numberOfLines={1}>
                  {series.genre}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.watchButton}
              onPress={handleWatchPress}
            >
              <Text style={styles.watchButtonText}>▶ Ver Episódios</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  featuredContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  typeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    color: '#ccc',
    fontSize: 12,
  },
  metaSeparator: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 6,
  },
  watchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SeriesListItem;