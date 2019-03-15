const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
var http = require('http');
const port = process.env.PORT || 8081;
const test = process.env.JEFF_TEST || "default";
console.log(`${test}`);

// Middleware
app.use(bodyParser.json());
app.use(cors());

const requests = require('./routes/api/requests');

// Static folder
app.use(express.static(__dirname + '/public'));

// Handle SPA
app.get('/', (req, res) => res.sendFile(__dirname + '/../client/public/index.html'));

app.use('/api/requests', requests);

var server = http.createServer(app);
global.io = require('socket.io').listen(server);
server.listen(port);
console.log(`Server listening on port ${port}`);
io.set("origins", "*:*");

// Add a connect listener
io.on('connection', function(client){ 
    console.log('server side socket connection made!');
    // Success!  Now listen to messages to be received
    client.on('message',function(event){ 
        console.log('Received message from client!',event);
    });
    client.on('disconnect',function(){
        console.log('Server has disconnected');
    });
});
