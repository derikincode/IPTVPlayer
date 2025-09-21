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
  series: Series;
  onPress: (series: Series) => void;
  onWatchPress?: (series: Series) => void;
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
    e.stopPropagation();
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
      onPress={() => onPress(series)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {series.cover ? (
          <Image
            source={{ uri: series.cover }}
            style={styles.image}
            resizeMode="stretch" // Mudança aqui: stretch para preencher completamente
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>📺</Text>
          </View>
        )}
        
        {/* Gradient overlay mais sutil */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.gradientOverlay}
        />

        {/* Content container apenas para featured */}
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
              <Text style={styles.watchIcon}>▶</Text>
              <Text style={styles.watchButtonText}>Ver Episódios</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  featuredContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#2a2a2a',
  },
  image: {
    width: '100%',
    height: '100%',
    // resizeMode stretch garante que a imagem preencha completamente o container
    // sem cortes, mesmo que isso altere o aspect ratio
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  metaSeparator: {
    color: '#888',
    fontSize: 14,
    marginHorizontal: 8,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  watchIcon: {
    color: '#fff',
    fontSize: 12,
    marginRight: 6,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SeriesListItem;