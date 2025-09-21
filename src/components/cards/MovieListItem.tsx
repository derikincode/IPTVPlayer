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
import { VODStream } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 cards per row with margins

interface MovieListItemProps {
  movie: VODStream;
  onPress: (movie: VODStream) => void;
  onPlayPress?: (movie: VODStream) => void;
  featured?: boolean;
}

const MovieListItem: React.FC<MovieListItemProps> = ({
  movie,
  onPress,
  onPlayPress,
  featured = false,
}) => {
  const cardWidth = featured ? width - 40 : CARD_WIDTH;
  const cardHeight = featured ? 200 : 280;

  const getYear = () => {
    if (!movie.added) return undefined;
    try {
      return new Date(parseInt(movie.added) * 1000).getFullYear().toString();
    } catch {
      return undefined;
    }
  };

  const handlePlayPress = (e: any) => {
    e.stopPropagation();
    if (onPlayPress) {
      onPlayPress(movie);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cardWidth, height: cardHeight },
        featured && styles.featuredContainer,
      ]}
      onPress={() => onPress(movie)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {movie.stream_icon ? (
          <Image
            source={{ uri: movie.stream_icon }}
            style={styles.image}
            resizeMode="stretch" // Mudança aqui: stretch para preencher completamente
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>🎬</Text>
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
            </View>
            
            <TouchableOpacity 
              style={styles.playButton}
              onPress={handlePlayPress}
            >
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.playButtonText}>Assistir</Text>
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
    marginBottom: 12,
  },
  metaText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  playIcon: {
    color: '#fff',
    fontSize: 12,
    marginRight: 6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MovieListItem;