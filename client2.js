
$(document).ready(function(){

      var conn;
      var name;
      var localVideo = document.querySelector('#localVideo'); 
      var remoteVideo = document.querySelector('#remoteVideo');
      var yourConn;
      var stream;
      var otherconn;
      
      conn = new WebSocket('ws://localhost:8282');
      
//----------------------------------------------------------------------------------------------
      
      conn.onopen = function(e) {
      console.log("Connection established!");
      
      };

//----------------------------------------------------------------------------------------------

      conn.onmessage = function(e) {
      console.log(e.data);
      var data = JSON.parse(e.data);
      
      switch(data.meta){
        case 'login':
           login(data);
        break;
//----------------------------------------------------------------------------------------------
        case 'invaliduser':
           otherconn = null;
           $('#callBtn').prop('disabled', false);
           alert(data.extra+' Error!! User not exist');
        break;
//----------------------------------------------------------------------------------------------
        case 'handlecandidate':
           handleCandidate(data.icecand);
        break;
//----------------------------------------------------------------------------------------------
        case 'handleoffer':
           handleOffer(data.offer, data.sender);
        break;
//----------------------------------------------------------------------------------------------
        case 'handleanswer':
           handleAnswer(data.answer);
        break;
//----------------------------------------------------------------------------------------------
        case 'handleleave':
           handleLeave();
        break;
//----------------------------------------------------------------------------------------------     
        case 'error':
           error();
        break;
//----------------------------------------------------------------------------------------------
        default :
            error();
        break;

      }
      
      };

//----------------------------------------------------------------------------------------------

      conn.onclose = function(e) {
         console.log("Connection closed..");
         $("#login_page").show();
         $("#chat_room").hide();
         name = "";
         location.reload();
      };

//----------------------------------------------------------------------------------------------
      
      $('#join').click(function(){
        
        var name = $("#name").val();
          if (name !== "") {
            $('#join').prop('disabled', true);
            var data = {
                   name: name,
                   meta: 'login'
            };
            conn.send(JSON.stringify(data));

          }
      });

//----------------------------------------------------------------------------------------------

      function login(data){
         
         if (data.status === 'true') {
          
          $("#login_page").hide();
          $("#chat_room").show();
          name = data.name;

          //starting a peer connection
          start_peer_conn();

         } else {

          alert("oops..try a different username");
          $('#join').prop('disabled', false);
         }
      }

//----------------------------------------------------------------------------------------------

      function hasUserMedia() { 
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia 
                          || navigator.mozGetUserMedia || navigator.msGetUserMedia; 
          return !!navigator.getUserMedia; 
      }

//----------------------------------------------------------------------------------------------

      function start_peer_conn(){
        if (hasUserMedia()) {
            //getting local video stream 
         navigator.webkitGetUserMedia({ video: true, audio: true }, function (myStream) { 
         stream = myStream; 
      
         //displaying local video stream on the page 
         localVideo.src = window.URL.createObjectURL(stream);
      
         //using Google public stun server 
         var configuration = { 
            "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }, { "url": ""}] 
         }; 
      
         yourConn = new webkitRTCPeerConnection(configuration);
      
         // setup stream listening 
         yourConn.addStream(stream); 
      
         //when a remote user adds stream to the peer connection, we display it 
         yourConn.onaddstream = function (e) { 
            remoteVideo.src = window.URL.createObjectURL(e.stream); 
            $('#callBtn').prop('disabled', true);
         };
      
         // Setup ice handling 
         yourConn.onicecandidate = function (event) {
      
            if (event.candidate) { 
               send({ 
                  meta: "icecandidate",
                  candidate: event.candidate,
               }); 
            } 
        
         };
      
      }, function (error) { 
         alert('something went wrong !!');
      }); 

          } else {
            alert("Your browser does not support video streaming !!");
          }

      }

//----------------------------------------------------------------------------------------------

      //when we got an ice candidate from a remote user 
      function handleCandidate(candidate) { 
           yourConn.addIceCandidate(new RTCIceCandidate({
           sdpMLineIndex: candidate.sdpMLineIndex,
           candidate: candidate.candidate
         }));
      };

//----------------------------------------------------------------------------------------------

      //when somebody sends us an offer 
      function handleOffer(offer, name) {
      otherconn = name; 
      yourConn.setRemoteDescription(new RTCSessionDescription(offer));
  
      //create an answer to an offer 
      yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
    
      send({ 
         meta: "answer", 
         answer: answer 
      }); 
    
      }, function (error) { 
      alert("Error when creating an answer"); 
      $('#callBtn').prop('disabled', false);
       }); 
      };

//----------------------------------------------------------------------------------------------
      //when we got an answer from a remote user 
      function handleAnswer(answer) { 
      yourConn.setRemoteDescription(new RTCSessionDescription(answer));
      }; 

//----------------------------------------------------------------------------------------------

      function error(){
           $("#login_page").show();
           $("#chat_room").hide();
           alert('something went wrong on our side');
      }

//----------------------------------------------------------------------------------------------

      function send(data){
        if (otherconn) {
           data.connecteduser = otherconn;
           data.user = name;
           conn.send(JSON.stringify(data));
        }
      }

//----------------------------------------------------------------------------------------------

      $('#callBtn').click(function(){
        
        var name = $("#callToUsernameInput").val();
        if (name !== "") {
            $('#callBtn').prop('disabled', true);
            otherconn = name;
            // create an offer
            yourConn.createOffer(function (offer) { 

            send({ 
            meta: "offer", 
            offer: offer 
            }); 
      
            yourConn.setLocalDescription(offer); 
      
          }, function (error) { 
            alert("Error when creating an offer"); 
            $('#callBtn').prop('disabled', false);
      });  
          }
        
      });

//---------------------------------------------------------------------------------------------

      $('#hangUpBtn').click(function(){

      if (otherconn) {
        send({ 
          meta: "leave" 
          });
  
        handleLeave(); 
       }
        
      });

      function handleLeave() {
      otherconn = null; 
      remoteVideo.src = null; 
  
      yourConn.close();
      yourConn.onicecandidate = null;
      yourConn.onaddstream = null;
      conn.close();
      
};
//----------------------------------------------------------------------------------------------

   	});

   