import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { VODStream } from '../../types';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.6;

interface MoviesHeroBannerProps {
  movies: VODStream[];
  onMoviePress: (movie: VODStream) => void;
  onInfoPress?: (movie: VODStream) => void;
}

const MoviesHeroBanner: React.FC<MoviesHeroBannerProps> = ({
  movies,
  onMoviePress,
  onInfoPress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (movies.length <= 1) return;

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [movies.length, fadeAnim]);

  if (!movies.length) return null;

  const currentMovie = movies[currentIndex];

  const getYear = () => {
    if (!currentMovie.added) return null;
    try {
      return new Date(parseInt(currentMovie.added) * 1000).getFullYear().toString();
    } catch {
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bannerContainer, { opacity: fadeAnim }]}>
        {currentMovie.stream_icon ? (
          <Image
            source={{ uri: currentMovie.stream_icon }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderBackground}>
            <Text style={styles.placeholderIcon}>🎬</Text>
          </View>
        )}

        {/* Gradient overlays */}
        <LinearGradient
          colors={['rgba(26,26,26,0.3)', 'rgba(26,26,26,0.7)', 'rgba(26,26,26,0.9)']}
          style={styles.gradientOverlay}
        />

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>FILME</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {currentMovie.name}
          </Text>

          {/* Meta info */}
          <View style={styles.metaContainer}>
            {currentMovie.rating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.ratingText}>{currentMovie.rating}</Text>
              </View>
            )}
            {getYear() && (
              <Text style={styles.yearText}>{getYear()}</Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => onMoviePress(currentMovie)}
              activeOpacity={0.8}
            >
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.playText}>Assistir</Text>
            </TouchableOpacity>

            {onInfoPress && (
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => onInfoPress(currentMovie)}
                activeOpacity={0.8}
              >
                <Text style={styles.infoIcon}>ⓘ</Text>
                <Text style={styles.infoText}>Mais Info</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Indicators */}
          {movies.length > 1 && (
            <View style={styles.indicatorContainer}>
              {movies.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentIndex && styles.activeIndicator,
                  ]}
                  onPress={() => setCurrentIndex(index)}
                />
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    marginBottom: 20,
  },
  bannerContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  placeholderBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
    opacity: 0.3,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
  },
  typeBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 4,
  },
  starIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  yearText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
  },
  playIcon: {
    color: '#000',
    fontSize: 16,
    marginRight: 8,
  },
  playText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  infoIcon: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 20,
  },
});

export default MoviesHeroBanner;