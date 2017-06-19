var nodebook = angular.module('nodebook',["ngRoute"]);

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
        });
});

nodebook.controller('nbController', function($scope, $http){
    $scope.nbNoteSubmit = function(){
        $http.post('/notes', {newNote: $scope.nbNewNote}).then(function(){
            getNotes();
            $scope.newNote = '';
        });
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

    $scope.signIn = function(){
        $http.put('/users/signin', {'userEmail': $scope.username, 'userPass': $scope.password})
            .then(function(){
                alert('Signed in Successfully');
            }, function(err){
                alert('Invalid username/password, Error: '+ err);
            })
    };

});

nodebook.controller('signupController', function($scope, $http){
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