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

interface MovieCardProps {
  movie: VODStream; // Agora recebe o objeto completo do filme
  onPress: (movie: VODStream) => void; // Passa o objeto completo
  onPlayPress?: (movie: VODStream) => void; // Função separada para play
  featured?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPress,
  onPlayPress,
  featured = false,
}) => {
  const cardWidth = featured ? width - 40 : CARD_WIDTH;
  const cardHeight = featured ? 200 : 280;

  const getYear = () => {
    if (!movie.added) return null;
    try {
      return new Date(parseInt(movie.added) * 1000).getFullYear().toString();
    } catch {
      return null;
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
      onPress={() => onPress(movie)}
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
    marginBottom: 8,
  },
  metaText: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
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

export default MovieCard;