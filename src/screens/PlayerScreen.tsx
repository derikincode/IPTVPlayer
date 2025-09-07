// src/screens/PlayerScreen.tsx - CORRIGIDO
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Video, { VideoRef } from 'react-native-video';
// import Orientation from 'react-native-orientation-locker'; // Comentado até instalar
import StorageService from '../services/StorageService';
import XtreamAPI from '../services/XtreamAPI';
import { EPGData } from '../types';

interface RouteParams {
  url: string;
  title: string;
  type: 'live' | 'vod';
  streamId?: number;
}

const PlayerScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>(); // Correção da tipagem
  const { url, title, type, streamId } = route.params as RouteParams;
const videoRef = useRef<VideoRef>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [epgData, setEpgData] = useState<EPGData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

    return () => {
      // Orientation.lockToPortrait(); // Comentado até instalar
    };
  }, []);

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
      'Não foi possível reproduzir este conteúdo.',
      [
        { text: 'Tentar Novamente', onPress: () => setError(false) },
        { text: 'Voltar', onPress: () => navigation.goBack() },
      ]
    );
  };

  const onProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };

  const togglePlayPause = () => {
    setPaused(!paused);
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Orientation.lockToPortrait(); // Comentado até instalar
      setIsFullscreen(false);
    } else {
      // Orientation.lockToLandscape(); // Comentado até instalar
      setIsFullscreen(true);
    }
  };

  const formatTime = (seconds: number) => {
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

  const handleControlsPress = () => {
    setShowControls(!showControls);
    // Auto-hide controls after 3 seconds
    if (!showControls) {
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao reproduzir conteúdo</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setError(false)}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
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
          paused={paused}
          resizeMode="contain"
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
          }}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        )}

        {showControls && (
          <View style={styles.controlsOverlay}>
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
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
                style={styles.fullscreenButton}
                onPress={toggleFullscreen}
              >
                <Text style={styles.fullscreenButtonText}>
                  {isFullscreen ? '⤢' : '⤡'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
              >
                <Text style={styles.playButtonText}>
                  {paused ? '▶' : '⏸'}
                </Text>
              </TouchableOpacity>
              
              {type === 'vod' && (
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>

      {!isFullscreen && currentProgram && (
        <View style={styles.epgContainer}>
          <Text style={styles.epgTitle}>Programa Atual</Text>
          <Text style={styles.epgProgramTitle}>{currentProgram.title}</Text>
          <Text style={styles.epgDescription} numberOfLines={3}>
            {currentProgram.description}
          </Text>
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
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  epgText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  fullscreenButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  fullscreenButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 15,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
  },
  epgContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
  },
  epgTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  epgProgramTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  epgDescription: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 5,
  },
  epgTime: {
    color: '#007AFF',
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PlayerScreen;