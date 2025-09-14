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
import SeriesCard from '../components/SeriesCard';
import SectionHeader from '../components/SectionHeader';
import SeriesHeroBanner from '../components/SeriesHeroBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import OfflineMessage from '../components/OfflineMessage';
import { Category, Series } from '../types';

const { width } = Dimensions.get('window');

interface CategoryWithSeries extends Category {
  series: Series[];
}

interface LoadCategoryResult {
  success: boolean;
  category?: CategoryWithSeries;
  error?: string;
}

const SeriesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [categories, setCategories] = useState<CategoryWithSeries[]>([]);
  const [featuredSeries, setFeaturedSeries] = useState<Series[]>([]);
  const [heroSeries, setHeroSeries] = useState<Series[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<Series[]>([]);
  const [loginType, setLoginType] = useState<'xtream' | 'm3u' | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    loadSeriesData();
  }, []);

  const isValidSeries = (serie: any): serie is Series => {
    return (
      serie &&
      typeof serie === 'object' &&
      typeof serie.series_id === 'number' &&
      typeof serie.name === 'string' &&
      serie.name.trim().length > 0
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
      
      const series = await XtreamAPI.getSeries(category.category_id);
      
      if (!Array.isArray(series)) {
        console.log(`⚠️ ${category.category_name}: resposta não é array`);
        return { success: false, error: 'Resposta inválida' };
      }

      if (series.length === 0) {
        console.log(`⚠️ ${category.category_name}: sem séries`);
        return { success: false, error: 'Sem séries' };
      }

      // Filtrar e validar séries
      const validSeries = series
        .filter(isValidSeries)
        .slice(0, 10); // Limitar a 10 por categoria

      if (validSeries.length === 0) {
        console.log(`⚠️ ${category.category_name}: sem séries válidas após filtro`);
        return { success: false, error: 'Sem séries válidas' };
      }

      console.log(`✅ ${category.category_name}: ${validSeries.length} séries válidas`);
      
      return {
        success: true,
        category: {
          ...category,
          series: validSeries,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ Erro em ${category.category_name}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const loadSeriesData = async (): Promise<void> => {
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
      
      console.log('📺 Iniciando carregamento de todas as categorias de séries...');
      const allCategories = await XtreamAPI.getSeriesCategories();
      
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

      const categoriesWithSeries: CategoryWithSeries[] = [];
      const allSeries: Series[] = [];
      let successCount = 0;
      let errorCount = 0;

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
              categoriesWithSeries.push(loadResult.category);
              allSeries.push(...loadResult.category.series);
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
      console.log(`   📁 Categorias com séries: ${categoriesWithSeries.length}`);
      console.log(`   📺 Total de séries: ${allSeries.length}`);

      setCategories(categoriesWithSeries);

      // Configurar séries em destaque
      if (allSeries.length > 0) {
        // Séries em destaque (com melhor rating)
        const featured = allSeries
          .filter(serie => {
            const rating = serie.rating ? parseFloat(serie.rating) : 0;
            return !isNaN(rating) && rating >= 6;
          })
          .sort((a, b) => {
            const ratingA = a.rating ? parseFloat(a.rating) : 0;
            const ratingB = b.rating ? parseFloat(b.rating) : 0;
            return ratingB - ratingA;
          })
          .slice(0, 12);

        setFeaturedSeries(featured);
        console.log(`⭐ Séries em destaque: ${featured.length}`);

        // Séries para o banner hero
        const hero = allSeries
          .filter(serie => {
            const rating = serie.rating ? parseFloat(serie.rating) : 0;
            return !isNaN(rating) && rating >= 7 && serie.cover;
          })
          .sort((a, b) => {
            const ratingA = a.rating ? parseFloat(a.rating) : 0;
            const ratingB = b.rating ? parseFloat(b.rating) : 0;
            return ratingB - ratingA;
          })
          .slice(0, 3);

        setHeroSeries(hero);
        console.log(`🏆 Séries hero: ${hero.length}`);

        // Séries em alta (mais recentes)
        const trending = allSeries
          .filter(serie => serie.last_modified)
          .sort((a, b) => {
            const dateA = new Date(a.last_modified || 0).getTime();
            const dateB = new Date(b.last_modified || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 10);

        setTrendingSeries(trending);
        console.log(`🔥 Séries em alta: ${trending.length}`);
      }

      if (categoriesWithSeries.length === 0) {
        Alert.alert(
          'Nenhuma Série Encontrada',
          'Não foi possível carregar nenhuma categoria de séries. Verifique sua conexão.'
        );
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('💥 Erro geral no carregamento:', errorMessage);
      
      Alert.alert(
        'Erro ao Carregar Séries',
        `Ocorreu um erro: ${errorMessage}\n\nTente novamente.`,
        [
          { text: 'OK' },
          { text: 'Tentar Novamente', onPress: () => loadSeriesData() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadSeriesData();
    setRefreshing(false);
  };

  const handleSeriesPress = (serie: Series): void => {
    const info = [
      serie.plot && `📖 ${serie.plot}`,
      serie.genre && `🎭 Gênero: ${serie.genre}`,
      serie.releaseDate && `📅 Lançamento: ${serie.releaseDate}`,
      serie.rating && `⭐ Avaliação: ${serie.rating}`,
      serie.cast && `🎬 Elenco: ${serie.cast}`,
      serie.director && `🎯 Direção: ${serie.director}`,
    ].filter(Boolean).join('\n\n');

    Alert.alert(
      serie.name,
      info || 'Informações não disponíveis',
      [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Ver Episódios', onPress: () => handleViewEpisodes(serie) },
      ]
    );
  };

  const handleSeriesInfo = (serie: Series): void => {
    handleSeriesPress(serie);
  };

  const handleViewEpisodes = (serie: Series): void => {
    Alert.alert('Em Desenvolvimento', 'Funcionalidade de episódios será implementada em breve');
  };

  const handleCategoryPress = (category: Category): void => {
    navigation.navigate('Category', {
      categoryId: category.category_id,
      categoryName: category.category_name,
      type: 'series',
    });
  };

  const renderFeaturedSeries = ({ item }: { item: Series }) => (
    <SeriesCard
      title={item.name}
      plot={item.plot}
      genre={item.genre}
      rating={item.rating}
      releaseDate={item.releaseDate}
      imageUrl={item.cover}
      onPress={() => handleSeriesPress(item)}
      featured
    />
  );

  const renderSeriesItem = ({ item }: { item: Series }) => (
    <View style={styles.seriesCardContainer}>
      <SeriesCard
        title={item.name}
        plot={item.plot}
        genre={item.genre}
        rating={item.rating}
        releaseDate={item.releaseDate}
        imageUrl={item.cover}
        onPress={() => handleSeriesPress(item)}
      />
    </View>
  );

  const renderCategorySection = (category: CategoryWithSeries) => {
    if (!category.series || category.series.length === 0) return null;

    return (
      <View key={category.category_id} style={styles.categorySection}>
        <SectionHeader
          title={category.category_name}
          subtitle={`${category.series.length} séries`}
          onSeeAll={() => handleCategoryPress(category)}
        />
        
        <FlatList
          data={category.series}
          renderItem={renderSeriesItem}
          keyExtractor={(item, index) => `${item.series_id}_${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          ItemSeparatorComponent={() => <View style={styles.seriesSeparator} />}
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
    return <OfflineMessage onRetry={loadSeriesData} />;
  }

  if (loginType !== 'xtream') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SectionHeader
            title="Séries"
            subtitle="Conecte-se com Xtream Codes API para ver séries"
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
      removeClippedSubviews={true}
    >
      {/* Hero Banner */}
      {heroSeries.length > 0 && (
        <SeriesHeroBanner
          series={heroSeries}
          onSeriesPress={handleSeriesPress}
          onInfoPress={handleSeriesInfo}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <SectionHeader
          title="Séries"
          subtitle={`${categories.length} categorias • ${categories.reduce((total, cat) => total + cat.series.length, 0)} séries`}
          showSeeAll={false}
        />
      </View>

      {/* Featured Series Section */}
      {featuredSeries.length > 0 && (
        <View style={styles.featuredSection}>
          <SectionHeader
            title="⭐ Mais Avaliadas"
            subtitle="As séries com melhor avaliação"
            showSeeAll={false}
          />
          
          <FlatList
            data={featuredSeries}
            renderItem={renderFeaturedSeries}
            keyExtractor={(item, index) => `featured_${item.series_id}_${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 40 + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.featuredList}
            removeClippedSubviews={true}
          />
        </View>
      )}

      {/* Trending Series Section */}
      {trendingSeries.length > 0 && (
        <View style={styles.trendingSection}>
          <SectionHeader
            title="🔥 Em Alta"
            subtitle="Séries mais recentes"
            showSeeAll={false}
          />
          
          <FlatList
            data={trendingSeries}
            renderItem={renderSeriesItem}
            keyExtractor={(item, index) => `trending_${item.series_id}_${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            ItemSeparatorComponent={() => <View style={styles.seriesSeparator} />}
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
  trendingSection: {
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
  seriesCardContainer: {
    width: (width - 60) / 2,
  },
  seriesSeparator: {
    width: 16,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SeriesScreen;