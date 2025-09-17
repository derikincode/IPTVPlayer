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
const CARD_WIDTH = (width - 60) / 2;

interface SeriesCardProps {
  title: string;
  plot?: string;
  genre?: string;
  rating?: string;
  releaseDate?: string;
  imageUrl?: string;
  onPress: () => void;
  featured?: boolean;
}

const SeriesCard: React.FC<SeriesCardProps> = ({
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
  const cardHeight = featured ? 220 : 300;

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
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>📺</Text>
          </View>
        )}
        
        {/* Gradient overlay - mais sutil */}
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

        {/* Episode count badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>SÉRIE</Text>
        </View>

        {/* Content container - apenas para os botões featured */}
        {featured && (
          <View style={styles.contentContainer}>
            <View style={styles.metaContainer}>
              {getYear() && (
                <Text style={styles.metaText}>{getYear()}</Text>
              )}
              {genre && getYear() && (
                <Text style={styles.metaSeparator}>•</Text>
              )}
              {genre && (
                <Text style={styles.metaText} numberOfLines={1}>
                  {genre}
                </Text>
              )}
            </View>
            
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Assistir</Text>
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
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
  },
  metaSeparator: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 6,
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SeriesCard;