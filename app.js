var express = require('express');
var path = require('path');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var noteModel = require('./models/notes');
var userModel = require('./models/users');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

//Event listener when socket connection is established
io.on("connection", function(socket){
    
    console.log('New Client connected');

    //Event listener for groupChat event
    socket.on('groupChat', function(data){
        io.sockets.emit('groupChat', data);
    });

    //Event listener when someone is typing a message in group chat
    socket.on('typing', function(data){
        socket.broadcast.emit('typing', data);
    });

    //Event listener for private chat request
    socket.on('p2pChat', function(data){
        
        //Decoding the chat initiator details
        var initiator = jwt.decode(data.cu, JWT_SECRET);
        
        //Creating a room
        var room = 'abc';

        //Joining the room
        socket.join(room);

        //Finding the target user by ID
        userModel.findById(data.tu, function(err, target){
            if(err) throw err;
            io.sockets.emit('p2pconnect', {room: room, targeter: target.userEmail ,initiator: initiator.userFirstName});
        });

        
    });

    //Event listener to join the target user in the room created by chat initiator
    socket.on('p2ptargetjoin', function(data){
        console.log('Target joined room '+ data.room);
        socket.join(data.room);
        var clients = io.sockets.adapter.rooms[data.room].sockets;
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
        console.log('Number of users: ' + numClients);
        console.log(clients);
    });

    //Event listener when messages are being transferred
    socket.on('p2pChatSend', function(data){
        console.log(data);
        io.sockets.in('abc').emit('p2pmessage', {message: data.message, handle: data.handle});
    });
});

var port = process.env.PORT || 3000;

//Creating a secret variable for JWT token
var JWT_SECRET = 'maverick';

var urlencodedParser = bodyparser.urlencoded({ extended: false });

var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } }; 

var mongodbUri = 'mongodb://admin:sskssk@ds131432.mlab.com:31432/nodebook';

//Connecting to mongoDB
mongoose.connect(mongodbUri, options);

/*var noteOne = noteModel({ noteText: 'Learn React'})
            .save(function(err){
                if(err) throw err;
                console.log('Item saved');
});*/
// var userOne = userModel({ userEmail: 'Suman', userPass: 'ssk'})
//             .save(function(err){
//                 if(err) throw err;
//                 console.log('User saved');
// });

//Using Body parser middleware
app.use(bodyparser.json());

//Defining the static files folder
app.use(express.static(path.join(__dirname, '/public')));

//Creating a middleware to decode the user from token
var authorized = function(req, res, next){
    var token = req.headers.authorization;
    var user = jwt.decode(token, JWT_SECRET);
    req.user = user;
    return next();
};

//Getting port number
app.get('port', (req, res)=>{
    res.send(listener.address().port);
});

//Sending home page
app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/index.html');
});

//API to send the notes from Database upon request
app.get('/notes', (req, res, next)=>{
    noteModel
    .find({})
    .sort('-noteDate')
    .exec(function(err, data){
        if (err) throw err;
        res.send(data);
    });
    //res.send(notes);
});

//API to send list of all users
app.get('/users', (req, res, next)=>{
    userModel
    .find({})
    .sort('userFirstName')
    .exec(function(err, data){
        if (err) throw err;
        res.send(data);
    });
    //res.send(notes);
});

app.post('/chat' ,(req, res, next)=>{
        io.emit('chatInitiated');
        console.log(req.body);
        res.send({}); // Sends entire note object    
})

//API to post new notes
app.post('/notes', authorized ,(req, res, next)=>{
    // var token = req.headers.authorization;
    // var user = jwt.decode(token, JWT_SECRET);
    
    var newNote = noteModel({
        noteText: req.body.newNote,
        noteUser: req.user._id,
        noteUserEmail: req.user.userEmail
    }).save((err,data)=>{
        io.emit('changeinNote');
        res.send(data); // Sends entire note object
    })
    
});

//API to send the username of the user requesting
app.put('/currentuser', authorized, (req, res, next)=>{
    res.send(req.user);
});

//API to delete note
app.delete('/note/:id', (req, res, next)=>{
    //console.log(req.params.id);
    noteModel.findByIdAndRemove(req.params.id, (err, data)=>{
        if(err) throw err;
        //console.log(data); data is entire object here
    });
    io.emit('changeinNote');
    res.send('Item Deleted');
});

//API to check if user exists
app.put('/checkuser/:username', (req, res, next)=>{
    userModel.findOne({userName: req.params.username}, function(err, user){
        if(err) throw err;
        else if (user) res.send({exists: true});
        else res.send({exists: false});
    })
});

//API to signup a neew user
app.post('/signup/createuser', (req, res, next)=>{
    // bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(req.body.userPass, 10, (err, hash)=>{
            var newUser = userModel({
                userFirstName: req.body.userFirstName,
                userLastName: req.body.userLastName,
                userEmail: req.body.userEmail,
                userName: req.body.userName, 
                userPass: hash
            }).save((err, data)=>{
        res.send('User Saved');
    })
        });
    // });    
});

//API for signing in
app.put('/users/signin', (req, res, next)=>{
    console.log(req.body.userEmail);
    userModel.findOne({userEmail: req.body.userEmail}, (err, user)=>{
        bcrypt.compare(req.body.userPass, user.userPass, (err, result)=>{
            if (result) {
                var token = jwt.encode(user, JWT_SECRET);
                return res.json({token: token, userFirstName: user.userFirstName});
            } 
            else {
                return res.status(400).send();
            }
        });
    });
});


app.put('/chat', (req, res, next)=>{
    console.log('lk');
});


app.get('*', (req, res, next)=>{
    return res.redirect('/#'+ req.originalUrl);
});

// app.listen(port, function(){
//     console.log("Server listening at port: " + listener.address().port);
// });

server.listen(port, function(){
    console.log("Server listening at port: " + port);
});
