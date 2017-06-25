var nodebook = angular.module('nodebook',["ngRoute", "ngCookies","ngAnimate"]);

nodebook.config(function($routeProvider, $locationProvider){
    $routeProvider
        .when('/',{
            // template: "<h1>Random</h1>",
            templateUrl: '/views/main.html',
            controller: 'nbController'
        })
        .when('/signup',{
            templateUrl: 'views/signup.html',
            controller: 'signupController'
        })
        .when('/404', {
            templateUrl: 'views/404.html'
        })
        .otherwise({
            redirectTo: '/404'
        });
        

        $locationProvider.html5Mode(true);
});

nodebook.run(function($rootScope, $cookies){
    if ($cookies.get('token') && $cookies.get('currentUser')){
        $rootScope.token = $cookies.get('token');
        $rootScope.currentUser = $cookies.get('currentUser');
    }
});

nodebook.controller('nbController', function($scope, $http, $cookies, $rootScope){
    $scope.getCurrentUser = function(){
        var getu;
        $http.put('/currentuser', {}, {headers: {
                        'authorization': $rootScope.token
                    }}).then(function(res){
                        $cookies.put('cun', res.data.userFirstName);
                        // return this.getu;
                    });
                    // console.log(getu);
                    // return getu;
    };
    
    $scope.getCurrentUser();
    $scope.nbShowChatRoom = false;
    $scope.nbGcChatBody = true;
    $scope.nbShowChatP2P = false;
    $scope.nbp2pChatBody = true;
    $scope.nbShowChatWindoP2p = function(){
        $scope.nbShowChatP2P = true;
    };
    $scope.startChat = function(targetUser, targetUserFirstName){

        $scope.nbShowChatP2P = true;
        angular.element('#p2pChatTitle').html(
            targetUserFirstName + 
            '<span class="glyphicon glyphicon-remove nb-right" ng-click="nbp2pClose()"></span> <span class="fa fa-window-maximize nb-right nb-padding-minus" ng-click="nbp2pMaximize()" ></span> <span class="glyphicon glyphicon-minus nb-right nb-padding-minus" ng-click="nbp2pMinimize()" ></span>'
        );
        socket.emit('p2pChat', {tu: targetUser, cu: $cookies.get('token')});
        // $http.post('/chat', {tu: targetUser, cu: $cookies.get('token')});
        // socket.emit('popChat');
    };


    $scope.nbShowCR = function(){
        $scope.nbShowChatRoom = true;
    };

    $scope.nbGcClose = function(){
        $scope.nbShowChatRoom = false;
    };

    $scope.nbp2pClose = function(){
        $scope.nbShowChatP2P = false;
    };

    $scope.nbGcMinimize = function(){
        $scope.nbGcChatBody = false;
    };

    $scope.nbGcMaximize = function(){
        $scope.nbGcChatBody = true;
    };

    $scope.nbp2pMaximize = function(){
        $scope.p2p_chat_body = true;
    };

    $scope.nbp2pMinimize = function(){
        $scope.p2p_chat_body = false;
    };    

    var socket = io();
    socket.on('changeinNote', function(){
        getNotes();
    });
    socket.on('chatInitiated', function(){
        // console.log('At client side');
    });

    socket.on('popChat', function(data){
        // console.log('called');
        $http.put('/chat', data);
    });

    socket.on('p2pconnect', function(data){
        console.log('p2pconnect called');
        console.log($cookies.get('currentUser'));
        console.log(data.targeter);
        console.log($cookies.get('currentUser') == data.targeter);
        if( $cookies.get('currentUser') == data.targeter ){
            console.log('executed');

            $scope.$apply($scope.nbShowChatWindoP2p());
            angular.element('#p2pChatTitle').html(
            data.initiator + 
            '<span class="glyphicon glyphicon-remove nb-right" ng-click="nbp2pClose()"></span> <span class="fa fa-window-maximize nb-right nb-padding-minus" ng-click="nbp2pMaximize()" ></span> <span class="glyphicon glyphicon-minus nb-right nb-padding-minus" ng-click="nbp2pMinimize()" ></span>'
        );
            // $scope.nbp2pChatBody = true;
            // socket.join(data.room);
            socket.emit('p2ptargetjoin', {room: data.room});
            $scope.p2proom = data.room;
        }
        // $scope.p2proom = data.room;
        // $scope.p2prooms['room'+data.room] = data.room;
    });

    socket.on('p2pmessage', function(data){
        console.log('p2pmessage called');
        angular.element('#p2p_chat_body').append(
            '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>'
        );
        angular.element('#broadcastGroupChat').html('');
    });

    $scope.p2pChatSend = function(){
        console.log('$scope.p2proom : ' + $scope.p2proom);
        socket.emit('p2pChatSend', {
            room: $scope.p2proom,
            message: $scope.p2pChatMsg,
            handle: $cookies.get('cun')
        });
        $scope.p2pChatMsg = '';
    };

    $scope.nbNoteSubmit = function(){
        $http.post('/notes', 
                    {newNote: $scope.nbNewNote},
                    {headers: {
                        'authorization': $rootScope.token
                    }}).then(function(){
            getNotes();
            $scope.nbnewNote = '';
        });
    };

    $rootScope.logout = function(){
        localStorage.setItem("cu", null);
    $cookies.remove('token');
    $cookies.remove('currentUser');
    $rootScope.token = null;
    $rootScope.currentUser = null;
};

    $scope.nbRemoveNote = function(note) {
        //console.log(note._id);
        $http.delete('/note/' + note._id).then(function(){
            getNotes();
        });
    };

    var getNotes = function(){
        $http.get('/notes').then(function(res){
        $scope.notes = res.data;
    });
    };
    
    getNotes();

    var getUsers = function(){
        $http.get('/users').then(function(res){
            $scope.users = res.data;
        });
    };

    getUsers();

    
   
    $scope.signIn = function(){
        localStorage.setItem("cu", $scope.username);
        $http.put('/users/signin', {'userEmail': $scope.username, 'userPass': $scope.password})
            .then(function(res){
                $cookies.put('token', res.data.token);
                $cookies.put('currentUser', $scope.username);
            
                $rootScope.token = res.data.token;
                $rootScope.userFirstName = res.data.userFirstName;
                $rootScope.currentUser = $scope.username;
                // alert('Signed in Successfully');
            }, function(err){
                alert('Invalid username/password, Error: '+ err);
            })
    };

    $scope.validateUser = function (userID) {
        return userID == localStorage.getItem("cu");
    };

    $scope.parseDate = function (input) {
  var parts = input.match(/(\d+)/g);
  // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
  var datetemp = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4]); // months are 0-based
  return (datetemp.getMonth() +1) + "/" + datetemp.getDay() + '/' + datetemp.getFullYear() + ' ' + datetemp.getHours() + ":" + datetemp.getMinutes();
}

    $scope.nbDateFormat = function(noteDate) {
        return $scope.parseDate(noteDate);
    };

    

    $scope.groupChatSend = function(){
        // console.log('groupChatSend called');
        socket.emit('groupChat',{
            message: $scope.groupChatMsg,
            handle: $cookies.get('cun')
        });
        $scope.groupChatMsg = '';
        
    };

    socket.on('groupChat', function(data){
        
        angular.element('#group_chat_body').append(
            '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>'
        );
        angular.element('#broadcastGroupChat').html('');
    });

    $scope.broadcastGC = function(){
        socket.emit('typing', $cookies.get('cun'));
    };

    socket.on('typing', function(data){
        angular.element('#broadcastGroupChat').html('<p>' + data + ' is typing...</p>')
    });
    $scope.getUser = '';
    
    // console.log($scope.getUser);

});

nodebook.controller('signupController', function($scope, $http, $rootScope){
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
});

angular.element('chat_body').html = "Hello guys";
