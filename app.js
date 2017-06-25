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

// server.listen(process.env.PORT || 3000);

io.on("connection", function(socket){
    // console.log(socket.handshake.headers);
    console.log('New Client connected');
    socket.on('groupChat', function(data){
        io.sockets.emit('groupChat', data);
    });

    socket.on('typing', function(data){
        socket.broadcast.emit('typing', data);
    });

    socket.on('p2pChat', function(data){
        
        var initiator = jwt.decode(data.cu, JWT_SECRET);
        
        // var room = data.tu + initiator._id;
         var room = 'abc';
        console.log('User joined')
        socket.join(room);

        userModel.findById(data.tu, function(err, target){
            if(err) throw err;
            io.sockets.emit('p2pconnect', {room: room, targeter: target.userEmail ,initiator: initiator.userFirstName});
        });

        
    });

    socket.on('p2ptargetjoin', function(data){
        console.log('Target joined room '+ data.room);
        socket.join(data.room);
        var clients = io.sockets.adapter.rooms[data.room].sockets;
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
        console.log('Number of users: ' + numClients);
        console.log(clients);
    });

    socket.on('p2pChatSend', function(data){
        console.log(data);
        io.sockets.in('abc').emit('p2pmessage', {message: data.message, handle: data.handle});
    });
});

var port = process.env.PORT || 3000;

var JWT_SECRET = 'maverick';

var urlencodedParser = bodyparser.urlencoded({ extended: false });

var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } }; 

var mongodbUri = 'mongodb://admin:sskssk@ds131432.mlab.com:31432/nodebook';

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


var notes = ['Make MEAN app', 'Learn React', 'Going to movies'];

app.use(bodyparser.json());

app.use(express.static(path.join(__dirname, '/public')));

var authorized = function(req, res, next){
    var token = req.headers.authorization;
    var user = jwt.decode(token, JWT_SECRET);
    req.user = user;
    return next();
};

app.get('port', (req, res)=>{
    res.send(listener.address().port);
});

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/index.html');
});

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

app.put('/currentuser', authorized, (req, res, next)=>{
    res.send(req.user);
});

app.delete('/note/:id', (req, res, next)=>{
    //console.log(req.params.id);
    noteModel.findByIdAndRemove(req.params.id, (err, data)=>{
        if(err) throw err;
        //console.log(data); data is entire object here
    });
    io.emit('changeinNote');
    res.send('Item Deleted');
});

app.put('/checkuser/:username', (req, res, next)=>{
    userModel.findOne({userName: req.params.username}, function(err, user){
        if(err) throw err;
        else if (user) res.send({exists: true});
        else res.send({exists: false});
    })
});

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
