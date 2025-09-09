import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import XtreamAPI from '../services/XtreamAPI';
import StorageService from '../services/StorageService';
import MovieCard from '../components/MovieCard';
import SectionHeader from '../components/SectionHeader';
import HeroBanner from '../components/MoviesHeroBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import OfflineMessage from '../components/OfflineMessage';
import { Category, VODStream } from '../types';

const { width } = Dimensions.get('window');

interface CategoryWithMovies extends Category {
  movies: VODStream[];
}

const MoviesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [categories, setCategories] = useState<CategoryWithMovies[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<VODStream[]>([]);
  const [heroMovies, setHeroMovies] = useState<VODStream[]>([]);
  const [loginType, setLoginType] = useState<'xtream' | 'm3u' | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    loadMoviesData();
  }, []);

  const loadMoviesData = async () => {
    setLoading(true);
    try {
      const type = await StorageService.getLoginType();
      setLoginType(type);

      if (type === 'xtream') {
        const credentials = await StorageService.getXtreamCredentials();
        if (credentials) {
          await XtreamAPI.authenticate(credentials);
          
          // Load categories
          const vodCategories = await XtreamAPI.getVODCategories();
          
          // Load movies for each category (limit to first 6 categories and 10 movies each)
          const categoriesWithMovies: CategoryWithMovies[] = [];
          const allMovies: VODStream[] = [];
          
          for (let i = 0; i < Math.min(vodCategories.length, 6); i++) {
            const category = vodCategories[i];
            try {
              const movies = await XtreamAPI.getVODStreams(category.category_id);
              const limitedMovies = movies.slice(0, 10);
              
              categoriesWithMovies.push({
                ...category,
                movies: limitedMovies,
              });
              
              allMovies.push(...limitedMovies);
            } catch (error) {
              console.error(`Erro ao carregar filmes da categoria ${category.category_name}:`, error);
            }
          }
          
          setCategories(categoriesWithMovies);
          
          // Set featured movies (movies with highest ratings or most recent)
          const featured = allMovies
            .filter(movie => movie.rating && parseFloat(movie.rating) > 7)
            .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
            .slice(0, 10);
          
          setFeaturedMovies(featured);
          
          // Set hero movies (top 3 highest rated movies for banner)
          const hero = allMovies
            .filter(movie => movie.rating && parseFloat(movie.rating) > 8)
            .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
            .slice(0, 3);
          
          setHeroMovies(hero);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de filmes:', error);
      Alert.alert('Erro', 'Falha ao carregar filmes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMoviesData();
    setRefreshing(false);
  };

  const handleMoviePress = (movie: VODStream) => {
    const url = XtreamAPI.getVODURL(movie.stream_id, movie.container_extension);
    navigation.navigate('Player', {
      url,
      title: movie.name,
      type: 'vod',
      streamId: movie.stream_id,
    });
  };

  const handleMovieInfo = (movie: VODStream) => {
    Alert.alert(
      movie.name,
      `⭐ Avaliação: ${movie.rating || 'N/A'}\n📅 Adicionado: ${
        movie.added ? new Date(parseInt(movie.added) * 1000).toLocaleDateString('pt-BR') : 'N/A'
      }\n🎬 Formato: ${movie.container_extension || 'N/A'}`,
      [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Assistir', onPress: () => handleMoviePress(movie) },
      ]
    );
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Category', {
      categoryId: category.category_id,
      categoryName: category.category_name,
      type: 'vod',
    });
  };

  const renderFeaturedMovie = ({ item }: { item: VODStream }) => (
    <MovieCard
      title={item.name}
      year={item.added ? new Date(parseInt(item.added) * 1000).getFullYear().toString() : undefined}
      rating={item.rating}
      imageUrl={item.stream_icon}
      onPress={() => handleMoviePress(item)}
      featured
    />
  );

  const renderMovieItem = ({ item }: { item: VODStream }) => (
    <View style={styles.movieCardContainer}>
      <MovieCard
        title={item.name}
        year={item.added ? new Date(parseInt(item.added) * 1000).getFullYear().toString() : undefined}
        rating={item.rating}
        imageUrl={item.stream_icon}
        onPress={() => handleMoviePress(item)}
      />
    </View>
  );

  const renderCategorySection = (category: CategoryWithMovies) => {
    if (category.movies.length === 0) return null;

    return (
      <View key={category.category_id} style={styles.categorySection}>
        <SectionHeader
          title={category.category_name}
          subtitle={`${category.movies.length} filmes`}
          onSeeAll={() => handleCategoryPress(category)}
        />
        
        <FlatList
          data={category.movies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.stream_id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          ItemSeparatorComponent={() => <View style={styles.movieSeparator} />}
        />
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    return <OfflineMessage onRetry={loadMoviesData} />;
  }

  if (loginType !== 'xtream') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SectionHeader
            title="Filmes"
            subtitle="Conecte-se com Xtream Codes API para ver filmes"
            showSeeAll={false}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero Banner */}
      {heroMovies.length > 0 && (
        <HeroBanner
          movies={heroMovies}
          onMoviePress={handleMoviePress}
          onInfoPress={handleMovieInfo}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <SectionHeader
          title="Filmes"
          subtitle="Descubra grandes histórias"
          showSeeAll={false}
        />
      </View>

      {/* Featured Movies Section */}
      {featuredMovies.length > 0 && (
        <View style={styles.featuredSection}>
          <SectionHeader
            title="⭐ Em Destaque"
            subtitle="Os melhores filmes avaliados"
            showSeeAll={false}
          />
          
          <FlatList
            data={featuredMovies}
            renderItem={renderFeaturedMovie}
            keyExtractor={(item) => `featured_${item.stream_id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 40 + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      {/* Categories Sections */}
      {categories.map(renderCategorySection)}
      
      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 20,
  },
  featuredSection: {
    marginVertical: 8,
  },
  featuredList: {
    paddingLeft: 20,
  },
  categorySection: {
    marginVertical: 8,
  },
  horizontalList: {
    paddingLeft: 20,
  },
  movieCardContainer: {
    width: (width - 60) / 2,
  },
  movieSeparator: {
    width: 16,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default MoviesScreen;