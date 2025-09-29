import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  BackHandler,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Video, { VideoRef } from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import NetInfo from '@react-native-community/netinfo';
import StorageService from '../../services/storage/StorageService';
import XtreamAPI from '../../services/api/XtreamAPI';
import AppIcon from '../../components/common/AppIcon';
import { EPGData, XtreamCredentials } from '../../types';

interface RouteParams {
  url: string;
  title: string;
  type: 'live' | 'vod';
  streamId?: number;
}

const PlayerScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { url, title, type, streamId } = route.params as RouteParams;
  const videoRef = useRef<VideoRef>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [epgData, setEpgData] = useState<EPGData[]>([]);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [retryCount, setRetryCount] = useState(0);
  const [credentials, setCredentials] = useState<any>(null);
  
  // Refs para timers
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Animações
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializePlayer();
    return () => {
      cleanup();
    };
  }, []);

  // Função para validar URL
  const validateAndTestURL = async (testUrl: string): Promise<boolean> => {
    try {
      console.log('=== VALIDANDO URL ===');
      console.log('URL:', testUrl);
      
      // Validação básica
      const urlObj = new URL(testUrl);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        console.error('Protocolo inválido:', urlObj.protocol);
        return false;
      }
      
      console.log('✅ URL válida, testando acessibilidade...');
      
      // Teste de conectividade com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(testUrl, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'IPTVPlayer/1.0',
            'Referer': (credentials as XtreamCredentials)?.host || '',
          }
        });
        
        clearTimeout(timeoutId);
        
        console.log('Status da resposta:', response.status);
        
        if (response.status >= 200 && response.status < 400) {
          console.log('✅ URL acessível');
          return true;
        } else {
          console.error('❌ Status HTTP inválido:', response.status);
          return false;
        }
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('❌ Erro ao testar URL:', fetchError.message);
        return false;
      }
      
    } catch (error: any) {
      console.error('❌ URL inválida:', error.message);
      return false;
    }
  };

  // Função para diagnosticar problemas
  const diagnoseStreamIssues = async () => {
    console.log('=== DIAGNÓSTICO DE PROBLEMAS ===');
    
    // 1. Testar conectividade
    const netInfo = await NetInfo.fetch();
    
    // Verificar detalhes da conexão com type assertion segura
    const connectionDetails = netInfo.details as any;
    
    console.log('Conectividade:', {
      connected: netInfo.isConnected,
      type: netInfo.type,
      strength: connectionDetails?.strength || 'N/A',
      speed: connectionDetails?.linkSpeed || 'N/A'
    });
    
    // 2. Testar URL específica
    const urlValid = await validateAndTestURL(url);
    console.log('URL acessível:', urlValid);
    
    // 3. Verificar formato
    const urlLower = url.toLowerCase();
    const hasValidExtension = ['.ts', '.m3u8', '.mp4', '.mkv', '.avi'].some(ext => 
      urlLower.includes(ext)
    );
    console.log('Formato válido detectado:', hasValidExtension);
    
    return {
      connectivity: netInfo.isConnected || false,
      urlAccessible: urlValid,
      validFormat: hasValidExtension
    };
  };

  const initializePlayer = async () => {
    try {
      console.log('=== INICIANDO PLAYER ===');
      
      // 1. Verificar conectividade
      await checkConnectivity();
      
      // 2. Carregar credenciais
      const savedCredentials = await StorageService.getCredentials();
      setCredentials(savedCredentials);
      
      // 3. Configurar orientação
      Orientation.lockToLandscape();
      StatusBar.setHidden(true);
      
      // 4. Configurar listeners
      setupListeners();
      
      // 5. Diagnóstico
      const diagnosis = await diagnoseStreamIssues();
      
      if (!diagnosis.connectivity) {
        throw new Error('Sem conexão com a internet');
      }
      
      // 6. Prosseguir com reprodução
      await proceedWithPlayback();
      
    } catch (error) {
      console.error('Erro ao inicializar player:', error);
      handleInitializationError(error);
    }
  };

  const checkConnectivity = async (): Promise<void> => {
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      throw new Error('Sem conexão com a internet');
    }
    
    if (netInfo.type === 'cellular') {
      const cellularDetails = netInfo.details as any;
      const isExpensive = cellularDetails?.isConnectionExpensive;
      
      if (isExpensive) {
        return new Promise((resolve, reject) => {
          Alert.alert(
            'Rede Móvel',
            'Você está usando dados móveis. O streaming pode consumir muitos dados.',
            [
              { text: 'Cancelar', onPress: () => reject(new Error('Cancelado pelo usuário')) },
              { text: 'Continuar', onPress: () => resolve() }
            ]
          );
        });
      }
    }
  };

  const proceedWithPlayback = async () => {
    console.log('=== INICIANDO REPRODUÇÃO ===');
    
    // Carregar EPG se necessário
    if (type === 'live' && streamId) {
      loadEPG();
    }
    
    // Salvar em canais recentes
    if (type === 'live') {
      StorageService.addToRecentChannels(
        streamId?.toString() || url,
        title
      );
    }
    
    // Auto-hide controls
    startHideTimer();
  };

  const setupListeners = () => {
    const orientationListener = () => {
      setDimensions(Dimensions.get('window'));
    };

    const dimensionListener = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    Orientation.addOrientationListener(orientationListener);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      Orientation.removeOrientationListener(orientationListener);
      dimensionListener?.remove();
      backHandler.remove();
    };
  };

  const cleanup = () => {
    Orientation.lockToPortrait();
    StatusBar.setHidden(false);
    clearHideTimer();
  };

  const handleInitializationError = (error: any) => {
    const message = error.message || 'Erro ao inicializar player';
    Alert.alert(
      'Erro',
      message,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const clearHideTimer = () => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
  };

  const startHideTimer = () => {
    clearHideTimer();
    hideControlsTimer.current = setTimeout(() => {
      hideControls();
    }, 4000);
  };

  const handleBackPress = (): boolean => {
    Alert.alert(
      'Sair do Player',
      'Deseja parar a reprodução e voltar?',
      [
        { text: 'Continuar Assistindo', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: () => {
            Orientation.lockToPortrait();
            navigation.goBack();
          }
        },
      ]
    );
    return true;
  };

  const loadEPG = async () => {
    if (!streamId) return;
    
    try {
      const epg = await XtreamAPI.getEPG(streamId);
      setEpgData(epg);
    } catch (error) {
      console.error('Erro ao carregar EPG:', error);
    }
  };

  const onLoad = (data: any) => {
    console.log('Video carregado:', data);
    setLoading(false);
    setError(false);
    setDuration(data.duration || 0);
    setRetryCount(0);
  };

  const onError = (error: any) => {
    console.error('=== ERRO DETALHADO DO PLAYER ===');
    console.error('Erro completo:', JSON.stringify(error, null, 2));
    
    setLoading(false);
    setError(true);
    
    // Análise específica do erro 22004
    if (error?.error?.code === '22004' || error?.error?.errorString?.includes('22004')) {
      console.error('=== ERRO 22004 DETECTADO ===');
      
      if (type === 'vod' && streamId && credentials) {
        try {
          const newUrl = XtreamAPI.getVODURL(streamId, 'mp4');
          
          Alert.alert(
            'Erro 22004 - Stream Não Encontrado',
            'O conteúdo pode estar temporariamente indisponível.',
            [
              { 
                text: 'Tentar URL Alternativa', 
                onPress: () => {
                  navigation.replace('Player', {
                    url: newUrl,
                    title: title + ' (Alt)',
                    type,
                    streamId
                  });
                }
              },
              { text: 'Voltar', onPress: () => navigation.goBack() }
            ]
          );
          return;
        } catch (urlError) {
          console.error('Erro ao regenerar URL:', urlError);
        }
      }
    }
    
    // Tratamento padrão
    const buttons = [];
    
    if (retryCount < 3) {
      buttons.push({
        text: `Retry (${3 - retryCount})`,
        onPress: () => retryPlayback()
      });
    }
    
    buttons.push({
      text: 'Voltar',
      onPress: () => {
        Orientation.lockToPortrait();
        navigation.goBack();
      }
    });
    
    Alert.alert(
      'Erro de Reprodução',
      'Não foi possível reproduzir este conteúdo.',
      buttons
    );
  };

  const retryPlayback = () => {
    setError(false);
    setLoading(true);
    setRetryCount(prev => prev + 1);
    
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  const onProgress = (data: any) => {
    setCurrentTime(data.currentTime || 0);
  };

  const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    if (isBuffering && !loading && !error) {
      setLoading(true);
    } else if (!isBuffering && loading && !error) {
      setLoading(false);
    }
  };

  const togglePlayPause = () => {
    setPaused(!paused);
    showControlsTemporarily();
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    startHideTimer();
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  };

  const toggleControls = () => {
    if (showControls) {
      clearHideTimer();
      hideControls();
    } else {
      showControlsTemporarily();
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current && type === 'vod') {
      videoRef.current.seek(time);
      showControlsTemporarily();
    }
  };

  const handleSeekBarPress = (event: any) => {
    if (type !== 'vod' || duration === 0) return;
    
    const { locationX } = event.nativeEvent;
    const seekBarWidth = dimensions.width - 130;
    const seekTime = (locationX / seekBarWidth) * duration;
    seekTo(Math.max(0, Math.min(seekTime, duration)));
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentEPGProgram = () => {
    if (!epgData.length) return null;
    
    const now = Date.now() / 1000;
    return epgData.find(program => {
      const start = parseInt(program.start_timestamp);
      const stop = parseInt(program.stop_timestamp);
      return now >= start && now <= stop;
    });
  };

  const getNextEPGProgram = () => {
    if (!epgData.length) return null;
    
    const now = Date.now() / 1000;
    return epgData.find(program => {
      const start = parseInt(program.start_timestamp);
      return start > now;
    });
  };

  const changeQuality = () => {
    Alert.alert(
      'Qualidade',
      'Selecione a qualidade do vídeo:',
      [
        { text: 'Auto', onPress: () => showControlsTemporarily() },
        { text: '1080p', onPress: () => showControlsTemporarily() },
        { text: '720p', onPress: () => showControlsTemporarily() },
        { text: '480p', onPress: () => showControlsTemporarily() },
        { text: 'Cancelar', style: 'cancel', onPress: () => showControlsTemporarily() },
      ]
    );
  };

  if (error) {
    return (
      <View style={[styles.errorContainer, { width: dimensions.width, height: dimensions.height }]}>
        <AppIcon name="error" size={64} color="#dc3545" style={styles.errorIcon} />
        <Text style={styles.errorText}>Erro ao reproduzir conteúdo</Text>
        <Text style={styles.errorSubtext}>Verifique sua conexão e tente novamente</Text>
        <View style={styles.errorButtons}>
          {retryCount < 3 && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryPlayback}
            >
              <AppIcon name="refresh" size={18} color="#fff" style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>Tentar Novamente ({3 - retryCount})</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Orientation.lockToPortrait();
              navigation.goBack();
            }}
          >
            <AppIcon name="arrow-back" size={18} color="#007AFF" style={styles.backIcon} />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentProgram = getCurrentEPGProgram();
  const nextProgram = getNextEPGProgram();
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      <StatusBar hidden />
      
      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ 
          uri: url,
          headers: {
            'User-Agent': 'IPTVPlayer/1.0 (Android)',
            'Referer': (credentials as XtreamCredentials)?.host || '',
            'Accept': '*/*',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
          }
        }}
        style={styles.video}
        onLoad={onLoad}
        onError={onError}
        onProgress={onProgress}
        onBuffer={onBuffer}
        paused={paused}
        resizeMode="contain"
        bufferConfig={{
          minBufferMs: 5000,
          maxBufferMs: 20000,
          bufferForPlaybackMs: 1000,
          bufferForPlaybackAfterRebufferMs: 2000,
        }}
        progressUpdateInterval={1000}
        ignoreSilentSwitch="ignore"
        mixWithOthers="duck"
        playWhenInactive={false}
        playInBackground={false}
        controls={false}
        hideShutterView={true}
        onLoadStart={() => {
          console.log('=== INÍCIO DO CARREGAMENTO ===');
          setLoading(true);
        }}
        onReadyForDisplay={() => {
          console.log('Video ready for display');
          setLoading(false);
        }}
        onEnd={() => {
          if (type === 'vod') {
            Alert.alert(
              'Reprodução Finalizada',
              'O vídeo chegou ao fim.',
              [
                { text: 'Assistir Novamente', onPress: () => seekTo(0) },
                { text: 'Voltar', onPress: () => navigation.goBack() }
              ]
            );
          }
        }}
      />

      {/* Touch Area for Controls */}
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={toggleControls}
      >
        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <AppIcon name="refresh" size={32} color="#007AFF" />
              <Text style={styles.loadingText}>
                {error ? 'Reconectando...' : 'Carregando...'}
              </Text>
            </View>
          </View>
        )}

        {/* Controls Overlay */}
        <Animated.View 
          style={[
            styles.controlsOverlay, 
            { 
              opacity: controlsOpacity,
              pointerEvents: showControls ? 'auto' : 'none'
            }
          ]}
        >
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleBackPress}
            >
              <AppIcon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {title}
              </Text>
              {currentProgram && (
                <Text style={styles.epgText} numberOfLines={1}>
                  {currentProgram.title}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.qualityButton}
              onPress={changeQuality}
            >
              <AppIcon name="settings" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Center Controls */}
          <View style={styles.centerControls}>
            {type === 'vod' && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => seekTo(Math.max(0, currentTime - 10))}
              >
                <AppIcon name="replay-10" library="material" size={32} color="#fff" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayPause}
            >
              <AppIcon 
                name={paused ? 'play' : 'pause'} 
                size={40} 
                color="#fff" 
              />
            </TouchableOpacity>

            {type === 'vod' && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => seekTo(Math.min(duration, currentTime + 10))}
              >
                <AppIcon name="forward-10" library="material" size={32} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {type === 'vod' ? (
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)}
                </Text>
                
                <TouchableOpacity
                  style={styles.seekBar}
                  onPress={handleSeekBarPress}
                  activeOpacity={1}
                >
                  <View style={styles.seekBarBackground}>
                    <View 
                      style={[
                        styles.seekBarProgress, 
                        { width: `${progress * 100}%` }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
                
                <Text style={styles.timeText}>
                  {formatTime(duration)}
                </Text>
              </View>
            ) : (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>AO VIVO</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* EPG Info for Live Channels */}
      {type === 'live' && currentProgram && showControls && (
        <View style={styles.epgContainer}>
          <View style={styles.epgCurrent}>
            <Text style={styles.epgCurrentTitle}>{currentProgram.title}</Text>
            <Text style={styles.epgCurrentTime}>
              {new Date(parseInt(currentProgram.start_timestamp) * 1000).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })} - {new Date(parseInt(currentProgram.stop_timestamp) * 1000).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          {nextProgram && (
            <View style={styles.epgNext}>
              <Text style={styles.epgNextLabel}>Próximo:</Text>
              <Text style={styles.epgNextTitle}>{nextProgram.title}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  touchArea: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1000,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  exitButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 22,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  epgText: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  qualityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 22,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    marginHorizontal: 20,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 40,
    marginHorizontal: 30,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'center',
  },
  seekBar: {
    flex: 1,
    marginHorizontal: 15,
    height: 40,
    justifyContent: 'center',
  },
  seekBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  seekBarProgress: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    backgroundColor: '#ff0000',
    borderRadius: 4,
    marginRight: 8,
  },
  liveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 40,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  errorButtons: {
    width: '100%',
    alignItems: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    justifyContent: 'center',
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    minWidth: 200,
    justifyContent: 'center',
  },
  backIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  epgContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    padding: 15,
    zIndex: 50,
  },
  epgCurrent: {
    marginBottom: 8,
  },
  epgCurrentTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  epgCurrentTime: {
    color: '#ccc',
    fontSize: 14,
  },
  epgNext: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  epgNextLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 2,
  },
  epgNextTitle: {
    color: '#fff',
    fontSize: 14,
  },
});

export default PlayerScreen;