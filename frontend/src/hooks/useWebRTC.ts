import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket';
import { WebRTCManager } from '../services/webrtc';
import { useAuthStore } from '../store/authStore';
import { useMatchStore } from '../store/matchStore';
import { useChatStore } from '../store/chatStore';
import { soundService } from '../services/sound';

export const useWebRTC = (
  localVideoRef: React.RefObject<HTMLVideoElement | null>,
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>
) => {
  const { user } = useAuthStore();
  const { 
    currentRoomId, 
    isMatched, 
    isSearching,
    gender, 
    preferredGender, 
    interests,
    startSearch,
    setMatched,
    stopSearch,
    resetMatch,
    setOnlineCount,
    setError
  } = useMatchStore();
  
  const { addMessage, setPeerTyping, clearMessages } = useChatStore();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'searching' | 'connecting' | 'connected' | 'disconnected'>('idle');

  const rtcManagerRef = useRef<WebRTCManager | null>(null);

  // Initialize local stream
  useEffect(() => {
    const initLocalMedia = async () => {
      try {
        if (!rtcManagerRef.current) {
          rtcManagerRef.current = new WebRTCManager(
            (stream) => {
              console.log('Received remote stream');
              setRemoteStream(stream);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
              }
              setConnectionStatus('connected');
            },
            (candidate) => {
              const roomId = useMatchStore.getState().currentRoomId;
              if (roomId) {
                socketService.emit('iceCandidate', {
                  roomId,
                  candidate
                });
              }
            }
          );
        }

        const stream = await rtcManagerRef.current.getLocalStream();
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to get camera/mic stream:', err);
        setError('Camera and microphone access are required to chat.');
      }
    };

    initLocalMedia();

    return () => {
      if (rtcManagerRef.current) {
        rtcManagerRef.current.stopLocalStream();
      }
    };
  }, []);

  // Connect socket and handle matchmaking & signaling events
  useEffect(() => {
    if (!user) return;

    socketService.connect(user.id);

    socketService.on('onlineCount', (data: { count: number }) => {
      setOnlineCount(data.count);
    });

    socketService.on('waitingForMatch', () => {
      setConnectionStatus('searching');
      console.log('Waiting for a match...');
    });

    socketService.on('matchFound', async (data: { roomId: string; isInitiator: boolean }) => {
      console.log('Match found! Room ID:', data.roomId, 'Is Initiator:', data.isInitiator);
      soundService.playMatchFound();
      setMatched(data.roomId, data.isInitiator);
      setConnectionStatus('connecting');
      clearMessages();

      if (rtcManagerRef.current) {
        rtcManagerRef.current.createPeerConnection();
        
        if (data.isInitiator) {
          // Give a short delay to allow the other side to set up their connection
          setTimeout(async () => {
            try {
              if (rtcManagerRef.current) {
                const offer = await rtcManagerRef.current.createOffer();
                socketService.emit('offer', {
                  roomId: data.roomId,
                  sdp: offer
                });
              }
            } catch (err) {
              console.error('Error creating offer:', err);
            }
          }, 1000);
        }
      }
    });

    socketService.on('offer', async (data: { sdp: any; roomId: string }) => {
      console.log('Received offer from peer');
      if (rtcManagerRef.current) {
        try {
          const answer = await rtcManagerRef.current.handleOffer(data.sdp);
          socketService.emit('answer', {
            roomId: data.roomId,
            sdp: answer
          });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      }
    });

    socketService.on('answer', async (data: { sdp: any; roomId: string }) => {
      console.log('Received answer from peer');
      if (rtcManagerRef.current) {
        try {
          await rtcManagerRef.current.handleAnswer(data.sdp);
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    });

    socketService.on('iceCandidate', async (data: { candidate: any; roomId: string }) => {
      if (rtcManagerRef.current) {
        try {
          await rtcManagerRef.current.addIceCandidate(data.candidate);
        } catch (err) {
          console.error('Error adding remote ICE candidate:', err);
        }
      }
    });

    socketService.on('message', (data: { content: string; senderId: string; timestamp: number }) => {
      soundService.playMessageReceived();
      addMessage(data);
    });

    socketService.on('typing', () => {
      setPeerTyping(true);
    });

    socketService.on('peerDisconnected', (data: { reason: string }) => {
      console.log('Peer disconnected:', data.reason);
      handlePeerDisconnect();
    });

    socketService.on('chatEnded', (data: { reason: string }) => {
      console.log('Chat ended:', data.reason);
      handlePeerDisconnect();
    });

    socketService.on('error', (data: { message: string }) => {
      setError(data.message);
      stopSearch();
      setConnectionStatus('idle');
    });

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  const handlePeerDisconnect = () => {
    soundService.playDisconnect();
    if (rtcManagerRef.current) {
      rtcManagerRef.current.close();
    }
    setRemoteStream(null);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setConnectionStatus('disconnected');
    resetMatch();
  };

  const startMatchmaking = () => {
    if (!user) return;
    clearMessages();
    startSearch();
    setConnectionStatus('searching');
    socketService.emit('joinQueue', {
      gender,
      preferredGender,
      interests
    });
  };

  const skipToNext = () => {
    // End current match on socket and tell backend we want the next user
    socketService.emit('nextUser', {});
    handlePeerDisconnect();
    
    // Auto-trigger next search
    setTimeout(() => {
      startMatchmaking();
    }, 500);
  };

  const endChat = () => {
    socketService.emit('endChat', {});
    handlePeerDisconnect();
  };

  const toggleMute = () => {
    if (rtcManagerRef.current) {
      const nextMuted = !isMuted;
      rtcManagerRef.current.toggleAudio(!nextMuted);
      setIsMuted(nextMuted);
    }
  };

  const toggleCamera = () => {
    if (rtcManagerRef.current) {
      const nextVideoOff = !isVideoOff;
      rtcManagerRef.current.toggleVideo(!nextVideoOff);
      setIsVideoOff(nextVideoOff);
    }
  };

  const sendMessage = (content: string) => {
    if (!content.trim() || !currentRoomId) return;
    
    // Save to our own list
    addMessage({
      senderId: user?.id || 'self',
      content,
      timestamp: Date.now()
    });

    // Send to peer via websocket
    socketService.emit('message', { content });
  };

  const sendTyping = () => {
    socketService.emit('typing', {});
  };

  const reportUser = (reason: string) => {
    if (!currentRoomId) return;
    socketService.emit('reportUser', { reason });
  };

  return {
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    connectionStatus,
    isSearching,
    isMatched,
    startMatchmaking,
    skipToNext,
    endChat,
    toggleMute,
    toggleCamera,
    sendMessage,
    sendTyping,
    reportUser
  };
};
