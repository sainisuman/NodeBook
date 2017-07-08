//Creating Angular module "nodebook"
var nodebook = angular.module('nodebook',["ngRoute", "ngCookies","ngAnimate"]);

//Configuring the routes
nodebook.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider){
    $routeProvider
        //For Main page
        .when('/',{
            templateUrl: '/views/main.html',
            controller: 'nbController'
        })
        //For signup page
        .when('/signup',{
            templateUrl: 'views/signup.html',
            controller: 'signupController'
        })
        //Page not found or error 404 page
        .when('/404', {
            templateUrl: 'views/404.html'
        })
        .otherwise({
            redirectTo: '/404'
        });
        
        $locationProvider.html5Mode(true);
}]);

//Get the tokens if already stored as cookies when the app starts
nodebook.run(["$rootScope", "$cookies", function($rootScope, $cookies){
    //Checking if the cookies are already stored
    if ($cookies.get('token') && $cookies.get('currentUser')){
        //Retirieving token and currentUser information from cookies
        $rootScope.token = $cookies.get('token');
        $rootScope.currentUser = $cookies.get('currentUser');
    }
}]);

//Defining the nbController
nodebook.controller('nbController', ["$scope", "$http", "$cookies", "$rootScope", function($scope, $http, $cookies, $rootScope){
    $scope.getCurrentUser = function(){
        //HTTP PUT request to get current user First Name from the token
        $http.put('/currentuser', {}, {headers: {
                        'authorization': $rootScope.token
                    }}).then(function(res){
                        $cookies.put('cun', res.data.userFirstName);
                        $scope.currentUserFirstName = res.data.userFirstName;
                    });
                    
    };
    //Invoking the getCurrentUser function to retrieve the userFirsName from Token
    $scope.getCurrentUser();

    //Variable for showing the Chat Room when the user clicks on it
    $scope.nbShowChatRoom = false;

    //Variable for showing the body of Chat Room when maximized and hide when minimized
    $scope.nbGcChatBody = true;

    //Variable for showing the private chat window when the user clicks on another user
    $scope.nbShowChatP2P = false;

    //Variable for showing the body of private chat when maximized and hide when minimized
    $scope.nbp2pChatBody = true;

    //Funtion that shows private chat window when executed
    $scope.nbShowChatWindoP2p = function(){
        $scope.nbShowChatP2P = true;
    };

    //Function that initiates private chat. The target user values are sent as parameters
    $scope.startChat = function(targetUser, targetUserFirstName){

        //Shows chat window when chat is initiated
        $scope.nbShowChatP2P = true;

        //Adding the target user first name and icons such as minimize, maximize, and close to chat window
        angular.element('#p2pChatTitle').html(
            targetUserFirstName + 
            '<span class="glyphicon glyphicon-remove nb-right" ng-click="nbp2pClose()"></span> <span class="fa fa-window-maximize nb-right nb-padding-minus" ng-click="nbp2pMaximize()" ></span> <span class="glyphicon glyphicon-minus nb-right nb-padding-minus" ng-click="nbp2pMinimize()" ></span>'
        );

        //Emit an event p2pChat so that chat will be initiated on the target user side too.
        socket.emit('p2pChat', {tu: targetUser, cu: $cookies.get('token')});
    };

    //Function that shows chat room window when invoked
    $scope.nbShowCR = function(){
        $scope.nbShowChatRoom = true;
    };

    //Function that hides chat room window when invoked    
    $scope.nbGcClose = function(){
        $scope.nbShowChatRoom = false;
    };

    //Function that hides private chat window when invoked
    $scope.nbp2pClose = function(){
        $scope.nbShowChatP2P = false;
    };

    //Function that hides chat room body when invoked. Used when user minimizes the chat window
    $scope.nbGcMinimize = function(){
        $scope.nbGcChatBody = false;
    };

    //Function that shows chat room body when invoked. Used when user maximizes the chat window
    $scope.nbGcMaximize = function(){
        $scope.nbGcChatBody = true;
    };

    //Function that shows private chat body when invoked
    $scope.nbp2pMaximize = function(){
        $scope.p2p_chat_body = true;
    };

    //Function that hides private chat body when invoked
    $scope.nbp2pMinimize = function(){
        $scope.p2p_chat_body = false;
    };    

    //Web Sockets
    var socket = io();

    //Event listener when a user posts a note
    socket.on('changeinNote', function(){
        getNotes();
    });

    //Event listener when chat is initiated
    socket.on('chatInitiated', function(){
        // console.log('At client side');
    });

    //Event listener to pop up the chat window
    socket.on('popChat', function(data){
        $http.put('/chat', data);
    });

    //Event listener for private chat
    socket.on('p2pconnect', function(data){
        
        //If the currentUser is the one someone else is requesting for private chat
        if( $cookies.get('currentUser') == data.targeter ){
            
            //Show the private chat window
            $scope.$apply($scope.nbShowChatWindoP2p());
            
            //Add the user name with whom the user is going to chat and icons to minimize, maximize and close
            angular.element('#p2pChatTitle').html(
            data.initiator + 
            '<span class="glyphicon glyphicon-remove nb-right" ng-click="nbp2pClose()"></span> <span class="fa fa-window-maximize nb-right nb-padding-minus" ng-click="nbp2pMaximize()" ></span> <span class="glyphicon glyphicon-minus nb-right nb-padding-minus" ng-click="nbp2pMinimize()" ></span>'
        );

            //Event emitter to join a separate room
            socket.emit('p2ptargetjoin', {room: data.room});
            $scope.p2proom = data.room;
        }
        
    });

    //Event listener when message is getting exchanged between two users
    socket.on('p2pmessage', function(data){
    
        //Add the name and message to chat body
        angular.element('#p2p_chat_body').append(
            '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>'
        );

        //Erase the message entered on text box after sending
        angular.element('#broadcastGroupChat').html('');
    });

    //Function to be executed when user hits the send button in chat window
    $scope.p2pChatSend = function(){
        
        //Event emitter for one of the users sent a message
        socket.emit('p2pChatSend', {
            room: $scope.p2proom,
            message: $scope.p2pChatMsg,
            handle: $cookies.get('cun')
        });
        $scope.p2pChatMsg = '';
    };

    //Function to be executed when user submits a new note
    $scope.nbNoteSubmit = function(){

        //HTTP POST request to update the note in Database
        $http.post('/notes', 
                    {newNote: $scope.nbNewNote},
                    {headers: {
                        'authorization': $rootScope.token
                    }}).then(function(){
                        //Update notes from Database
                        getNotes();
                        $scope.nbnewNote = '';
                    });
    };

    //Funtion invoked when user clicks on Logout button. Clears the local storage, cookies
    $rootScope.logout = function(){
        localStorage.setItem("cu", null);
        $cookies.remove('token');
        $cookies.remove('currentUser');
        $rootScope.token = null;
        $rootScope.currentUser = null;
    };

    //Function invoked when user wants to delete a note he posted
    $scope.nbRemoveNote = function(note) {
        
        //HTTP DELETE request to update database
        $http.delete('/note/' + note._id).then(function(){
            
            //Update Notes from database
            getNotes();
        });
    };

    //Function to update notes from Database
    var getNotes = function(){

        //HTTP GET request to get the notes from database
        $http.get('/notes').then(function(res){
        $scope.notes = res.data;
    });
    };
    
    //Executing the function so that Notes will be updated when app starts running
    getNotes();

    //Function to get the list of users registered  to display on Chat bar
    var getUsers = function(){

        //HTTP GET request to get user names
        $http.get('/users').then(function(res){
            $scope.users = res.data;
        });
    };

    //Executing the function so that uses will be updated when app starts running
    getUsers();

    //Function that executes when user clicks sign in button
    $scope.signIn = function(){

        //Storing the current username in local storage
        localStorage.setItem("cu", $scope.username);

        //HTTP PUT request sending username and password and store token ad user details as cookies
        $http.put('/users/signin', {'userEmail': $scope.username, 'userPass': $scope.password})
            .then(function(res){
                $cookies.put('token', res.data.token);
                $cookies.put('currentUser', $scope.username);
                $rootScope.token = res.data.token;
                $rootScope.userFirstName = res.data.userFirstName;
                $rootScope.currentUser = $scope.username;
            }, function(err){
                alert('Invalid username/password, Error: '+ err);
            })
    };

    //Function that validates the user by checking if current user is author of note displayed
    $scope.validateUser = function (userID) {
        return userID == localStorage.getItem("cu");
    };

    //Parsing Date
    $scope.parseDate = function (input) {
        var parts = input.match(/(\d+)/g);
        var datetemp = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4]); // months are 0-based
        return (datetemp.getMonth() +1) + "/" + datetemp.getDay() + '/' + datetemp.getFullYear() + ' ' + datetemp.getHours() + ":" + datetemp.getMinutes();
    }

    //Formatingdate
    $scope.nbDateFormat = function(noteDate) {
        return $scope.parseDate(noteDate);
    };

    //Function that gets invoked when user clicks on Send button in group chat window
    $scope.groupChatSend = function(){
        
        //Even emitter for meesage being posted in chat room
        socket.emit('groupChat',{
            message: $scope.groupChatMsg,
            handle: $cookies.get('cun')
        });

        //Setting the message in textbox as blank after sending the message
        $scope.groupChatMsg = '';  
    };

    //Event listener for message recieving in group chat
    socket.on('groupChat', function(data){
        
        angular.element('#group_chat_body').append(
            '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>'
        );
        angular.element('#broadcastGroupChat').html('');
    });

    //Broadcasting functions
    $scope.broadcastGC = function(){
        socket.emit('typing', $cookies.get('cun'));
    };

    socket.on('typing', function(data){
        angular.element('#broadcastGroupChat').html('<p>' + data + ' is typing...</p>')
    });
    $scope.getUser = '';

}]);

nodebook.controller('signupController',["$scope", "$http", "$rootScope", function($scope, $http, $rootScope){
    
    //Function invoked when new user submits information to sign up
    $scope.nbNewUserSubmit = function(){
        var newUser = {
            'userFirstName': $scope.nbSuFirstName,
            'userLastName': $scope.nbSuLastName,
            'userName': $scope.nbNewUser,
            'userEmail': $scope.nbSuEmail,
            'userPass': $scope.nbNewPass
        }
        $http.post('/signup/createuser', newUser).then(function(data){
            // console.log(data);
        });
    }

    //Validating the new user username. If it is available or not
    $scope.validateUsername = function() {
       
       $http.put('/checkuser/' + $scope.nbNewUser).then(function(res){
            // console.log(res);
            $scope.result = res.data.exists;
        });
        // console.log($scope.result);
        if($scope.result){
        document.getElementById('userNameHelpBlock').innerHtml = "Username not available"
        // document.findElementById('userNameHelpBlock').classList.add('MyClass');
        }

    };
}]);
