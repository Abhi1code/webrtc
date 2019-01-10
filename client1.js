var stream;
var yourConn;
var remoteconn;
var video = document.querySelector('#localVideo');
var parse = document.querySelector('#remoteVideo');
var loginPage = document.querySelector('#login_page'); 
var callPage = document.querySelector('#chat_room');
//loginPage.style.display = "none"; 
 //     callPage.style.display = "none"; 
 
$("#chat_room").css("display", "none");
      $("#login_page").css("display", "block");

function hasUserMedia() { 
   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia 
      || navigator.mozGetUserMedia || navigator.msGetUserMedia; 
   return !!navigator.getUserMedia; 
}
 
if (hasUserMedia()) { 

var configuration = { 
            "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
         }; 

yourConn = new webkitRTCPeerConnection(configuration);
remoteconn = new webkitRTCPeerConnection(configuration);

yourConn.onicecandidate = function (e) {
	if (e.candidate) {
		remoteconn.addIceCandidate(e.candidate);
	}
}

remoteconn.onicecandidate = function (e) {
	if (e.candidate) {
		yourConn.addIceCandidate(e.candidate);
	}
}

navigator.mediaDevices.getUserMedia({
  video: true
})
.then(function (stream) {
	document.getElementById("localVideo").srcObject = stream;
	yourConn.addStream(stream);
	//return yourConn.createOffer();
}).then(function (){
	return yourConn.createOffer();
}).then(function (offer){ yourConn.setLocalDescription(new RTCSessionDescription(offer));
 remoteconn.setRemoteDescription(yourConn.localDescription)})



.then(function (){ return remoteconn.createAnswer(); })
.then(function (answer){ remoteconn.setLocalDescription(new RTCSessionDescription(answer));
yourConn.setRemoteDescription(remoteconn.localDescription)});


remoteconn.ontrack = function (e) {
	document.getElementById("remoteVideo").srcObject = e.streams[0];
}

};