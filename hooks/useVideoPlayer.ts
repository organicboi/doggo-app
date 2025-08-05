import { Video } from 'expo-av';
import { useRef, useState } from 'react';

export interface UseVideoPlayerReturn {
  videoRef: React.RefObject<Video | null>;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  toggle: () => Promise<void>;
  reset: () => void;
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = async () => {
    if (!videoRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await videoRef.current.playAsync();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing video:', err);
      setError('Failed to play video');
    } finally {
      setIsLoading(false);
    }
  };

  const pause = async () => {
    if (!videoRef.current) return;
    
    try {
      setError(null);
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } catch (err) {
      console.error('Error pausing video:', err);
      setError('Failed to pause video');
    }
  };

  const toggle = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const reset = () => {
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  };

  return {
    videoRef,
    isPlaying,
    isLoading,
    error,
    play,
    pause,
    toggle,
    reset,
  };
}
