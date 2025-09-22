// src/types/navigation.ts
import { VODStream, Series } from './index';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Category: {
    categoryId?: string;
    categoryName: string;
    type: 'live' | 'vod' | 'series' | 'm3u';
    channels?: any[];
  };
  Settings: undefined;
  UserList: undefined;
  MovieDetails: {
    movie: VODStream;
  };
  SeriesDetails: {
    series: Series;
  };
  Player: {
    url: string;
    title: string;
    type: 'live' | 'vod';
    streamId?: number;
  };
};

export type TabParamList = {
  Home: undefined;
  LiveTV: undefined;
  Movies: undefined;
  Series: undefined;
  Search: undefined;
};