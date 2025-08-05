import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoThumbnailProps {
  videoUrl: string;
  onPress: () => void;
  style?: any;
  showDuration?: boolean;
}

export function VideoThumbnail({ 
  videoUrl, 
  onPress, 
  style, 
  showDuration = true 
}: VideoThumbnailProps) {
  const [duration, setDuration] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [thumbnailKey, setThumbnailKey] = useState(0);
  const playerRef = useRef<any>(null);

  // Create a muted player for thumbnail preview with better lifecycle management
  const player = useVideoPlayer(videoUrl, player => {
    if (!videoUrl) return;
    
    console.log('Creating thumbnail player for:', videoUrl);
    
    player.loop = false;
    player.volume = 0; // Muted for thumbnail
    playerRef.current = player;
    
    // Set up player event listeners with better error handling
    try {
      // Seek to 1 second for a better frame, then pause
      setTimeout(() => {
        try {
          if (player && videoUrl) {
            player.currentTime = 1;
            player.play();
            
            // Pause after a brief moment to get the frame
            setTimeout(() => {
              if (player) {
                player.pause();
                setIsLoaded(true);
              }
            }, 300);
          }
        } catch (error) {
          console.error('Error setting up video thumbnail:', error);
          setHasError(true);
        }
      }, 150);
      
    } catch (error) {
      console.error('Error creating video thumbnail:', error);
      setHasError(true);
    }
  });

  // Reset thumbnail when URL changes
  useEffect(() => {
    if (videoUrl) {
      setIsLoaded(false);
      setHasError(false);
      setThumbnailKey(prev => prev + 1);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (player && player.duration) {
      setDuration(player.duration);
    }
  }, [player]);

  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (hasError) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off" size={48} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.errorText}>Video unavailable</Text>
        </View>
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={24} color="white" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Video Preview */}
      {player && videoUrl && !hasError ? (
        <VideoView
          key={`thumbnail-${thumbnailKey}`}
          style={styles.videoPreview}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          showsTimecodes={false}
          requiresLinearPlayback={false}
          nativeControls={false}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.6)" />
        </View>
      )}

      {/* Gradient Overlay */}
      <View style={styles.gradientOverlay} />

      {/* Play Button Overlay */}
      <View style={styles.playOverlay}>
        <View style={styles.playButton}>
          <Ionicons name="play" size={32} color="white" />
        </View>
      </View>

      {/* Duration Badge */}
      {showDuration && duration > 0 && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
      )}

      {/* Video Quality Indicator */}
      <View style={styles.qualityBadge}>
        <Text style={styles.qualityText}>HD</Text>
      </View>

      {/* Loading State */}
      {!isLoaded && !hasError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 8,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
