<?php
namespace MyApp;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Chat implements MessageComponentInterface {
    protected $clients;
    private $users = array('admin' => '01');
    //all connected to the server users 
    //$users;

//--------===========------------==============---------------===========------------============//

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        echo "server started\n";
    }

//--------===========------------==============---------------===========------------============//

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection to send messages to later
        $this->clients->attach($conn);
        
        echo "New connection! ({$conn->resourceId})\n";
    }

//--------===========------------==============---------------===========------------============//

    public function onMessage(ConnectionInterface $from, $msg) {
        $numRecv = count($this->clients) - 1;
        echo sprintf('Connection %d sending message "%s" to %d other connection%s' . "\n"
            , $from->resourceId, $msg, $numRecv, $numRecv == 1 ? '' : 's');
        
        $this->main_function($from, $msg);
        /*foreach ($this->clients as $client) {
          
              if ($from !== $client) {
                // The sender is not the receiver, send to each client connected
                $client->send(json_encode($data));

          }
           
    }*/
}

//--------===========------------==============---------------===========------------============//

    public function onClose(ConnectionInterface $conn) {
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);

        foreach($this->users as $key => $value){
          if ($value == $conn) {
              unset($this->users[$key]);
              echo "key deleted\n";
          }
        }

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

//--------===========------------==============---------------===========------------============//

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }

//--------===========------------==============---------------===========------------============//

    public function main_function($from, $msg){

        $data = json_decode($msg, true);
        if($data !== null) {
           
           switch ($data['meta']) {
               case 'login':

                   $this->login($from, $data);
                   break;

               case 'icecandidate':
                   $this->icecandidate($from, $data);
                   break;

               case 'offer':
                   $this->offer($from, $data);
                   break;

               case 'answer':
                   $this->answer($from, $data);
                   break;

               case 'leave':
                   $this->leave($from, $data);
                   break;

               default:
                   $return['meta'] = 'error';

                   $this->send_message($from, $return);
                   break;
           }
           
        
        }
    }

//--------===========------------==============---------------===========------------============//

    public function login($from, $data){

            if (array_key_exists($data['name'], $this->users)) {

            echo "\nkey already exist\n";
            //echo "Name: ".$data['name']." Key: ".$this->users[$data['name']];
            $return['meta'] = 'login';
            $return['status'] = 'false';
            $this->send_message($from, $return);

           } else {

            $this->users[$data['name']] = $from;
            echo "\nkey doesn't exist\n";
            //echo "Name: ".$data['name']." Key: ".$this->users[$data['name']];
            $return['meta'] = 'login';
            $return['status'] = 'true';
            $return['name'] = $data['name'];
            $this->send_message($from, $return);

           }

    }

//--------===========------------==============---------------===========------------============//

    public function icecandidate($from, $data){

        if (array_key_exists($data['connecteduser'], $this->users)) {
            
            $data['meta'] = 'handlecandidate';
            $data['sender'] = $data['user'];
            $data['icecand'] = $data['candidate'];
            $this->send_message($this->users[$data['connecteduser']], $data);

        } else {
           $this->invaliduser($from, 'Ice candidate');
        }
    }

//--------===========------------==============---------------===========------------============//

    public function offer($from, $data){
           
           if (array_key_exists($data['connecteduser'], $this->users)) {
               
            $data['meta'] = 'handleoffer';
            $data['sender'] = $data['user'];
            $data['offer'] = $data['offer'];
            $this->send_message($this->users[$data['connecteduser']], $data);

           } else {
            $this->invaliduser($from, 'Offer creation');
           }
    }

//--------===========------------==============---------------===========------------============//

    public function answer($from, $data){
           
           if (array_key_exists($data['connecteduser'], $this->users)) {
               
            $data['meta'] = 'handleanswer';
            $data['sender'] = $data['user'];
            $data['answer'] = $data['answer'];
            $this->send_message($this->users[$data['connecteduser']], $data);

           } else {
            $this->invaliduser($from, 'Answer creation');
           }
    }

//--------===========------------==============---------------===========------------============//

    public function leave($from, $data){
           
           if (array_key_exists($data['connecteduser'], $this->users)) {
               
            $data['meta'] = 'handleleave';
            $data['sender'] = $data['user'];
            $this->send_message($this->users[$data['connecteduser']], $data);

           } else {
            $this->invaliduser($from, 'Leave user');
           }
    }

//--------===========------------==============---------------===========------------============//

    public function invaliduser($from, $extra){

           $data['meta'] = 'invaliduser';
           $data['extra'] = $extra;
           $this->send_message($from, $data);

    }

//--------===========------------==============---------------===========------------============//

    public function send_message($to, $msg){
        $to->send(json_encode($msg));
    }

}
?>