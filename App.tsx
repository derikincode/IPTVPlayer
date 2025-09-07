import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1a1a1a" 
        translucent={false}
      />
      <AppNavigator />
    </>
  );
};

export default App;