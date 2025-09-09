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
import { Series } from '../types';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.6;

interface SeriesHeroBannerProps {
  series: Series[];
  onSeriesPress: (serie: Series) => void;
  onInfoPress?: (serie: Series) => void;
}

const SeriesHeroBanner: React.FC<SeriesHeroBannerProps> = ({
  series,
  onSeriesPress,
  onInfoPress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (series.length <= 1) return;

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

      setCurrentIndex((prevIndex) => (prevIndex + 1) % series.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [series.length, fadeAnim]);

  if (!series.length) return null;

  const currentSeries = series[currentIndex];

  const getYear = () => {
    if (!currentSeries.releaseDate) return null;
    try {
      return new Date(currentSeries.releaseDate).getFullYear().toString();
    } catch {
      return currentSeries.releaseDate;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bannerContainer, { opacity: fadeAnim }]}>
        {currentSeries.cover ? (
          <Image
            source={{ uri: currentSeries.cover }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderBackground}>
            <Text style={styles.placeholderIcon}>📺</Text>
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
            <Text style={styles.typeText}>SÉRIE</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {currentSeries.name}
          </Text>

          {/* Meta info */}
          <View style={styles.metaContainer}>
            {currentSeries.rating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.ratingText}>{currentSeries.rating}</Text>
              </View>
            )}
            {getYear() && (
              <Text style={styles.yearText}>{getYear()}</Text>
            )}
            {currentSeries.genre && (
              <Text style={styles.genreText}>{currentSeries.genre}</Text>
            )}
          </View>

          {/* Description */}
          {currentSeries.plot && (
            <Text style={styles.description} numberOfLines={3}>
              {currentSeries.plot}
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => onSeriesPress(currentSeries)}
              activeOpacity={0.8}
            >
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.playText}>Ver Episódios</Text>
            </TouchableOpacity>

            {onInfoPress && (
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => onInfoPress(currentSeries)}
                activeOpacity={0.8}
              >
                <Text style={styles.infoIcon}>ⓘ</Text>
                <Text style={styles.infoText}>Mais Info</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Indicators */}
          {series.length > 1 && (
            <View style={styles.indicatorContainer}>
              {series.map((_, index) => (
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
  genreText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
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

export default SeriesHeroBanner;