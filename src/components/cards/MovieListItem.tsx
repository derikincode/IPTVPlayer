const { width } = Dimensions.get('window');import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 60) / 2; // 2 cards por linha com margens

interface MovieListItemProps {
  title: string;
  year?: string;
  rating?: string;
  genre?: string;
  imageUrl?: string;
  onPress: () => void;
  showRating?: boolean;
}

const MovieListItem: React.FC<MovieListItemProps> = ({
  title,
  year,
  rating,
  genre,
  imageUrl,
  onPress,
  showRating = true,
}) => {
  const getYear = () => {
    if (year) return year;
    return null;
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { width: CARD_WIDTH }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.posterContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.posterImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderPoster}>
            <Icon 
              name="film" 
              size={32} 
              color="#666" 
            />
          </View>
        )}
        
        {/* Rating Badge */}
        {showRating && rating && (
          <View style={styles.ratingBadge}>
            <Icon 
              name="star" 
              size={10} 
              color="#FFD700" 
              style={styles.starIcon}
            />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        )}

        {/* Gradient overlay para melhor legibilidade */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradientOverlay}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        
        <View style={styles.metaContainer}>
          {getYear() && (
            <Text style={styles.year}>{getYear()}</Text>
          )}
          {genre && getYear() && (
            <Text style={styles.separator}>•</Text>
          )}
          {genre && (
            <Text style={styles.genre} numberOfLines={1}>
              {genre}
            </Text>
          )}
        </View>

        {/* Indicador de filme */}
        <View style={styles.typeIndicator}>
          <Icon 
            name="play-circle" 
            size={12} 
            color="#007AFF" 
          />
          <Text style={styles.typeText}>FILME</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  posterContainer: {
    width: '100%',
    height: 200, // Altura fixa para grid
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPoster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 6,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  year: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  separator: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 4,
  },
  genre: {
    color: '#aaa',
    fontSize: 12,
    flex: 1,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  typeText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
});

export default MovieListItem;