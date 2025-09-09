// src/screens/PlayerScreen.tsx - CÓDIGO COMPLETO COM ÍCONES REACT NATIVE
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Video, { VideoRef } from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
// import Orientation from 'react-native-orientation-locker'; // Descomentar quando instalar
import StorageService from '../services/StorageService';
import XtreamAPI from '../services/XtreamAPI';
import { EPGData } from '../types';

interface RouteParams {
  url: string;
  title: string;
  type: 'live' | 'vod';
  streamId?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [buffering, setBuffering] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [muted, setMuted] = useState(false);
  const [epgData, setEpgData] = useState<EPGData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seekerPosition, setSeekerPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Animações
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    // Auto-hide controls after 5 seconds
    const hideTimer = setTimeout(() => {
      hideControls();
    }, 5000);

    // Start loading animation
    startLoadingAnimation();

    return () => {
      clearTimeout(hideTimer);
      // Orientation.lockToPortrait(); // Descomentar quando instalar
    };
  }, []);

  const startLoadingAnimation = () => {
    const spin = () => {
      loadingRotation.setValue(0);
      Animated.timing(loadingRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        if (loading || buffering) {
          spin();
        }
      });
    };
    spin();
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
    console.log('Video carregado:', data);
  };

  const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    setBuffering(isBuffering);
    if (isBuffering) {
      startLoadingAnimation();
    }
  };

  const onError = (error: any) => {
    console.error('Erro no player:', error);
    setLoading(false);
    setBuffering(false);
    setError(true);
    Alert.alert(
      'Erro de Reprodução',
      'Não foi possível reproduzir este conteúdo. Verifique sua conexão.',
      [
        { text: 'Tentar Novamente', onPress: () => retryVideo() },
        { text: 'Voltar', onPress: () => navigation.goBack() },
      ]
    );
  };

  const onProgress = (data: any) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
      setSeekerPosition(data.currentTime);
    }
  };

  const retryVideo = () => {
    setError(false);
    setLoading(true);
    startLoadingAnimation();
  };

  const togglePlayPause = () => {
    setPaused(!paused);
    showControlsTemporary();
  };

  const toggleMute = () => {
    setMuted(!muted);
    showControlsTemporary();
  };

  const adjustVolume = (increment: boolean) => {
    const newVolume = increment 
      ? Math.min(volume + 0.1, 1.0)
      : Math.max(volume - 0.1, 0.0);
    setVolume(newVolume);
    showControlsTemporary();
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Orientation.lockToPortrait(); // Descomentar quando instalar
      setIsFullscreen(false);
    } else {
      // Orientation.lockToLandscape(); // Descomentar quando instalar
      setIsFullscreen(true);
    }
    showControlsTemporary();
  };

  const seekTo = (time: number) => {
    if (videoRef.current && type === 'vod') {
      videoRef.current.seek(time);
      setCurrentTime(time);
      setSeekerPosition(time);
    }
  };

  const skip = (seconds: number) => {
    if (type === 'vod') {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      seekTo(newTime);
      showControlsTemporary();
    }
  };

  const showControlsTemporary = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Hide after 5 seconds
    setTimeout(() => {
      hideControls();
    }, 5000);
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

  const handleControlsPress = () => {
    if (showControls) {
      hideControls();
    } else {
      showControlsTemporary();
    }
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

  const getProgress = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  const spin = loadingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#dc3545" />
        <Text style={styles.errorTitle}>Erro de Reprodução</Text>
        <Text style={styles.errorText}>
          Não foi possível reproduzir este conteúdo
        </Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryVideo}
          >
            <Icon name="refresh" size={16} color="#fff" />
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={16} color="#fff" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentProgram = getCurrentEPGProgram();

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} />
      
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={handleControlsPress}
      >
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={styles.video}
          onLoad={onLoad}
          onError={onError}
          onProgress={onProgress}
          onBuffer={onBuffer}
          paused={paused}
          volume={volume}
          muted={muted}
          resizeMode="contain"
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
          }}
          progressUpdateInterval={1000}
        />

        {/* Loading/Buffering Overlay */}
        {(loading || buffering) && (
          <View style={styles.loadingOverlay}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Icon name="reload" size={32} color="#007AFF" />
            </Animated.View>
            <Text style={styles.loadingText}>
              {loading ? 'Carregando...' : 'Buffer...'}
            </Text>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <Animated.View 
            style={[styles.controlsOverlay, { opacity: controlsOpacity }]}
          >
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color="#fff" />
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
              
              <View style={styles.topRightControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleMute}
                >
                  <Icon 
                    name={muted ? "volume-mute" : "volume-high"} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFullscreen}
                >
                  <Icon 
                    name={isFullscreen ? "contract" : "expand"} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              {type === 'vod' && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => skip(-10)}
                >
                  <Icon name="play-skip-back" size={32} color="#fff" />
                  <Text style={styles.skipText}>10s</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
              >
                <Icon 
                  name={paused ? "play" : "pause"} 
                  size={40} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              {type === 'vod' && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => skip(10)}
                >
                  <Icon name="play-skip-forward" size={32} color="#fff" />
                  <Text style={styles.skipText}>10s</Text>
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
                  
                  <View style={styles.progressBar}>
                    <View style={styles.progressTrack}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${getProgress()}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  
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

            {/* Volume Controls */}
            <View style={styles.volumeControls}>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => adjustVolume(false)}
              >
                <Icon name="remove" size={16} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.volumeBar}>
                <View 
                  style={[
                    styles.volumeFill, 
                    { width: `${volume * 100}%` }
                  ]} 
                />
              </View>
              
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => adjustVolume(true)}
              >
                <Icon name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* EPG Information */}
      {!isFullscreen && currentProgram && type === 'live' && (
        <View style={styles.epgContainer}>
          <View style={styles.epgHeader}>
            <Icon name="tv" size={16} color="#007AFF" />
            <Text style={styles.epgTitle}>Programa Atual</Text>
          </View>
          
          <Text style={styles.epgProgramTitle}>{currentProgram.title}</Text>
          
          {currentProgram.description && (
            <Text style={styles.epgDescription} numberOfLines={3}>
              {currentProgram.description}
            </Text>
          )}
          
          <View style={styles.epgTimeContainer}>
            <Icon name="time" size={14} color="#666" />
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
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  controlButton: {
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
    marginBottom: 4,
  },
  epgText: {
    color: '#ccc',
    fontSize: 14,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  playButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
  },
  skipButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
  },
  skipText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  bottomControls: {
    padding: 20,
    paddingBottom: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 50,
  },
  progressBar: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,53,69,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  volumeControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 10,
  },
  volumeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeBar: {
    width: 4,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginVertical: 10,
  },
  volumeFill: {
    backgroundColor: '#007AFF',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  epgContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  epgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  epgTitle: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  },
  epgTime: {
    color: '#666',
    fontSize: 14,
    marginLeft: 6,
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
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PlayerScreen;