var express = require('express');
var path = require('path');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var noteModel = require('./models/notes');
var userModel = require('./models/users');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');

var app = express();

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

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/index.html');
});

app.get('/notes', (req, res, next)=>{
    noteModel.find({}, function(err, data){
        if (err) throw err;
        res.send(data);
    });
    //res.send(notes);
})

app.post('/notes', urlencodedParser ,(req, res, next)=>{
    var token = req.headers.authorization;
    var user = jwt.decode(token, JWT_SECRET);
    
    var newNote = noteModel({
        noteText: req.body.newNote,
        noteUser: user._id,
        noteUserEmail: user.userEmail
    }).save((err,data)=>{
        res.send(data); // Sends entire note object
    })
    
})

app.delete('/note/:id', (req, res, next)=>{
    //console.log(req.params.id);
    noteModel.findByIdAndRemove(req.params.id, (err, data)=>{
        if(err) throw err;
        //console.log(data); data is entire object here
    });
    res.send('Item Deleted');
});

app.post('/signup/createuser', (req, res, next)=>{
    // bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(req.body.userPass, 10, (err, hash)=>{
            var newUser = userModel({userEmail: req.body.userEmail, userPass: hash}).save((err, data)=>{
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
                return res.json({token: token});
            } 
            else {
                return res.status(400).send();
            }
        });
    });
});

app.listen(process.env.PORT, function(){
    console.log("Server listening at port 3000");
})