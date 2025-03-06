import { AfterViewInit, Component, ElementRef,  Inject,  PLATFORM_ID,  ViewChild } from '@angular/core';
import { DataService } from '../../service/data.service';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { isPlatformBrowser } from '@angular/common';

const mediaConstraints = {
  audio: true,
  video: true
};

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};


@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements AfterViewInit {
private localStream!: MediaStream;
@ViewChild('local_video') localVideo!: ElementRef;
@ViewChild('received_video') remoteVideo!: ElementRef;
isBrowser: boolean;

private peerConnection!: RTCPeerConnection;

constructor(@Inject(PLATFORM_ID) private platformId: Object,private dataService:DataService) {
  this.isBrowser = isPlatformBrowser(this.platformId);
}

  ngAfterViewInit():void{
    this.addIncomingMessageHandler();
    this.requestMediaDevices();
  }

  //Gérer les messages d'offre
  addIncomingMessageHandler():void {
    this.dataService.connect();
    this.dataService.message$.subscribe( message => {
      switch (message.type) {
        case 'offer':
          this.handleOfferMessage(message.data);
          break;
        case 'answer':
          this.handleAnswerMessage(message.data);
          break;
        case 'hangup':
          this.handleHangupMessage(message);
          break;
        case 'ice-candidate':
          this.handleICECandidateMessage(message.data);
          break;
          default:
            console.log('Unrecognized message', message.type);
      }
    }, error => {
      console.error('Error getting message', error);
    });
  }
  //Gérer les messages de candidat ICE
  private handleICECandidateMessage(msg: RTCIceCandidate): void {
    const candidate = new RTCIceCandidate(msg);
    this.peerConnection.addIceCandidate(candidate).catch(this.reportError);
  }
  private reportError = (e: Error) => {
    console.log('Got Error', e.name);
    console.log(e);
  }
  //Gérer les messages de raccrochage
  handleHangupMessage(data: any) {
    this.closeVideoCall();
  }
  //Gérer les messages de réponse
  handleAnswerMessage(data: RTCSessionDescriptionInit):void {
    console.log('handle incoming answer');

    this.peerConnection.setRemoteDescription(data)
  }
  //Gérer les messages d'offre
  handleOfferMessage(msg: RTCSessionDescriptionInit): void {
    console.log('handlie incoming offer');
    if(!this.peerConnection){
      this.createPeerConnection();
    }
    if(!this.localStream){
      this.startLocalVideo();
    }
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg))
    .then(() => {
      this.localVideo.nativeElement.srcObject= this.localStream;
      this.localStream.getTracks().forEach(
        track=>this.peerConnection.addTrack(track,this.localStream)
      );
    }).then(()=> {
      return this.peerConnection.createAnswer();
    }).then((answer)=>{
      return this.peerConnection.setLocalDescription(answer);
    }).then(()=>{
      this.dataService.sendMessage({type:'answer',data:this.peerConnection.localDescription});
    }).catch(this.handleGetUserMediaError)

  }
  private async requestMediaDevices(): Promise<void> {
    //donner l'accès à la caméra et au micro
    this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    this.pauseLocalVideo();  }


    //Mettre en pause la vidéo locale
  pauseLocalVideo(): void {
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = false;
    });
    this.localVideo.nativeElement.srcObject = undefined;
  }

  //Démarrer la vidéo locale
  startLocalVideo(): void {
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = true;
    });
    this.localVideo.nativeElement.srcObject = this.localStream;
  }


  async call(): Promise<void> {
    this.createPeerConnection();
    this.localStream.getTracks().forEach(track =>
      this.peerConnection.addTrack(track, this.localStream)
    );

    try{
      const offer : RTCSessionDescriptionInit = await this.peerConnection.createOffer(offerOptions);
      await this.peerConnection.setLocalDescription(offer);
      this.dataService.sendMessage({type:'offer',data:offer});
    }catch(err:any){
        this.handleGetUserMediaError(err );
       }
  }

//Gérer les erreurs
  private handleGetUserMediaError(e: Error) : void {
    switch(e.name){
      case 'NotFoundError':
        alert('Votre caméra ou votre micro est introuvable');
        break;
      case 'SecurityError':
      case 'PermissionDeniedError':
        break;
      default:
        console.error('Erroe opening your camera', e.message);
    }

  }

  //Créer une connexion peer
  private createPeerConnection():void {
    this.peerConnection = new RTCPeerConnection(
      {
        iceServers: [
          {
            urls: 'stun:stun.kundenserver.de:3478',
          }
        ]
      }
    );
    this.peerConnection.onicecandidate = this.handleICECandidateEvent;
    this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.peerConnection.ontrack = this.handleTrackEvent;
  }

  private closeVideoCall(): void {
    if(this.peerConnection){
    this.peerConnection.onicecandidate = null
    this.peerConnection.oniceconnectionstatechange = null
    this.peerConnection.onsignalingstatechange = null
    this.peerConnection.ontrack = null
  }
  this.peerConnection.getTransceivers().forEach(transceiver => {
    transceiver.stop();
    });
    this.peerConnection.close();
  }

  //getting candidate data and send it to the other peer
  private handleICECandidateEvent=(event: RTCPeerConnectionIceEvent)=> {
      console.log('ICE candidate event:', event);
      if(event.candidate){
        this.dataService.sendMessage({type:'ice-candidate',data:event.candidate});
      }
  }

//Gérer les événements de changement d'état de la connexion ICE
private handleICEConnectionStateChangeEvent = (event: Event) => {
  console.log('ICE connection state change event:', event);
  switch(this.peerConnection.iceConnectionState){
    case 'closed':
    case 'failed':
    case 'disconnected':
      this.closeVideoCall();
      break;
  }
}
//Gérer les événements de changement d'état de la signalisation
private handleSignalingStateChangeEvent = (event: Event) => {
  console.log('Signaling state change event:', event);
  switch(this.peerConnection.signalingState){
    case 'closed':
      this.closeVideoCall();
      break;
  }
}

//accessing stream from the event and setting it to the remote video element
private handleTrackEvent = (event: RTCTrackEvent) => {
  console.log('Track event:', event);
  this.remoteVideo.nativeElement.srcObject = event.streams[0];
}

//Raccrocher
hangUp(): void {
  this.dataService.sendMessage({type:'hangup',data:''});
this.closeVideoCall();
  }

}

