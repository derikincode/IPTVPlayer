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
import StorageService from '../../services/storage/StorageService';
import XtreamAPI from '../../services/api/XtreamAPI';
import AppIcon from '../../components/common/AppIcon';
import { EPGData } from '../../types';

interface RouteParams {
  url: string;
  title: string;
  type: 'live' | 'vod';
  streamId?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  
  // Refs para timers
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Animações
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Forçar rotação para paisagem ao entrar no player
    Orientation.lockToLandscape();
    StatusBar.setHidden(true);
    
    // Listener para mudanças de orientação
    const orientationListener = (orientation: string) => {
      setDimensions(Dimensions.get('window'));
    };

    // Listener para mudanças de dimensões
    const dimensionListener = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    Orientation.addOrientationListener(orientationListener);

    // Prevenir voltar com botão físico sem confirmação
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // Save to recent channels
    if (type === 'live') {
      StorageService.addToRecentChannels(
        streamId?.toString() || url,
        title
      );
    }

    // Load EPG for live channels
    if (type === 'live' && streamId) {
      loadEPG();
    }

    // Auto-hide controls após 4 segundos
    startHideTimer();

    return () => {
      // Restaurar orientação ao sair
      Orientation.lockToPortrait();
      StatusBar.setHidden(false);
      Orientation.removeOrientationListener(orientationListener);
      dimensionListener?.remove();
      backHandler.remove();
      clearHideTimer();
    };
  }, []);

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
    setLoading(false);
    setError(false);
    setDuration(data.duration);
  };

  const onError = (error: any) => {
    console.error('Erro no player:', error);
    setLoading(false);
    setError(true);
    Alert.alert(
      'Erro de Reprodução',
      'Não foi possível reproduzir este conteúdo. Verifique sua conexão.',
      [
        { text: 'Tentar Novamente', onPress: () => setError(false) },
        { 
          text: 'Voltar', 
          onPress: () => {
            Orientation.lockToPortrait();
            navigation.goBack();
          }
        },
      ]
    );
  };

  const onProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };

  const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    if (isBuffering && !loading) {
      setLoading(true);
    } else if (!isBuffering && loading) {
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
    console.log('Toggle controls - showControls:', showControls);
    
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
    const seekBarWidth = dimensions.width - 120; // Considerando padding e textos
    const progress = Math.max(0, Math.min(1, locationX / seekBarWidth));
    const seekTime = progress * duration;
    
    seekTo(seekTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentEPGProgram = () => {
    if (epgData.length === 0) return null;
    
    const now = Date.now() / 1000;
    return epgData.find(program => 
      parseInt(program.start_timestamp) <= now && 
      parseInt(program.stop_timestamp) > now
    );
  };

  const getNextEPGProgram = () => {
    if (epgData.length === 0) return null;
    
    const now = Date.now() / 1000;
    const futurePrograms = epgData.filter(program => 
      parseInt(program.start_timestamp) > now
    );
    
    return futurePrograms.sort((a, b) => 
      parseInt(a.start_timestamp) - parseInt(b.start_timestamp)
    )[0] || null;
  };

  const changeQuality = () => {
    clearHideTimer();
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
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setError(false)}
          >
            <AppIcon name="refresh" size={18} color="#fff" style={styles.retryIcon} />
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
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
        source={{ uri: url }}
        style={styles.video}
        onLoad={onLoad}
        onError={onError}
        onProgress={onProgress}
        onBuffer={onBuffer}
        paused={paused}
        resizeMode="contain"
        bufferConfig={{
          minBufferMs: 15000,
          maxBufferMs: 50000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
        progressUpdateInterval={1000}
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
                name={paused ? "play-arrow" : "pause"} 
                size={48} 
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
            {type === 'vod' && duration > 0 && (
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
            )}

            {type === 'live' && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>AO VIVO</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* EPG Info - sempre visível quando há programa */}
      {currentProgram && type === 'live' && !showControls && (
        <View style={styles.epgInfo}>
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
    backgroundColor: '#ff4444',
    borderRadius: 4,
    marginRight: 8,
  },
  liveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  epgInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 15,
    zIndex: 50,
  },
  epgCurrent: {
    marginBottom: 10,
  },
  epgCurrentTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  epgCurrentTime: {
    color: '#007AFF',
    fontSize: 14,
  },
  epgNext: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  epgNextLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 2,
  },
  epgNextTitle: {
    color: '#ddd',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 40,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
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
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PlayerScreen;