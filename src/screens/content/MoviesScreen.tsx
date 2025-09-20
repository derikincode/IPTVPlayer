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
import XtreamAPI from '../../services/api/XtreamAPI';
import StorageService from '../../services/storage/StorageService';
import MovieCard from '../../components/cards/MovieCard';
import SectionHeader from '../../components/layout/SectionHeader';
import HeroBanner from '../../components/banners/MoviesHeroBanner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OfflineMessage from '../../components/common/OfflineMessage';
import { Category, VODStream } from '../../types';

const { width } = Dimensions.get('window');

interface CategoryWithMovies extends Category {
  movies: VODStream[];
  totalMovies: number; // Adicionado para armazenar o total real
}

interface LoadCategoryResult {
  success: boolean;
  category?: CategoryWithMovies;
  error?: string;
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

  const isValidMovie = (movie: any): movie is VODStream => {
    return (
      movie &&
      typeof movie === 'object' &&
      typeof movie.stream_id === 'number' &&
      typeof movie.name === 'string' &&
      movie.name.trim().length > 0
    );
  };

  const isValidCategory = (category: any): category is Category => {
    return (
      category &&
      typeof category === 'object' &&
      typeof category.category_id === 'string' &&
      typeof category.category_name === 'string' &&
      category.category_name.trim().length > 0
    );
  };

  const loadSingleCategory = async (category: Category): Promise<LoadCategoryResult> => {
    try {
      console.log(`🔄 Carregando: ${category.category_name}`);
      
      const movies = await XtreamAPI.getVODStreams(category.category_id);
      
      if (!Array.isArray(movies)) {
        console.log(`⚠️ ${category.category_name}: resposta não é array`);
        return { success: false, error: 'Resposta inválida' };
      }

      if (movies.length === 0) {
        console.log(`⚠️ ${category.category_name}: sem filmes`);
        return { success: false, error: 'Sem filmes' };
      }

      // Filtrar e validar filmes
      const validMovies = movies.filter(isValidMovie);
      const totalMovies = validMovies.length; // Total real de filmes

      if (validMovies.length === 0) {
        console.log(`⚠️ ${category.category_name}: sem filmes válidos após filtro`);
        return { success: false, error: 'Sem filmes válidos' };
      }

      // Para a tela principal, mostrar apenas os primeiros 10 filmes
      const displayMovies = validMovies.slice(0, 10);

      console.log(`✅ ${category.category_name}: ${totalMovies} filmes total, exibindo ${displayMovies.length}`);
      
      return {
        success: true,
        category: {
          ...category,
          movies: displayMovies, // Filmes para exibir na tela
          totalMovies: totalMovies, // Total real de filmes da categoria
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ Erro em ${category.category_name}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const loadMoviesData = async (): Promise<void> => {
    setLoading(true);
    try {
      const type = await StorageService.getLoginType();
      setLoginType(type);

      if (type !== 'xtream') {
        setLoading(false);
        return;
      }

      const credentials = await StorageService.getXtreamCredentials();
      if (!credentials) {
        setLoading(false);
        return;
      }

      await XtreamAPI.authenticate(credentials);
      
      console.log('🎬 Iniciando carregamento de todas as categorias de filmes...');
      const allCategories = await XtreamAPI.getVODCategories();
      
      if (!Array.isArray(allCategories)) {
        throw new Error('Resposta de categorias inválida');
      }

      // Filtrar categorias válidas
      const validCategories = allCategories.filter(isValidCategory);
      console.log(`📁 Encontradas ${validCategories.length} categorias válidas`);

      if (validCategories.length === 0) {
        console.log('❌ Nenhuma categoria válida encontrada');
        setLoading(false);
        return;
      }

      const categoriesWithMovies: CategoryWithMovies[] = [];
      const allMovies: VODStream[] = [];
      let successCount = 0;
      let errorCount = 0;
      let totalMoviesCount = 0;

      // Carregar em lotes de 5 categorias por vez
      const batchSize = 5;

      for (let i = 0; i < validCategories.length; i += batchSize) {
        const batch = validCategories.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(validCategories.length / batchSize);
        
        console.log(`🔄 Processando lote ${batchNumber}/${totalBatches}`);
        
        const batchPromises = batch.map(loadSingleCategory);
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Processar resultados do lote
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const loadResult = result.value;
            if (loadResult.success && loadResult.category) {
              categoriesWithMovies.push(loadResult.category);
              allMovies.push(...loadResult.category.movies);
              totalMoviesCount += loadResult.category.totalMovies;
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            console.error(`❌ Promise rejeitada para ${batch[index]?.category_name}:`, result.reason);
            errorCount++;
          }
        });

        // Pausa entre lotes
        if (i + batchSize < validCategories.length) {
          await new Promise<void>(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`🎉 Carregamento concluído:`);
      console.log(`   ✅ Sucessos: ${successCount}`);
      console.log(`   ❌ Erros: ${errorCount}`);
      console.log(`   📁 Categorias com filmes: ${categoriesWithMovies.length}`);
      console.log(`   🎬 Total de filmes: ${totalMoviesCount}`);
      console.log(`   📺 Filmes carregados para exibição: ${allMovies.length}`);

      setCategories(categoriesWithMovies);

      // Configurar filmes em destaque
      if (allMovies.length > 0) {
        // Filmes em destaque (com melhor rating)
        const featured = allMovies
          .filter(movie => {
            const rating = movie.rating ? parseFloat(movie.rating) : 0;
            return !isNaN(rating) && rating >= 6;
          })
          .sort((a, b) => {
            const ratingA = a.rating ? parseFloat(a.rating) : 0;
            const ratingB = b.rating ? parseFloat(b.rating) : 0;
            return ratingB - ratingA;
          })
          .slice(0, 12);

        setFeaturedMovies(featured);
        console.log(`⭐ Filmes em destaque: ${featured.length}`);

        // Filmes para o banner hero
        const hero = allMovies
          .filter(movie => {
            const rating = movie.rating ? parseFloat(movie.rating) : 0;
            return !isNaN(rating) && rating >= 7 && movie.stream_icon;
          })
          .sort((a, b) => {
            const ratingA = a.rating ? parseFloat(a.rating) : 0;
            const ratingB = b.rating ? parseFloat(b.rating) : 0;
            return ratingB - ratingA;
          })
          .slice(0, 3);

        setHeroMovies(hero);
        console.log(`🏆 Filmes hero: ${hero.length}`);
      }

      if (categoriesWithMovies.length === 0) {
        Alert.alert(
          'Nenhum Filme Encontrado',
          'Não foi possível carregar nenhuma categoria de filmes. Verifique sua conexão.'
        );
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('💥 Erro geral no carregamento:', errorMessage);
      
      Alert.alert(
        'Erro ao Carregar Filmes',
        `Ocorreu um erro: ${errorMessage}\n\nTente novamente.`,
        [
          { text: 'OK' },
          { text: 'Tentar Novamente', onPress: () => loadMoviesData() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadMoviesData();
    setRefreshing(false);
  };

  // NOVOS HANDLERS ATUALIZADOS
  const handleMoviePress = (movie: VODStream): void => {
    // Navegar para a tela de detalhes
    navigation.navigate('MovieDetails', { movie });
  };

  const handleMoviePlay = (movie: VODStream): void => {
    // Reproduzir diretamente
    try {
      const url = XtreamAPI.getVODURL(movie.stream_id, movie.container_extension);
      navigation.navigate('Player', {
        url,
        title: movie.name,
        type: 'vod',
        streamId: movie.stream_id,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao reproduzir filme:', errorMessage);
      Alert.alert('Erro', 'Não foi possível reproduzir este filme.');
    }
  };

  const handleMovieInfo = (movie: VODStream): void => {
    // Para o banner hero, vai para detalhes
    navigation.navigate('MovieDetails', { movie });
  };

  const handleCategoryPress = (category: CategoryWithMovies): void => {
    navigation.navigate('Category', {
      categoryId: category.category_id,
      categoryName: category.category_name,
      type: 'vod',
    });
  };

  // RENDERIZADORES ATUALIZADOS
  const renderFeaturedMovie = ({ item }: { item: VODStream }) => (
    <MovieCard
      movie={item}
      onPress={handleMoviePress} // Vai para detalhes
      onPlayPress={handleMoviePlay} // Reproduz diretamente
      featured
    />
  );

  const renderMovieItem = ({ item }: { item: VODStream }) => (
    <View style={styles.movieCardContainer}>
      <MovieCard
        movie={item}
        onPress={handleMoviePress} // Vai para detalhes
        onPlayPress={handleMoviePlay} // Reproduz diretamente
      />
    </View>
  );

  const renderCategorySection = (category: CategoryWithMovies) => {
    if (!category.movies || category.movies.length === 0) return null;

    return (
      <View key={category.category_id} style={styles.categorySection}>
        <SectionHeader
          title={category.category_name}
          subtitle={`${category.totalMovies} filmes`} // Usando totalMovies em vez de movies.length
          onSeeAll={() => handleCategoryPress(category)}
        />
        
        <FlatList
          data={category.movies}
          renderItem={renderMovieItem}
          keyExtractor={(item, index) => `${item.stream_id}_${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          ItemSeparatorComponent={() => <View style={styles.movieSeparator} />}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
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

  // Calcular totais para o header principal
  const totalCategoriesWithMovies = categories.length;
  const totalMoviesOverall = categories.reduce((total, cat) => total + cat.totalMovies, 0);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      removeClippedSubviews={true}
    >
      {/* Hero Banner - ATUALIZADO */}
      {heroMovies.length > 0 && (
        <HeroBanner
          movies={heroMovies}
          onMoviePress={handleMoviePress} // Vai para detalhes
          onInfoPress={handleMovieInfo} // Vai para detalhes também
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <SectionHeader
          title="Filmes"
          subtitle={`${totalCategoriesWithMovies} categorias • ${totalMoviesOverall} filmes`}
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
            keyExtractor={(item, index) => `featured_${item.stream_id}_${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 40 + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.featuredList}
            removeClippedSubviews={true}
          />
        </View>
      )}

      {/* All Categories Sections */}
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