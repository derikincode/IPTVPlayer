// src/components/cards/MovieListItem.tsx - ATUALIZADO
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
  movie: VODStream; // Agora recebe o objeto completo do filme
  onPress: (movie: VODStream) => void; // Passa o objeto completo
  onPlayPress?: (movie: VODStream) => void; // Função separada para play
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
    e.stopPropagation(); // Previne que o onPress do card seja chamado
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
      onPress={() => onPress(movie)} // Passa o objeto completo do filme
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {movie.stream_icon ? (
          <Image
            source={{ uri: movie.stream_icon }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>🎬</Text>
          </View>
        )}
        
        {/* Gradient overlay - mais sutil */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradientOverlay}
        />
        
        {/* Rating badge */}
        {movie.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {movie.rating}</Text>
          </View>
        )}

        {/* Content container - apenas para os cartões featured */}
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
              <Text style={styles.playButtonText}>▶ Assistir</Text>
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
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  metaContainer: {
    marginBottom: 8,
  },
  metaText: {
    color: '#ccc',
    fontSize: 12,
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

export default MovieListItem;