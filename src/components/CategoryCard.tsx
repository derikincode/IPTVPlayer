import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, TYPOGRAPHY } from '../utils/constants';

interface CategoryCardProps {
  title: string;
  subtitle?: string;
  itemCount?: number;
  onPress: () => void;
  icon?: string;
  gradient?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  subtitle,
  itemCount,
  onPress,
  icon = '📁',
  gradient = false,
}) => {
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const CardContent = () => (
    <View style={styles.cardContent}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {itemCount !== undefined && (
          <Text style={styles.itemCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </Text>
        )}
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {gradient ? (
          <LinearGradient
            colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
            style={styles.gradientContainer}
          >
            <CardContent />
          </LinearGradient>
        ) : (
          <CardContent />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.MARGIN,
    borderRadius: SIZES.BORDER_RADIUS + 4,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SIZES.PADDING,
    minHeight: 70,
  },
  gradientContainer: {
    borderRadius: SIZES.BORDER_RADIUS + 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.FONT_SIZE_LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
    marginBottom: 2,
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
    marginBottom: 2,
  },
  itemCount: {
    color: COLORS.TEXT_MUTED,
    fontSize: TYPOGRAPHY.FONT_SIZE_SMALL,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  arrow: {
    color: COLORS.TEXT_MUTED,
    fontSize: 24,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
  },
});

export default CategoryCard;