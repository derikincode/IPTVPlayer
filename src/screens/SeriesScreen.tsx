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

  const loadSeriesData = async () => {
    setLoading(true);
    try {
      const type = await StorageService.getLoginType();
      setLoginType(type);

      if (type === 'xtream') {
        const credentials = await StorageService.getXtreamCredentials();
        if (credentials) {
          await XtreamAPI.authenticate(credentials);
          
          // Load categories
          const seriesCategories = await XtreamAPI.getSeriesCategories();
          
          // Load series for each category (limit to first 6 categories and 10 series each)
          const categoriesWithSeries: CategoryWithSeries[] = [];
          const allSeries: Series[] = [];
          
          for (let i = 0; i < Math.min(seriesCategories.length, 6); i++) {
            const category = seriesCategories[i];
            try {
              const series = await XtreamAPI.getSeries(category.category_id);
              const limitedSeries = series.slice(0, 10);
              
              categoriesWithSeries.push({
                ...category,
                series: limitedSeries,
              });
              
              allSeries.push(...limitedSeries);
            } catch (error) {
              console.error(`Erro ao carregar séries da categoria ${category.category_name}:`, error);
            }
          }
          
          setCategories(categoriesWithSeries);
          
          // Set featured series (series with highest ratings)
          const featured = allSeries
            .filter(serie => serie.rating && parseFloat(serie.rating) > 7)
            .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
            .slice(0, 10);
          
          setFeaturedSeries(featured);
          
          // Set hero series (top 3 highest rated series for banner)
          const hero = allSeries
            .filter(serie => serie.rating && parseFloat(serie.rating) > 8)
            .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
            .slice(0, 3);
          
          setHeroSeries(hero);
          
          // Set trending series (most recent)
          const trending = allSeries
            .sort((a, b) => {
              const dateA = new Date(a.last_modified || 0).getTime();
              const dateB = new Date(b.last_modified || 0).getTime();
              return dateB - dateA;
            })
            .slice(0, 8);
          
          setTrendingSeries(trending);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de séries:', error);
      Alert.alert('Erro', 'Falha ao carregar séries');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSeriesData();
    setRefreshing(false);
  };

  const handleSeriesPress = (serie: Series) => {
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

  const handleSeriesInfo = (serie: Series) => {
    handleSeriesPress(serie);
  };

  const handleViewEpisodes = (serie: Series) => {
    Alert.alert('Em Desenvolvimento', 'Funcionalidade de episódios será implementada em breve');
  };

  const handleCategoryPress = (category: Category) => {
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
    if (category.series.length === 0) return null;

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
          keyExtractor={(item) => item.series_id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          ItemSeparatorComponent={() => <View style={styles.seriesSeparator} />}
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
          subtitle="Maratone suas séries favoritas"
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
            keyExtractor={(item) => `featured_${item.series_id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 40 + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.featuredList}
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
            keyExtractor={(item) => `trending_${item.series_id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            ItemSeparatorComponent={() => <View style={styles.seriesSeparator} />}
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