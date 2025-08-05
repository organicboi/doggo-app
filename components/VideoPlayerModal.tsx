import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerModalProps {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
}

export function VideoPlayerModal({ visible, videoUrl, onClose }: VideoPlayerModalProps) {
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [playerKey, setPlayerKey] = useState(0); // Force remount key
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [seekFeedback, setSeekFeedback] = useState<{ show: boolean; direction: 'forward' | 'backward'; amount: number }>({ show: false, direction: 'forward', amount: 0 });
  const [hasEnded, setHasEnded] = useState(false);
  const [showReplayButton, setShowReplayButton] = useState(false);
  
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const controlsAnimation = useRef(new Animated.Value(1)).current;
  const volumeSliderAnimation = useRef(new Animated.Value(0)).current;
  const speedOptionsAnimation = useRef(new Animated.Value(0)).current;
  const seekFeedbackAnimation = useRef(new Animated.Value(0)).current;
  const replayButtonAnimation = useRef(new Animated.Value(0)).current;
  const playerRef = useRef<any>(null);
  
  // Create player with proper lifecycle management - inspired by YouTube/Netflix architecture
  const player = useVideoPlayer(visible ? videoUrl : '', player => {
    if (!visible || !videoUrl) return;
    
    console.log('Creating fresh video player for:', videoUrl);
    
    // Reset player state
    player.loop = false;
    player.volume = volume;
    player.playbackRate = playbackRate;
    player.currentTime = 0;
    
    // Store player reference for manual cleanup
    playerRef.current = player;
    
    // Mark player as ready after a brief delay to ensure proper initialization
    setTimeout(() => {
      setIsPlayerReady(true);
      setIsBuffering(false);
    }, 100);
  });

  // Reset state when modal becomes visible - similar to TikTok's approach
  useEffect(() => {
    if (visible) {
      console.log('Modal opened - resetting all state');
      
      // Reset all state
      setCurrentTime(0);
      setDuration(0);
      setIsBuffering(true);
      setIsPlayerReady(false);
      setShowControls(true);
      setShowVolumeSlider(false);
      setShowSpeedOptions(false);
      setHasEnded(false);
      setShowReplayButton(false);
      
      // Force remount of video components with new key
      setPlayerKey(prev => prev + 1);
      
      // Reset animations
      progressAnimation.setValue(0);
      controlsAnimation.setValue(1);
      volumeSliderAnimation.setValue(0);
      speedOptionsAnimation.setValue(0);
      replayButtonAnimation.setValue(0);
      
    } else {
      // Clean up when modal closes - Netflix-style cleanup
      console.log('Modal closed - performing cleanup');
      
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.currentTime = 0;
        } catch (error) {
          console.error('Error during player cleanup:', error);
        }
      }
      
      // Reset ready state
      setIsPlayerReady(false);
      setIsBuffering(false);
      setHasEnded(false);
      setShowReplayButton(false);
    }
  }, [visible]);

  // Auto-play management with better error handling
  useEffect(() => {
    if (!visible || !videoUrl || !player || !isPlayerReady) return;
    
    console.log('Attempting to start playback');
    
    const startPlayback = async () => {
      try {
        // Small delay to ensure player is fully ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (player && visible) {
          player.play();
          console.log('Video playback started successfully');
        }
      } catch (error) {
        console.error('Error starting video playback:', error);
        setIsBuffering(false);
      }
    };
    
    startPlayback();
  }, [visible, videoUrl, player, isPlayerReady]);

  const hideControlsAfterDelay = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      setShowControls(false);
      animateControlsVisibility(false);
    }, 4000); // Increased to 4 seconds
  };

  const animateControlsVisibility = (visible: boolean) => {
    Animated.timing(controlsAnimation, {
      toValue: visible ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  const animateVolumeSlider = (visible: boolean) => {
    Animated.timing(volumeSliderAnimation, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const animateSpeedOptions = (visible: boolean) => {
    Animated.timing(speedOptionsAnimation, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (visible) {
      setShowControls(true);
      animateControlsVisibility(true);
    }
  }, [visible]);

  useEffect(() => {
    if (showControls && visible) {
      hideControlsAfterDelay();
    }
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [showControls, visible]);

  // Enhanced time tracking with better error handling and end detection
  useEffect(() => {
    if (!visible || !player || !isPlayerReady) return;

    const interval = setInterval(() => {
      try {
        if (player && player.currentTime !== undefined && player.duration !== undefined) {
          const newCurrentTime = player.currentTime || 0;
          const newDuration = player.duration || 0;
          
          setCurrentTime(newCurrentTime);
          setDuration(newDuration);
          
          // Check if video has ended (within 0.5 seconds of duration)
          const isNearEnd = newDuration > 0 && (newDuration - newCurrentTime) <= 0.5;
          const playerHasEnded = !player.playing && newCurrentTime > 0 && isNearEnd;
          
          if (playerHasEnded && !hasEnded) {
            console.log('Video ended - showing replay option');
            setHasEnded(true);
            setShowReplayButton(true);
            setShowControls(true);
            animateControlsVisibility(true);
            
            // Animate replay button
            Animated.spring(replayButtonAnimation, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
            
            // Clear auto-hide timer when video ends
            if (hideControlsTimeout.current) {
              clearTimeout(hideControlsTimeout.current);
            }
          }
          
          // Only stop buffering if we have valid time data
          if (newDuration > 0) {
            setIsBuffering(false);
          }
          
          // Animate progress bar
          if (newDuration > 0) {
            Animated.timing(progressAnimation, {
              toValue: newCurrentTime / newDuration,
              duration: 100,
              useNativeDriver: false,
            }).start();
          }
        }
      } catch (error) {
        console.error('Error getting video time:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [visible, player, isPlayerReady, hasEnded]);

  const handlePlayPause = () => {
    if (!player || !isPlayerReady) {
      console.log('Player not ready for play/pause');
      return;
    }
    
    try {
      if (player.playing) {
        player.pause();
        console.log('Video paused');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        player.play();
        console.log('Video resumed');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // Show controls briefly when play/pause is pressed
      setShowControls(true);
      animateControlsVisibility(true);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleVideoPress = (event?: any) => {
    console.log('Video frame clicked - ensuring controls appear');
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;
    
    // Double tap detection (within 300ms) - only if not ended
    if (timeSinceLastTap < 300 && event && !hasEnded) {
      handleDoubleTap(event);
      return;
    }
    
    setLastTap(now);
    
    // Always show controls when video frame is clicked
    setShowControls(true);
    animateControlsVisibility(true);
    
    // If video hasn't ended, set up auto-hide timer
    if (!hasEnded) {
      hideControlsAfterDelay();
    }
    
    // Hide other menus when tapping video
    if (showVolumeSlider) {
      setShowVolumeSlider(false);
      animateVolumeSlider(false);
    }
    if (showSpeedOptions) {
      setShowSpeedOptions(false);
      animateSpeedOptions(false);
    }
  };

  const handleDoubleTap = (event: any) => {
    if (!player || !isPlayerReady) return;
    
    const { locationX } = event.nativeEvent;
    const screenCenter = SCREEN_WIDTH / 2;
    const isLeftSide = locationX < screenCenter;
    const seekAmount = 10; // 10 seconds
    
    console.log('Double tap detected:', isLeftSide ? 'left' : 'right');
    
    // Haptic feedback for double tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const direction = isLeftSide ? 'backward' : 'forward';
      const newTime = isLeftSide 
        ? Math.max(0, currentTime - seekAmount)
        : Math.min(duration, currentTime + seekAmount);
      
      player.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Show seek feedback
      setSeekFeedback({ show: true, direction, amount: seekAmount });
      
      // Animate seek feedback
      Animated.sequence([
        Animated.timing(seekFeedbackAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(seekFeedbackAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start(() => {
        setSeekFeedback({ show: false, direction: 'forward', amount: 0 });
      });
      
      // Show controls briefly
      setShowControls(true);
      animateControlsVisibility(true);
      hideControlsAfterDelay();
      
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  const handleProgressSeek = (gestureEvent: PanGestureHandlerGestureEvent) => {
    if (!player || duration === 0) return;
    
    const { absoluteX } = gestureEvent.nativeEvent;
    const screenWidth = SCREEN_WIDTH - 40; // Account for padding
    const progressContainerLeft = 20; // Left padding
    
    // Calculate relative position within the progress bar
    const relativeX = absoluteX - progressContainerLeft;
    const progressWidth = Math.max(0, Math.min(screenWidth, relativeX));
    const seekTime = (progressWidth / screenWidth) * duration;
    
    console.log('Seeking to:', seekTime, 'seconds');
    
    try {
      player.currentTime = seekTime;
      setCurrentTime(seekTime);
      
      // Show controls when seeking
      setShowControls(true);
      animateControlsVisibility(true);
      hideControlsAfterDelay();
      
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  const handleProgressPress = (event: any) => {
    if (!player || duration === 0) return;
    
    const { locationX } = event.nativeEvent;
    const progressWidth = SCREEN_WIDTH - 40; // Account for padding
    const seekTime = (locationX / progressWidth) * duration;
    
    console.log('Progress bar tapped - seeking to:', seekTime, 'seconds');
    
    // Haptic feedback for progress bar interaction
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      player.currentTime = seekTime;
      setCurrentTime(seekTime);
      
      // Show controls when seeking
      setShowControls(true);
      animateControlsVisibility(true);
      hideControlsAfterDelay();
      
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (player) {
      try {
        player.volume = clampedVolume;
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (player) {
      try {
        player.playbackRate = rate;
      } catch (error) {
        console.error('Error setting playback rate:', error);
      }
    }
    setShowSpeedOptions(false);
    animateSpeedOptions(false);
  };

  const handleSkip = (seconds: number) => {
    if (!player) return;
    
    try {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      player.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Show controls briefly when skipping
      setShowControls(true);
      animateControlsVisibility(true);
    } catch (error) {
      console.error('Error skipping video:', error);
    }
  };

  const toggleVolumeSlider = () => {
    const newShowVolume = !showVolumeSlider;
    setShowVolumeSlider(newShowVolume);
    animateVolumeSlider(newShowVolume);
    
    // Hide speed options if volume is shown
    if (newShowVolume && showSpeedOptions) {
      setShowSpeedOptions(false);
      animateSpeedOptions(false);
    }
  };

  const toggleSpeedOptions = () => {
    const newShowSpeed = !showSpeedOptions;
    setShowSpeedOptions(newShowSpeed);
    animateSpeedOptions(newShowSpeed);
    
    // Hide volume slider if speed options are shown
    if (newShowSpeed && showVolumeSlider) {
      setShowVolumeSlider(false);
      animateVolumeSlider(false);
    }
  };

  const handleReplay = () => {
    console.log('Replaying video');
    
    if (!player || !isPlayerReady) return;
    
    try {
      // Reset video to beginning
      player.currentTime = 0;
      setCurrentTime(0);
      
      // Reset ended state
      setHasEnded(false);
      setShowReplayButton(false);
      
      // Animate replay button out
      Animated.timing(replayButtonAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Start playing
      player.play();
      
      // Hide controls after delay
      hideControlsAfterDelay();
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
    } catch (error) {
      console.error('Error replaying video:', error);
    }
  };

  const handleClose = () => {
    console.log('Closing video player modal');
    
    // Comprehensive cleanup - inspired by Netflix's player cleanup
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.currentTime = 0;
        console.log('Player cleaned up successfully');
      } catch (error) {
        console.error('Error during player cleanup:', error);
      }
    }
    
    // Reset all state
    setShowControls(true);
    setCurrentTime(0);
    setDuration(0);
    setIsBuffering(false);
    setIsPlayerReady(false);
    setShowVolumeSlider(false);
    setShowSpeedOptions(false);
    setHasEnded(false);
    setShowReplayButton(false);
    
    // Clear timeouts
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    
    onClose();
  };

  if (!visible) return null;

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header, 
            { 
              opacity: controlsAnimation,
              transform: [{ translateY: controlsAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })}]
            }
          ]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Player</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleSpeedOptions} style={styles.speedButton}>
              <Text style={styles.speedText}>{playbackRate}x</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Speed Options Menu */}
        {showSpeedOptions && (
          <Animated.View 
            style={[
              styles.speedOptionsMenu,
              {
                opacity: speedOptionsAnimation,
                transform: [{ scale: speedOptionsAnimation }]
              }
            ]}
          >
            {speedOptions.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedOption,
                  playbackRate === speed && styles.speedOptionActive
                ]}
                onPress={() => handlePlaybackRateChange(speed)}
              >
                <Text style={[
                  styles.speedOptionText,
                  playbackRate === speed && styles.speedOptionTextActive
                ]}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Video Player */}
        <TouchableOpacity 
          style={styles.videoContainer} 
          onPress={handleVideoPress}
          activeOpacity={1}
        >
          {player && videoUrl && isPlayerReady ? (
            <VideoView
              key={`video-${playerKey}`} // Force remount with unique key
              style={styles.video}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              showsTimecodes={false}
              requiresLinearPlayback={false}
              nativeControls={false}
            />
          ) : (
            <View style={[styles.video, styles.loadingContainer]}>
              <Animated.View 
                style={[
                  styles.loadingSpinner,
                  {
                    transform: [{ 
                      rotate: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="refresh" size={32} color="white" />
              </Animated.View>
              <Text style={styles.loadingText}>
                {isBuffering ? 'Loading video...' : 'Preparing player...'}
              </Text>
            </View>
          )}

          {/* Buffering Indicator */}
          {isBuffering && (
            <View style={styles.bufferingOverlay}>
              <Ionicons name="refresh" size={32} color="white" />
              <Text style={styles.bufferingText}>Buffering...</Text>
            </View>
          )}

          {/* Seek Feedback */}
          {seekFeedback.show && (
            <Animated.View 
              style={[
                styles.seekFeedbackOverlay,
                {
                  opacity: seekFeedbackAnimation,
                  transform: [{ scale: seekFeedbackAnimation }]
                }
              ]}
            >
              <View style={styles.seekFeedbackContainer}>
                <Ionicons 
                  name={seekFeedback.direction === 'forward' ? 'play-forward' : 'play-back'} 
                  size={40} 
                  color="white" 
                />
                <Text style={styles.seekFeedbackText}>
                  {seekFeedback.direction === 'forward' ? '+' : '-'}{seekFeedback.amount}s
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Custom Controls Overlay */}
          {showControls && player && isPlayerReady && (
            <Animated.View 
              style={[
                styles.controlsOverlay,
                { opacity: controlsAnimation }
              ]}
            >
              {!hasEnded ? (
                // Normal playback controls
                <View style={styles.centerControls}>
                  <TouchableOpacity 
                    style={styles.skipButton} 
                    onPress={() => handleSkip(-10)}
                  >
                    <Ionicons name="play-back" size={32} color="white" />
                    <Text style={styles.skipText}>10s</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                    <Ionicons
                      name={player.playing ? 'pause' : 'play'}
                      size={50}
                      color="white"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.skipButton} 
                    onPress={() => handleSkip(10)}
                  >
                    <Ionicons name="play-forward" size={32} color="white" />
                    <Text style={styles.skipText}>10s</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Video ended - show replay button
                <Animated.View 
                  style={[
                    styles.replayContainer,
                    {
                      opacity: replayButtonAnimation,
                      transform: [{ scale: replayButtonAnimation }]
                    }
                  ]}
                >
                  <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
                    <Ionicons name="refresh" size={50} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.replayText}>Tap to replay</Text>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* Replay Button - Always visible when video ends */}
          {showReplayButton && hasEnded && (
            <Animated.View 
              style={[
                styles.replayOverlay,
                {
                  opacity: replayButtonAnimation,
                  transform: [{ scale: replayButtonAnimation }]
                }
              ]}
            >
              <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
                <Ionicons name="refresh" size={60} color="white" />
              </TouchableOpacity>
              <Text style={styles.replayText}>Tap to replay</Text>
            </Animated.View>
          )}
        </TouchableOpacity>

        {/* Bottom Controls */}
        <Animated.View 
          style={[
            styles.bottomControls,
            {
              opacity: controlsAnimation,
              transform: [{ translateY: controlsAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}]
            }
          ]}
        >
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <PanGestureHandler onGestureEvent={handleProgressSeek}>
              <TouchableOpacity 
                style={styles.progressTouchArea} 
                onPress={handleProgressPress}
                activeOpacity={1}
              >
                <View style={styles.progressBarBackground} />
                <Animated.View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]} 
                />
                <Animated.View
                  style={[
                    styles.progressThumb,
                    {
                      left: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]}
                />
              </TouchableOpacity>
            </PanGestureHandler>
          </View>

          {/* Time and Controls Row */}
          <View style={styles.controlsRow}>
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
            
            <TouchableOpacity onPress={toggleVolumeSlider} style={styles.volumeButton}>
              <Ionicons 
                name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Volume Slider */}
          {showVolumeSlider && (
            <Animated.View 
              style={[
                styles.volumeSliderContainer,
                {
                  opacity: volumeSliderAnimation,
                  transform: [{ scaleY: volumeSliderAnimation }]
                }
              ]}
            >
              <View style={styles.volumeSlider}>
                <View style={styles.volumeTrack} />
                <View 
                  style={[
                    styles.volumeFill,
                    { width: `${volume * 100}%` }
                  ]} 
                />
                <TouchableOpacity
                  style={[
                    styles.volumeThumb,
                    { left: `${volume * 100}%` }
                  ]}
                  onPress={() => {}}
                />
              </View>
              <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    minWidth: 50,
    alignItems: 'center',
  },
  speedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  speedOptionsMenu: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 8,
    zIndex: 3,
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  speedOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  speedOptionActive: {
    backgroundColor: '#FF6B6B',
  },
  speedOptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  speedOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  loadingContainer: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    opacity: 0.7,
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bufferingText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  seekFeedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
  seekFeedbackContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  seekFeedbackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 200,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
    backdropFilter: 'blur(20px)',
  },
  progressContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressTouchArea: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'absolute',
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    position: 'absolute',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  progressThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    position: 'absolute',
    top: -6,
    marginLeft: -8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  volumeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeSliderContainer: {
    marginTop: 12,
    paddingVertical: 8,
  },
  volumeSlider: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  volumeTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'absolute',
    width: '100%',
  },
  volumeFill: {
    height: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    position: 'absolute',
  },
  volumeThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    position: 'absolute',
    top: -4,
    marginLeft: -6,
  },
  volumeText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  replayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'box-none',
  },
  replayButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  replayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
});
