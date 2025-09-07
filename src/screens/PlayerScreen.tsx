import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import Video, { VideoRef } from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import StorageService from '../services/StorageService';
import XtreamAPI from '../services/XtreamAPI';
import { EPGData } from '../types';

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
  
  // Detectar se é HLS
  const isHLS = url.includes('.m3u8') || url.includes('m3u8');
  
  // Estados de orientação e dimensões
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  // Estados principais
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  
  // Estados de interface
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(1.0);
  
  // Estados de tempo e progresso
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [draggingProgress, setDraggingProgress] = useState(false);
  
  // Estados EPG e informações
  const [epgData, setEpgData] = useState<EPGData[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  
  // Estados de qualidade e buffer
  const [bufferHealth, setBufferHealth] = useState(0);
  const [videoQuality, setVideoQuality] = useState('Auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  
  // Estados de gestos melhorados
  const [gestureStartVolume, setGestureStartVolume] = useState(1.0);
  const [gestureStartBrightness, setGestureStartBrightness] = useState(1.0);
  const [gestureStartTime, setGestureStartTime] = useState(0);
  const [activeGesture, setActiveGesture] = useState<'volume' | 'brightness' | 'seek' | null>(null);
  const [gestureInProgress, setGestureInProgress] = useState(false);
  
  // Animações
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;
  const volumeAnimation = useRef(new Animated.Value(0)).current;
  const brightnessAnimation = useRef(new Animated.Value(0)).current;
  const seekAnimation = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  
  // Timer para ocultar controles
  const controlsTimer = useRef<number | null>(null);

  // PanResponder para gestos profissionais
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 15 || Math.abs(dy) > 15;
      },
      
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (controlsTimer.current) {
          clearTimeout(controlsTimer.current);
        }
        
        setGestureStartVolume(volume);
        setGestureStartBrightness(brightness);
        setGestureStartTime(currentTime);
        setGestureInProgress(false);
        setActiveGesture(null);
      },
      
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { dx, dy } = gestureState;
        const { locationX } = evt.nativeEvent;
        
        if (!gestureInProgress && (Math.abs(dx) > 15 || Math.abs(dy) > 15)) {
          setGestureInProgress(true);
          
          if (Math.abs(dy) > Math.abs(dx)) {
            // Gesto vertical
            if (locationX > screenData.width / 2) {
              setActiveGesture('volume');
            } else {
              setActiveGesture('brightness');
            }
          } else if (Math.abs(dx) > Math.abs(dy) && (isHLS || type === 'vod')) {
            setActiveGesture('seek');
          }
        }
        
        if (gestureInProgress && activeGesture) {
          switch (activeGesture) {
            case 'volume':
              handleVolumeGesture(dy);
              break;
            case 'brightness':
              handleBrightnessGesture(dy);
              break;
            case 'seek':
              handleSeekGesture(dx);
              break;
          }
        }
      },
      
      onPanResponderRelease: () => {
        if (activeGesture === 'seek' && seeking) {
          seekTo(seekTime);
          setSeeking(false);
        }
        
        const wasGesturing = gestureInProgress;
        setGestureInProgress(false);
        setActiveGesture(null);
        
        if (!wasGesturing) {
          handleVideoPress();
        } else {
          hideControlsAfterDelay();
        }
      },
    })
  ).current;

  const handleVolumeGesture = (deltaY: number) => {
    const sensitivity = 0.002;
    const volumeChange = -deltaY * sensitivity;
    const newVolume = Math.max(0, Math.min(1, gestureStartVolume + volumeChange));
    
    setVolume(newVolume);
    showVolumeIndicator();
  };

  const handleBrightnessGesture = (deltaY: number) => {
    const sensitivity = 0.002;
    const brightnessChange = -deltaY * sensitivity;
    const newBrightness = Math.max(0.1, Math.min(1, gestureStartBrightness + brightnessChange));
    
    setBrightness(newBrightness);
    showBrightnessIndicator();
  };

  const handleSeekGesture = (deltaX: number) => {
    if (!isHLS && type === 'live') return;
    
    const sensitivity = duration > 0 ? duration / screenData.width : 0.1;
    const timeChange = deltaX * sensitivity;
    
    let newSeekTime;
    if (isHLS && type === 'live') {
      const maxBackward = 300;
      const maxForward = 30;
      newSeekTime = Math.max(
        gestureStartTime - maxBackward,
        Math.min(gestureStartTime + maxForward, gestureStartTime + timeChange)
      );
    } else {
      newSeekTime = Math.max(0, Math.min(duration, gestureStartTime + timeChange));
    }
    
    setSeekTime(newSeekTime);
    setSeeking(true);
    showSeekIndicator();
  };

  useEffect(() => {
    if (type === 'live') {
      StorageService.addToRecentChannels(
        streamId?.toString() || url,
        title
      );
    }

    if (type === 'live' && streamId) {
      loadEPG();
    }

    startLoadingAnimation();

    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
      const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
      setOrientation(newOrientation);
      
      if (newOrientation === 'landscape' && !isFullscreen) {
        setIsFullscreen(true);
      } else if (newOrientation === 'portrait' && isFullscreen) {
        setIsFullscreen(false);
      }
    });

    return () => subscription?.remove();
  }, [isFullscreen]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isFullscreen, orientation])
  );

  const startLoadingAnimation = () => {
    Animated.loop(
      Animated.timing(loadingRotation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
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
    hideControlsAfterDelay();
  };

  const onError = (error: any) => {
    console.error('Erro no player:', error);
    setLoading(false);
    setError(true);
    
    Alert.alert(
      'Erro de Reprodução',
      isHLS ? 
        'Não foi possível carregar o stream HLS. Verifique a conexão.' :
        'Não foi possível reproduzir este conteúdo.',
      [
        { text: 'Tentar Novamente', onPress: () => retryPlayback() },
        { text: 'Voltar', onPress: () => navigation.goBack() },
      ]
    );
  };

  const onProgress = (data: any) => {
    if (!seeking && !draggingProgress) {
      setCurrentTime(data.currentTime);
    }
    
    const bufferPercent = (data.playableDuration / duration) * 100;
    setBufferHealth(Math.min(bufferPercent, 100));
    
    // Simular detecção de qualidade de rede baseada no buffer
    if (bufferPercent > 80) setNetworkQuality('excellent');
    else if (bufferPercent > 60) setNetworkQuality('good');
    else if (bufferPercent > 30) setNetworkQuality('fair');
    else setNetworkQuality('poor');
  };

  const onBuffer = (data: any) => {
    console.log('Buffering:', data.isBuffering);
  };

  const retryPlayback = () => {
    setError(false);
    setLoading(true);
  };

  const togglePlayPause = () => {
    // Animação do botão play
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setPaused(!paused);
    showControlsTemporarily();
  };

  const toggleMute = () => {
    setMuted(!muted);
    showVolumeIndicator();
    showControlsTemporarily();
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      if (isHLS || type === 'vod') {
        videoRef.current.seek(time);
        setCurrentTime(time);
      }
    }
  };

  const skipForward = () => {
    const newTime = Math.min(currentTime + 10, duration || currentTime + 10);
    seekTo(newTime);
    showControlsTemporarily();
  };

  const skipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    seekTo(newTime);
    showControlsTemporarily();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    showControlsTemporarily();
  };

  const handleBackPress = () => {
    if (isFullscreen) {
      setIsFullscreen(false);
    } else {
      navigation.goBack();
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    hideControlsAfterDelay();
  };

  const hideControlsAfterDelay = () => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    
    controlsTimer.current = setTimeout(() => {
      hideControls();
    }, 4000) as any;
  };

  const hideControls = () => {
    if (!showSettings && !showInfo && !gestureInProgress && !showQualityMenu) {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    }
  };

  const showVolumeIndicator = () => {
    Animated.sequence([
      Animated.timing(volumeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(volumeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showBrightnessIndicator = () => {
    Animated.sequence([
      Animated.timing(brightnessAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(brightnessAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showSeekIndicator = () => {
    Animated.sequence([
      Animated.timing(seekAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(seekAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleVideoPress = () => {
    if (showControls) {
      hideControls();
    } else {
      showControlsTemporarily();
    }
  };

  const handleProgressPress = (event: any) => {
    if (type === 'live' && !isHLS) return;
    
    const { locationX } = event.nativeEvent;
    const progressWidth = screenData.width - 40; // Padding
    const percentage = locationX / progressWidth;
    const newTime = percentage * duration;
    
    seekTo(Math.max(0, Math.min(duration, newTime)));
    showControlsTemporarily();
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

  const getNetworkIcon = () => {
    switch (networkQuality) {
      case 'excellent': return 'signal-wifi-4-bar';
      case 'good': return 'signal-wifi-3-bar';
      case 'fair': return 'signal-wifi-2-bar';
      case 'poor': return 'signal-wifi-1-bar';
      default: return 'signal-wifi-off';
    }
  };

  const getNetworkColor = () => {
    switch (networkQuality) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FF9800';
      case 'poor': return '#F44336';
      default: return '#666';
    }
  };

  const renderProgressBar = () => {
    if ((!isHLS && type === 'live') || duration === 0) return null;

    const progressPercentage = (currentTime / duration) * 100;
    const bufferPercentage = (bufferHealth / 100) * 100;

    return (
      <TouchableOpacity 
        style={styles.progressContainer}
        onPress={handleProgressPress}
        activeOpacity={0.7}
      >
        <View style={styles.progressTrack}>
          <View 
            style={[styles.progressBuffer, { width: `${bufferPercentage}%` }]} 
          />
          <View 
            style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
          />
          <View style={[styles.progressThumb, { left: `${progressPercentage}%` }]} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderQualityMenu = () => {
    if (!showQualityMenu) return null;

    const qualities = ['Auto', '1080p', '720p', '480p', '360p'];

    return (
      <View style={styles.qualityMenu}>
        <Text style={styles.qualityMenuTitle}>Qualidade de Vídeo</Text>
        {qualities.map((quality) => (
          <TouchableOpacity
            key={quality}
            style={[
              styles.qualityMenuItem,
              videoQuality === quality && styles.qualityMenuItemActive
            ]}
            onPress={() => {
              setVideoQuality(quality);
              setShowQualityMenu(false);
              showControlsTemporarily();
            }}
          >
            <Text style={[
              styles.qualityMenuText,
              videoQuality === quality && styles.qualityMenuTextActive
            ]}>
              {quality}
            </Text>
            {videoQuality === quality && (
              <Icon name="check" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderVolumeIndicator = () => (
    <Animated.View 
      style={[
        styles.volumeIndicator, 
        { opacity: volumeAnimation }
      ]}
    >
      <View style={styles.indicatorHeader}>
        <IonIcon 
          name={muted ? 'volume-mute' : volume > 0.5 ? 'volume-high' : 'volume-low'} 
          size={28} 
          color="#007AFF" 
        />
        <Text style={styles.indicatorTitle}>Volume</Text>
      </View>
      <View style={styles.volumeBar}>
        <View 
          style={[
            styles.volumeFill, 
            { width: `${muted ? 0 : volume * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.indicatorValue}>
        {muted ? '0%' : `${Math.round(volume * 100)}%`}
      </Text>
    </Animated.View>
  );

  const renderBrightnessIndicator = () => (
    <Animated.View 
      style={[
        styles.brightnessIndicator, 
        { opacity: brightnessAnimation }
      ]}
    >
      <View style={styles.indicatorHeader}>
        <IonIcon 
          name={brightness > 0.7 ? 'sunny' : brightness > 0.3 ? 'partly-sunny' : 'moon'} 
          size={28} 
          color="#FFA500" 
        />
        <Text style={styles.indicatorTitle}>Brilho</Text>
      </View>
      <View style={styles.volumeBar}>
        <View 
          style={[
            styles.volumeFill, 
            { 
              width: `${brightness * 100}%`,
              backgroundColor: '#FFA500'
            }
          ]} 
        />
      </View>
      <Text style={styles.indicatorValue}>
        {Math.round(brightness * 100)}%
      </Text>
    </Animated.View>
  );

  const renderSeekIndicator = () => (
    <Animated.View 
      style={[
        styles.seekIndicator, 
        { opacity: seekAnimation }
      ]}
    >
      <View style={styles.seekHeader}>
        <IonIcon 
          name={seekTime > gestureStartTime ? 'play-forward' : 'play-back'} 
          size={32} 
          color="#007AFF" 
        />
        <Text style={styles.seekTitle}>
          {seekTime > gestureStartTime ? 'Avançar' : 'Voltar'}
        </Text>
      </View>
      <Text style={styles.seekTime}>
        {formatTime(seekTime)}
      </Text>
      <Text style={styles.seekDelta}>
        {seekTime > gestureStartTime ? '+' : ''}{Math.round(seekTime - gestureStartTime)}s
      </Text>
      {isHLS && type === 'live' && (
        <View style={styles.dvrBadge}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#007AFF" />
          <Text style={styles.dvrText}>DVR</Text>
        </View>
      )}
    </Animated.View>
  );

  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingSpinner,
          {
            transform: [{
              rotate: loadingRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            }],
          },
        ]}
      >
        <IonIcon name="refresh" size={40} color="#007AFF" />
      </Animated.View>
      <Text style={styles.loadingText}>
        {isHLS ? 'Carregando HLS Stream...' : 'Carregando...'}
      </Text>
      <Text style={styles.loadingSubtext}>{title}</Text>
      
      {isHLS && (
        <View style={styles.hlsInfo}>
          <View style={styles.hlsInfoHeader}>
            <MaterialCommunityIcons name="play-network" size={24} color="#007AFF" />
            <Text style={styles.hlsInfoTitle}>Stream HLS Detectado</Text>
          </View>
          <View style={styles.hlsFeatures}>
            <View style={styles.hlsFeature}>
              <Icon name="hd" size={16} color="#4CAF50" />
              <Text style={styles.hlsFeatureText}>Qualidade Adaptativa</Text>
            </View>
            <View style={styles.hlsFeature}>
              <IonIcon name="time" size={16} color="#4CAF50" />
              <Text style={styles.hlsFeatureText}>Seek em Live</Text>
            </View>
            <View style={styles.hlsFeature}>
              <MaterialCommunityIcons name="buffer" size={16} color="#4CAF50" />
              <Text style={styles.hlsFeatureText}>Buffer Otimizado</Text>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.gestureHints}>
        <Text style={styles.hintTitle}>Controles por Gestos</Text>
        <View style={styles.hintsList}>
          <View style={styles.hintItem}>
            <IonIcon name="resize" size={16} color="#007AFF" />
            <Text style={styles.hintText}>Deslize horizontal para navegar</Text>
          </View>
          <View style={styles.hintItem}>
            <IonIcon name="volume-high" size={16} color="#007AFF" />
            <Text style={styles.hintText}>Deslize vertical (direita) para volume</Text>
          </View>
          <View style={styles.hintItem}>
            <IonIcon name="sunny" size={16} color="#007AFF" />
            <Text style={styles.hintText}>Deslize vertical (esquerda) para brilho</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderErrorScreen = () => (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons name="alert-circle" size={80} color="#F44336" />
      <Text style={styles.errorTitle}>
        {isHLS ? 'Erro no Stream HLS' : 'Erro de Reprodução'}
      </Text>
      <Text style={styles.errorMessage}>
        {isHLS ? 
          'Não foi possível carregar o stream HLS. Verifique sua conexão com a internet.' :
          'Não foi possível reproduzir este conteúdo. Tente novamente.'
        }
      </Text>
      <View style={styles.errorButtons}>
        <TouchableOpacity 
          style={styles.errorButton} 
          onPress={retryPlayback}
        >
          <IonIcon name="refresh" size={20} color="#fff" style={styles.errorButtonIcon} />
          <Text style={styles.errorButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.errorButton, styles.errorButtonSecondary]} 
          onPress={() => navigation.goBack()}
        >
          <IonIcon name="arrow-back" size={20} color="#fff" style={styles.errorButtonIcon} />
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (error) {
    return renderErrorScreen();
  }

  const currentProgram = getCurrentEPGProgram();

  return (
    <View style={[
      styles.container,
      orientation === 'landscape' && styles.landscapeContainer
    ]}>
      <StatusBar 
        hidden={isFullscreen || orientation === 'landscape'} 
        backgroundColor="#000" 
        barStyle="light-content" 
      />
      
      <View
        style={styles.videoContainer}
        {...panResponder.panHandlers}
      >
        <Video
          ref={videoRef}
          source={{ 
            uri: url,
            type: isHLS ? 'm3u8' : undefined,
          }}
          style={[
            styles.video,
            { opacity: brightness }
          ]}
          onLoad={onLoad}
          onError={onError}
          onProgress={onProgress}
          onBuffer={onBuffer}
          paused={paused}
          muted={muted}
          volume={volume}
          rate={playbackSpeed}
          resizeMode="contain"
          bufferConfig={{
            minBufferMs: isHLS ? 8000 : 15000,
            maxBufferMs: isHLS ? 25000 : 50000,
            bufferForPlaybackMs: isHLS ? 800 : 2500,
            bufferForPlaybackAfterRebufferMs: isHLS ? 2000 : 5000,
          }}
        />

        {loading && renderLoadingScreen()}
        
        {/* Indicadores de Status */}
        <View style={styles.statusIndicators}>
          {isHLS && (
            <View style={styles.hlsIndicator}>
              <MaterialCommunityIcons name="play-network" size={14} color="#fff" />
              <Text style={styles.hlsText}>HLS</Text>
            </View>
          )}
          <View style={styles.networkIndicator}>
            <Icon name={getNetworkIcon()} size={16} color={getNetworkColor()} />
          </View>
        </View>

        <Animated.View 
          style={[
            styles.controlsOverlay,
            { opacity: controlsOpacity }
          ]}
        >
          {/* Gradiente superior */}
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.topGradient}
          />

          {/* Controles superiores */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleBackPress}
            >
              <IonIcon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {title}
              </Text>
              {currentProgram && (
                <Text style={styles.programTitle} numberOfLines={1}>
                  {currentProgram.title}
                </Text>
              )}
            </View>

            <View style={styles.topRightControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowQualityMenu(!showQualityMenu)}
              >
                <Icon name="hd" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowInfo(!showInfo)}
              >
                <IonIcon name="information-circle" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowSettings(!showSettings)}
              >
                <IonIcon name="settings" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Controles centrais */}
          <View style={styles.centerControls}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={skipBackward}
            >
              <IonIcon name="play-back" size={28} color="#fff" />
              <Text style={styles.skipText}>10s</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
              >
                <IonIcon 
                  name={paused ? 'play' : 'pause'} 
                  size={40} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={skipForward}
            >
              <IonIcon name="play-forward" size={28} color="#fff" />
              <Text style={styles.skipText}>10s</Text>
            </TouchableOpacity>
          </View>

          {/* Gradiente inferior */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.bottomGradient}
          />

          {/* Controles inferiores */}
          <View style={styles.bottomControls}>
            {renderProgressBar()}
            
            <View style={styles.bottomRow}>
              <View style={styles.timeContainer}>
                {(isHLS || type === 'vod') && duration > 0 && (
                  <Text style={styles.timeText}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Text>
                )}
                {type === 'live' && !isHLS && (
                  <View style={styles.liveIndicator}>
                    <MaterialCommunityIcons name="circle" size={8} color="#F44336" />
                    <Text style={styles.liveText}>AO VIVO</Text>
                  </View>
                )}
                {isHLS && type === 'live' && (
                  <View style={styles.hlsLiveIndicator}>
                    <MaterialCommunityIcons name="circle" size={8} color="#007AFF" />
                    <Text style={styles.hlsLiveText}>HLS LIVE</Text>
                  </View>
                )}
              </View>

              <View style={styles.rightControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleMute}
                >
                  <IonIcon 
                    name={muted ? 'volume-mute' : volume > 0.5 ? 'volume-high' : 'volume-low'} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFullscreen}
                >
                  <MaterialCommunityIcons 
                    name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Menu de qualidade */}
        {renderQualityMenu()}

        {/* Indicadores de gestos */}
        {renderVolumeIndicator()}
        {renderBrightnessIndicator()}
        {seeking && renderSeekIndicator()}
      </View>

      {/* Informações EPG - apenas em portrait */}
      {orientation === 'portrait' && !isFullscreen && currentProgram && (
        <View style={styles.epgContainer}>
          <View style={styles.epgHeader}>
            <IonIcon name="tv" size={20} color="#007AFF" />
            <Text style={styles.epgTitle}>
              {isHLS ? 'Programa Atual (HLS)' : 'Programa Atual'}
            </Text>
          </View>
          <Text style={styles.epgProgramTitle}>{currentProgram.title}</Text>
          {currentProgram.description && (
            <Text style={styles.epgDescription} numberOfLines={2}>
              {currentProgram.description}
            </Text>
          )}
          <View style={styles.epgTimeContainer}>
            <IonIcon name="time" size={16} color="#007AFF" />
            <Text style={styles.epgTime}>
              {new Date(parseInt(currentProgram.start_timestamp) * 1000).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })} - {new Date(parseInt(currentProgram.stop_timestamp) * 1000).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
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
  landscapeContainer: {
    paddingTop: 0,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  statusIndicators: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  hlsIndicator: {
    backgroundColor: 'rgba(0,122,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hlsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  networkIndicator: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 12,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  hlsInfo: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.3)',
  },
  hlsInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  hlsInfoTitle: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  hlsFeatures: {
    gap: 8,
  },
  hlsFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hlsFeatureText: {
    color: '#ccc',
    fontSize: 14,
  },
  gestureHints: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hintTitle: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  hintsList: {
    gap: 12,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hintText: {
    color: '#ccc',
    fontSize: 14,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  programTitle: {
    color: '#ccc',
    fontSize: 14,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  playButton: {
    width: 88,
    height: 88,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 28,
    minWidth: 56,
  },
  skipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  progressContainer: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBuffer: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    transform: [{ translateX: -6 }],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  hlsLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hlsLiveText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qualityMenu: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qualityMenuTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  qualityMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  qualityMenuItemActive: {
    backgroundColor: 'rgba(0,122,255,0.2)',
  },
  qualityMenuText: {
    color: '#ccc',
    fontSize: 14,
  },
  qualityMenuTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  volumeIndicator: {
    position: 'absolute',
    top: '45%',
    left: 24,
    backgroundColor: 'rgba(0,0,0,0.95)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
    borderWidth: 2,
    borderColor: '#007AFF',
    minWidth: 120,
  },
  brightnessIndicator: {
    position: 'absolute',
    top: '45%',
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.95)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
    borderWidth: 2,
    borderColor: '#FFA500',
    minWidth: 120,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  indicatorTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  volumeBar: {
    width: 80,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  indicatorValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  seekIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: 'rgba(0,0,0,0.95)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    transform: [{ translateX: -80 }, { translateY: -50 }],
    minWidth: 160,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  seekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  seekTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  seekTime: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  seekDelta: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dvrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  dvrText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  epgContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  epgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  epgTitle: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  epgProgramTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  epgDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  epgTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  epgTime: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 40,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorButtonSecondary: {
    backgroundColor: '#666',
  },
  errorButtonIcon: {
    marginRight: 4,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlayerScreen;