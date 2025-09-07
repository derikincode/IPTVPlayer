import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import XtreamAPI from '../services/XtreamAPI';
import M3UParser from '../services/M3UParser';
import StorageService from '../services/StorageService';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loginType, setLoginType] = useState<'xtream' | 'm3u'>('xtream');
  const [loading, setLoading] = useState(false);
  
  // Xtream fields
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // M3U fields
  const [m3uUrl, setM3uUrl] = useState('');

  useEffect(() => {
    checkExistingLogin();
  }, []);

  const checkExistingLogin = async () => {
    try {
      const type = await StorageService.getLoginType();
      if (type === 'xtream') {
        const credentials = await StorageService.getXtreamCredentials();
        if (credentials) {
          setHost(credentials.host);
          setUsername(credentials.username);
          setPassword(credentials.password);
        }
      } else if (type === 'm3u') {
        const credentials = await StorageService.getM3UCredentials();
        if (credentials) {
          setM3uUrl(credentials.url);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar login existente:', error);
    }
  };

  const handleXtreamLogin = async () => {
    if (!host || !username || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const credentials = { host, username, password };
      await XtreamAPI.authenticate(credentials);
      await StorageService.saveXtreamCredentials(credentials);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleM3ULogin = async () => {
    if (!m3uUrl) {
      Alert.alert('Erro', 'Insira a URL da lista M3U');
      return;
    }

    setLoading(true);
    try {
      await M3UParser.parseM3U(m3uUrl);
      const credentials = { url: m3uUrl };
      await StorageService.saveM3UCredentials(credentials);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar lista M3U. Verifique a URL.');
    } finally {
      setLoading(false);
    }
  };

  const renderXtreamForm = () => (
    <>
      <TextInput
        style={styles.input}
        placeholder="Host (ex: http://servidor.com:8080)"
        value={host}
        onChangeText={setHost}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#666"
      />
      <TextInput
        style={styles.input}
        placeholder="Usuário"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#666"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#666"
      />
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleXtreamLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>Conectar com Xtream</Text>
      </TouchableOpacity>
    </>
  );

  const renderM3UForm = () => (
    <>
      <TextInput
        style={styles.input}
        placeholder="URL da lista M3U"
        value={m3uUrl}
        onChangeText={setM3uUrl}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#666"
      />
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleM3ULogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>Carregar Lista M3U</Text>
      </TouchableOpacity>
    </>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>IPTV Player</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                loginType === 'xtream' && styles.activeTab,
              ]}
              onPress={() => setLoginType('xtream')}
            >
              <Text
                style={[
                  styles.tabText,
                  loginType === 'xtream' && styles.activeTabText,
                ]}
              >
                Xtream Codes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                loginType === 'm3u' && styles.activeTab,
              ]}
              onPress={() => setLoginType('m3u')}
            >
              <Text
                style={[
                  styles.tabText,
                  loginType === 'm3u' && styles.activeTabText,
                ]}
              >
                Lista M3U
              </Text>
            </TouchableOpacity>
          </View>

          {loginType === 'xtream' ? renderXtreamForm() : renderM3UForm()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;