var stream;
var yourConn;
var remoteconn;
var video = document.querySelector('#local');
var parse = document.querySelector('#parse');

function hasUserMedia() { 
   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia 
      || navigator.mozGetUserMedia || navigator.msGetUserMedia; 
   return !!navigator.getUserMedia; 
}
 
if (hasUserMedia()) { 


yourConn = new webkitRTCPeerConnection(null);
remoteconn = new webkitRTCPeerConnection(null);

yourConn.onicecandidate = e => {
	if (e.candidate) {
		remoteconn.addIceCandidate(e.candidate);
	}
}

remoteconn.onicecandidate = e => {
	if (e.candidate) {
		yourConn.addIceCandidate(e.candidate);
	}
}

navigator.mediaDevices.getUserMedia({
  video: true
})
.then(stream => {
	document.getElementById("local").srcObject = stream;
	yourConn.addStream(stream);
	return yourConn.createOffer();
})
.then(offer => yourConn.setLocalDescription(new RTCSessionDescription(offer)))
.then(() => remoteconn.setRemoteDescription(yourConn.localDescription))
.then(() => remoteconn.createAnswer())
.then(answer => remoteconn.setLocalDescription(new RTCSessionDescription(answer)))
.then(() => yourConn.setRemoteDescription(remoteconn.localDescription));

remoteconn.ontrack = e => {
	document.getElementById("parse").srcObject = e.streams[0];
}

};