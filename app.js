
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , room = require('./routes/room')
  , video = require('./routes/video')
  , fblogin = require('./routes/fblogin')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , Facebook = require('facebook-node-sdk')
  , youtube = require('./routes/youtube');

var app = express();
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io').listen(server);

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function (socket) {
  socket.on('updatequeue', function (data) {
    socket.emit('updatequeue', data);
    socket.broadcast.emit('updatequeue', data);
  });

  socket.on('chatupdate', function(data){
    socket.emit('chatupdate', data);
    socket.broadcast.emit('chatupdate', data);
  });
  
  socket.on('roomcreate', function(data){
    socket.emit('roomcreate', data);
    console.log('roomcreate received on server');
    socket.broadcast.emit('roomcreate', {});
  });
});

app.configure(function(){
  // app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser('coffee'));
  app.use(express.session());
  app.use(Facebook.middleware({ appId: process.env.FB_KEY, secret: process.env.FB_SECRET }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.methodOverride());
});

app.configure('development', function(){
  app.use(express.errorHandler());
  mongoose.connect(process.env.MONGOLAB_URI || 'localhost');
});


function facebookGetUser() {
  return function(req, res, next) {
    req.facebook.getUser( function(err, user) {
      console.log("########## ERR ########", err);
      console.log("########## USER ########", user);
      if (!user || err){
        //TODO: Let's make this experience nicer. Logged-out page with "login w/ fb" button...
        res.redirect("/doLogin");
      } else {
        console.log("USER LOGGED IN BITCHES!!!!");
        req.user = user;
        next();
      }
    });
  }
}


app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('notfound', { url: req.url });
    return;
  }
});

app.get('/', facebookGetUser(), routes.index);
app.get('/login', Facebook.loginRequired(), function(req, res){
  res.redirect('/');
});
app.get('/rooms/page/:pageNumber', facebookGetUser(), room.listPaginated);
app.get('/doLogin', fblogin.login);

app.post('/loginDone', fblogin.done);
// app.get('/users/list', user.list);
// app.get('/users/delete_all', user.delete_all);

// app.get('/rooms/list', facebookGetUser(), room.list); // don't use this anymore -- use /rooms/page/1
app.get('/rooms/new', facebookGetUser(), room.new);
app.post('/rooms/create', facebookGetUser(), room.create);
app.get('/rooms/room/:id', facebookGetUser(), room.show);
app.get('/rooms/room/:id/video', facebookGetUser(), room.video);
app.get('/rooms/room/:id/videoById', facebookGetUser(), room.dequeueVideoAndRenderById);
app.get('/rooms/room/:id/queue', facebookGetUser(), room.queue);
app.post('/rooms/enqueue', facebookGetUser(), room.enqueue);
// app.get('/rooms/delete_all', room.delete_all);
// app.get('/rooms/show_all', room.show_all);
// app.get('/video/delete_all', video.delete_all);
// app.get('/video/show_all', video.show_all);
app.get('/about', routes.about);

app.post('/getytvids', youtube.getvids);
app.post('/rooms/search', room.search);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port 3000");
});
