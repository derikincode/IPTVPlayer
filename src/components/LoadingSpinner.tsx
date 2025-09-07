import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const LoadingSpinner: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.spinner}>
        <Text style={styles.spinnerText}>⟳</Text>
      </View>
      <Text style={styles.text}>Carregando...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinnerText: {
    color: '#007AFF',
    fontSize: 24,
  },
  text: {
    color: '#666',
    fontSize: 16,
  },
});

export default LoadingSpinner;