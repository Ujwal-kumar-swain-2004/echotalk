const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;

  constructor(
    onRemoteStream: (stream: MediaStream) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onIceCandidateCallback = onIceCandidate;
  }

  private createEmptyStream(): MediaStream {
    // Create black canvas for video
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Camera Unavailable', canvas.width / 2, canvas.height / 2);
    }
    const canvasStream = canvas.captureStream(15);
    const videoTrack = canvasStream.getVideoTracks()[0];

    // Create silent audio
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctxAudio = new AudioContext();
    const oscillator = ctxAudio.createOscillator();
    const dst = ctxAudio.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();
    const audioTrack = dst.stream.getAudioTracks()[0];

    return new MediaStream([videoTrack, audioTrack]);
  }

  async getLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } : false,
        audio: audio
      });
      this.localStream = stream;
      return stream;
    } catch (error: any) {
      console.warn('Error getting user media, falling back to empty stream:', error);
      // Fallback to empty stream if device is in use or permissions denied
      this.localStream = this.createEmptyStream();
      return this.localStream;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  createPeerConnection() {
    if (this.peerConnection) {
      this.close();
    }

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        if (this.remoteStream) {
          this.remoteStream.addTrack(track);
        }
      });
      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', this.peerConnection?.iceConnectionState);
    };

    return this.peerConnection;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    const offer = await this.peerConnection!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    await this.peerConnection!.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answerSdp: RTCSessionDescriptionInit) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.peerConnection) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  close() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }
}
