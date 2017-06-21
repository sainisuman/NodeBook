var nodebook = angular.module('nodebook',["ngRoute", "ngCookies"]);

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
    var socket = io();
    socket.on('changeinNote', function(){
        getNotes();
    });

    socket.on('popChat', function(data){
        console.log('called');
        $http.put('/chat', data);
    });

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

    $scope.startChat = function(targetUser){
        socket.emit('popChat');
    };
   
    $scope.signIn = function(){
        localStorage.setItem("cu", $scope.username);
        $http.put('/users/signin', {'userEmail': $scope.username, 'userPass': $scope.password})
            .then(function(res){
                $cookies.put('token', res.data.token);
                $cookies.put('currentUser', $scope.username);
                $rootScope.token = res.data.token;
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

});

nodebook.controller('signupController', function($scope, $http, $rootScope){
    $scope.nbNewUserSubmit = function(){
        var newUser = {
            'userEmail': $scope.nbNewUser,
            'userPass': $scope.nbNewPass
        }
        $http.post('/signup/createuser', newUser).then(function(data){
            console.log(data);
        });
    }
});