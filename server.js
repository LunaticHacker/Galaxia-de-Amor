const express = require('express')
const characterMaker = require('./character-maker')
const http = require('http')
const mongoose = require('mongoose')
const User = require('./models/user')
const methodOverride = require('method-override')
const passportSocketIo = require("passport.socketio");
const db = process.env.MONGOURL
mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected")
  })
  .catch((err) => {
    console.log(err)
  })
const app = express()
const flash = require('express-flash')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
var path = require('path')
const passport = require('passport')
const bcrypt = require('bcryptjs')
const mergeImages = require('merge-images');
const Canvas = require('canvas');
const initializePassport = require("./passport-config")
initializePassport(passport, async (name) => {

  return await User.findOne({
    name: name
  })
}, async (id) => {
  return await User.findOne({
    _id: id
  })
})

var cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

app.set('view_engine', 'ejs')
app.set('views', path.join(__dirname, '/public'));
app.use(express.static('public'));
app.use(express.urlencoded({
  extended: false
}))
app.use(flash())
app.use(session({
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  }),
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  const user = req.user
  res.render('game.ejs', {
    user
  })
})
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs', {
    message: req.flash('error')
  })
})
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true



}))

app.get('/help', checkAuthenticated, (req, res) => {
  res.render('help.ejs')
})


app.delete('/logout', (req, res) => {
  req.logOut()
  return res.redirect('/login')
})

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})
app.post('/register', checkNotAuthenticated, async (req, res) => {
  if (req.body.password && req.body.password.length < 6) {
    res.render('register.ejs', {
      error: 'Password must be atleast 6 characters long'
    })
    return
  }
  var hashedPassword

  try {
    hashedPassword = await bcrypt.hash(req.body.password, 10)

  } catch (error) {
    res.sendStatus(500)
    return
  }
  const data = req.body;

  const docs = await User.find({})
  //console.log(docs)
  var Alreadytaken = false
  if (docs) {
    for (var u of docs) {
      if (u.name === data.name) {

        Alreadytaken = true
        break

      }
    }
    if (Alreadytaken) {
      res.render('register.ejs', {
        name: u.name
      })
      return
    }





  } else {

    res.sendStatus(500)


  }

  var image_array = characterMaker(data)





  mergeImages(image_array, {
      Canvas: Canvas
    })
    .then(b64 => {

        cloudinary.uploader.upload(b64, async function(error, result) {
          if (error) {
            res.sendStatus(500)
            return
          }
          var user = new User({
            _id: new mongoose.Types.ObjectId(),
            name: data.name,
            password: hashedPassword,
            image: result.secure_url,
            public_id: result.public_id

          })
          user.save().then(result => {

            console.log(result)
            return res.redirect('/login')

          })




        });



      }


    ).catch(error => {
      res.sendStatus(500)
      console.log(error)
    })


})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')

}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()

}
var server = http.createServer(app);
server.listen(process.env.PORT || 3000)
var io = require('socket.io').listen(server);
var users = {};
io.use(passportSocketIo.authorize({
  passport: passport,
  cookieParser: require('cookie-parser'), // the same middleware you registrer in express
  key: 'connect.sid', // the name of the cookie where express/connect stores its session_id
  secret: process.env.SECRET, // the session_secret to parse the cookie
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  }), // we NEED to use a sessionstore. no memorystore please
  success: onAuthorizeSuccess, // *optional* callback on success - read more below
  fail: onAuthorizeFail, // *optional* callback on fail/error - read more below
}));


io.on('connection', function(socket) {
  socket.on('join', data => {
    users[socket.id] = data



  })
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      socket.broadcast.emit('disconnected', users[socket.id].name)
      delete users[socket.id]
    }
  })
  socket.on('send-chat', (message) => {

	if(users[message.id])
{
 
      users[message.id].message = message.message

}


   




  })
  socket.on('change-pos', data => {


	if(users[data.id])
{
  if(data.x&&data.y)
  {
    users[data.id].x=data.x
    users[data.id].y=data.y
  }
  
  if(data.stance&&data.dir)
   users[data.id].animation =`${data.stance}_${data.dir}`
   if(data.dir==="left")
   {
    users[data.id].left+=1 
    users[data.id].x-=0.01
   }else if(data.dir==="right")
   {
    users[data.id].right+=1 
    users[data.id].x+=0.01
   }else if(data.dir==="up")
   {
     users[data.id].up+=1
     users[data.id].y-=0.01
   }else if(data.dir==="down")
   {
     users[data.id].down+=1
     users[data.id].y+=0.01
   }

}
    
    


  })
  setInterval(() => {
    for (let key in users) {
      (users[key].frameCount += 1)
    }
    socket.emit('heartbeat', users)
  }, 500);
});

function onAuthorizeSuccess(data, accept) {
  var logged_in = false;
  //console.log('successful connection to socket.io');
  for (var key in users) {
    if (data.user._id == users[key]._id) {
      logged_in = true;
    }
  }
  if (logged_in) {
    accept(new Error("You are already logged in"))
  } else {
    accept();
  }


}

function onAuthorizeFail(data, message, error, accept) {


  if (error)
    accept(new Error(message));


}
