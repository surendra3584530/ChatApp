const express = require('express');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts')
var _ = require('underscore');

const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const Chat = require('./modals/chat');

global.currentuser = '';
var clients = {}
const url = "mongodb://127.0.0.1:27017/records"

//connect to mongo
mongoose.connect(url,{ useNewUrlParser: true})
      .then(() => console.log("Mongodb connect sucessfully ok...."))
      .catch(err => console.log(err));

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(express.urlencoded());

// io.use(socketioJwt.authorize({
//     secret: 'SECRET_KEY',
//     handshake: true
// }));

io.on('connection', (socket) =>{
  
    socket.on('connected',function(userid){
      console.log('new user connected');
      clients[userid] = socket.id
    })

    socket.on('chat message', function(msg,data,user_id){
      if(msg.length > 0){  
          console.log(data,user_id);
          console.log(typeof(data));
        if(typeof(data) == 'string'){
            Chat.insertMany({
                    message: msg,
                    from: user_id,
                    to:data,
                    status: 0,
            })
             console.log(clients);
             console.log(data)
             console.log(clients[data])
             if(clients[data] != undefined)
            {
                io.to(clients[user_id]).emit('chat message',msg,data);
                io.to(clients[data]).emit('chat message',msg,user_id);
            }else{
                io.to(clients[user_id]).emit('chat message',msg,data);
            }
        }else{
            Chat.insertMany({
                message: msg,
                from: user_id,
                groupId:data._id,
                status: 1,
            })
            data.userId.map(id=>{
            console.log(id,user_id,clients[id]);
                if(clients[id] != undefined)
                {
                    io.to(clients[id]).emit('chat message',msg,data);
                }
            })
        }
    }
    })
    socket.on('disconnect',()=>{
        delete clients[(_.invert(clients))[socket.id]];
        console.log('user disconnect');
    })
})

// connect express session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false, 
    // rolling: true,
    // cookie: {
    //     maxAge: time*1000
    // }
  }))

//connect flash
app.use(flash());

//Global vars
app.use((req, res, next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

app.use('/',require('./route/user'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, console.log(`server started on port ${PORT}`))