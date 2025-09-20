// src/components/cards/SeriesListItem.tsx
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

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 cards per row with margins

interface SeriesListItemProps {
  title: string;
  plot?: string;
  genre?: string;
  rating?: string;
  releaseDate?: string;
  imageUrl?: string;
  onPress: () => void;
  featured?: boolean;
}

const SeriesListItem: React.FC<SeriesListItemProps> = ({
  title,
  plot,
  genre,
  rating,
  releaseDate,
  imageUrl,
  onPress,
  featured = false,
}) => {
  const cardWidth = featured ? width - 40 : CARD_WIDTH;
  const cardHeight = featured ? 200 : 280;

  const getYear = () => {
    if (!releaseDate) return null;
    try {
      return new Date(releaseDate).getFullYear().toString();
    } catch {
      return releaseDate;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cardWidth, height: cardHeight },
        featured && styles.featuredContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="stretch"
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
        {rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {rating}</Text>
          </View>
        )}

        {/* Series badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>SÉRIE</Text>
        </View>

        {/* Content container - apenas para os botões featured */}
        {featured && (
          <View style={styles.contentContainer}>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Ver Episódios</Text>
            </View>
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
  playButton: {
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
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SeriesListItem;