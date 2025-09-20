// src/navigation/AppNavigator.tsx - VERSÃO ATUALIZADA COM TELAS DE DETALHES
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/main/HomeScreen';
import LiveTVScreen from '../screens/content/LiveTVScreen';
import MoviesScreen from '../screens/content/MoviesScreen';
import SeriesScreen from '../screens/content/SeriesScreen';
import CategoryScreen from '../screens/main/CategoryScreen';
import PlayerScreen from '../screens/player/PlayerScreen';
import SearchScreen from '../screens/main/SearchScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import UserListScreen from '../screens/settings/UserListScreen';
import MovieDetailsScreen from '../screens/details/MovieDetailsScreen';
import SeriesDetailsScreen from '../screens/details/SeriesDetailsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#2a2a2a',
          borderTopColor: '#333',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LiveTV"
        component={LiveTVScreen}
        options={{
          tabBarLabel: 'Ao Vivo',
          tabBarIcon: ({ color, size }) => (
            <Icon name="tv" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Movies"
        component={MoviesScreen}
        options={{
          tabBarLabel: 'Filmes',
          tabBarIcon: ({ color, size }) => (
            <Icon name="film" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Series"
        component={SeriesScreen}
        options={{
          tabBarLabel: 'Séries',
          tabBarIcon: ({ color, size }) => (
            <Icon name="videocam" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="search" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a1a' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="UserList" component={UserListScreen} />
        
        {/* Novas telas de detalhes */}
        <Stack.Screen 
          name="MovieDetails" 
          component={MovieDetailsScreen}
          options={{
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="SeriesDetails" 
          component={SeriesDetailsScreen}
          options={{
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        />
        
        <Stack.Screen 
          name="Player" 
          component={PlayerScreen}
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;