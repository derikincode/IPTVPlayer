import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StorageService from '../services/StorageService';
import { AppSettings } from '../types';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    videoQuality: 'auto',
    autoplay: true,
    showSubtitles: false,
    parentalControl: false,
    bufferSize: 15000,
  });
  const [loginType, setLoginType] = useState<'xtream' | 'm3u' | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await StorageService.getAppSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }

      const type = await StorageService.getLoginType();
      setLoginType(type);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await StorageService.saveAppSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Falha ao salvar configurações');
    }
  };

  const handleQualityChange = () => {
    const qualities = ['auto', 'high', 'medium', 'low'] as const;
    const currentIndex = qualities.indexOf(settings.videoQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    const newSettings = { ...settings, videoQuality: qualities[nextIndex] };
    saveSettings(newSettings);
  };

  const handleBufferChange = () => {
    const bufferSizes = [5000, 15000, 30000, 60000];
    const currentIndex = bufferSizes.indexOf(settings.bufferSize);
    const nextIndex = (currentIndex + 1) % bufferSizes.length;
    const newSettings = { ...settings, bufferSize: bufferSizes[nextIndex] };
    saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpar Cache',
      'Deseja limpar o cache do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          onPress: async () => {
            try {
              await StorageService.clearCache();
              Alert.alert('Cache Limpo', 'Cache do aplicativo foi limpo com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar cache');
            }
          },
        },
      ]
    );
  };

  const handleChangeCredentials = () => {
    Alert.alert(
      'Alterar Credenciais',
      'Deseja alterar as credenciais de login?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Alterar',
          onPress: () => {
            navigation.navigate('Login' as never);
          },
        },
      ]
    );
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'auto': return 'Automática';
      case 'high': return 'Alta (1080p)';
      case 'medium': return 'Média (720p)';
      case 'low': return 'Baixa (480p)';
      default: return 'Automática';
    }
  };

  const getBufferLabel = (buffer: number) => {
    switch (buffer) {
      case 5000: return 'Baixo (5s)';
      case 15000: return 'Padrão (15s)';
      case 30000: return 'Alto (30s)';
      case 60000: return 'Muito Alto (60s)';
      default: return 'Padrão (15s)';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seção de Reprodução */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reprodução</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleQualityChange}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Qualidade de Vídeo</Text>
              <Text style={styles.settingValue}>{getQualityLabel(settings.videoQuality)}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleBufferChange}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Buffer de Vídeo</Text>
              <Text style={styles.settingValue}>{getBufferLabel(settings.bufferSize)}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reprodução Automática</Text>
              <Text style={styles.settingDescription}>
                Iniciar reprodução automaticamente
              </Text>
            </View>
            <Switch
              value={settings.autoplay}
              onValueChange={(value) => saveSettings({ ...settings, autoplay: value })}
              trackColor={{ false: '#333', true: '#007AFF' }}
              thumbColor={settings.autoplay ? '#fff' : '#666'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Mostrar Legendas</Text>
              <Text style={styles.settingDescription}>
                Exibir legendas quando disponíveis
              </Text>
            </View>
            <Switch
              value={settings.showSubtitles}
              onValueChange={(value) => saveSettings({ ...settings, showSubtitles: value })}
              trackColor={{ false: '#333', true: '#007AFF' }}
              thumbColor={settings.showSubtitles ? '#fff' : '#666'}
            />
          </View>
        </View>

        {/* Seção de Segurança */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segurança</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Controle Parental</Text>
              <Text style={styles.settingDescription}>
                Ativar proteção para conteúdo adulto
              </Text>
            </View>
            <Switch
              value={settings.parentalControl}
              onValueChange={(value) => saveSettings({ ...settings, parentalControl: value })}
              trackColor={{ false: '#333', true: '#007AFF' }}
              thumbColor={settings.parentalControl ? '#fff' : '#666'}
            />
          </View>
        </View>

        {/* Seção de Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Tipo de Conexão</Text>
              <Text style={styles.settingValue}>
                {loginType === 'xtream' ? 'Xtream Codes API' : 'Lista M3U'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleChangeCredentials}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Alterar Credenciais</Text>
              <Text style={styles.settingDescription}>
                Modificar dados de login
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sistema</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Limpar Cache</Text>
              <Text style={styles.settingDescription}>
                Remove dados temporários do app
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Versão</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Desenvolvido por</Text>
              <Text style={styles.settingValue}>IPTV Player Team</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    color: '#666',
    fontSize: 13,
  },
  settingValue: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  arrow: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;