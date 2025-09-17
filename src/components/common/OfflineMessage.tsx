import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AppIcon from '../common/AppIcon';

interface OfflineMessageProps {
  onRetry: () => void;
}

const OfflineMessage: React.FC<OfflineMessageProps> = ({ onRetry }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AppIcon 
          name="wifi-off" 
          library="materialcommunity"
          size={64} 
          color="#666" 
        />
      </View>
      <Text style={styles.title}>Sem Conexão</Text>
      <Text style={styles.message}>
        Verifique sua conexão com a internet e tente novamente.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <AppIcon 
          name="refresh" 
          size={18} 
          color="#fff" 
          style={styles.retryIcon}
        />
        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 20,
    opacity: 0.7,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OfflineMessage;