const express=require("express");
const http=require("http");
const app=express();
const PORT=process.env.PORT || 3000;
const server=http.createServer(app);   //NORMALLY HAPPENS BEHIND THE SCENE BY EXPRESS,BUT SOCKET IO NEEDS IT EXPLICITLY TO WORK
const socketio=require("socket.io");
const io=socketio(server);
const fetch=require("node-fetch");
const {addUser, removeUser, getUser, getUsersinRoom}=require("./users");
const Filter = require("bad-words"),
  filter = new Filter();

app.use(express.static(__dirname + "../../public"));
app.use(express.json());

const genMessage=((text,username)=>{
    return {
        text,
        username,
        createdAt : new Date()
    }
})
const genLocMessage = ((url,place,username) => {
  return {
    url,
    place,
    username,
    createdAt: new Date()
  };
})

//BELOW EVENT FIRES WHENEVER SOCKETIO GETS NEW CONNECTION
io.on("connection",(socket)=>{                   //SOCKET HAS INFO ABOUT CLIENT WHICH CONNECTED TO SERVER
    console.log('New websocket connection');
    
    // socket.emit("serverMessage",genMessage("Welcome"))            //FIRES EVENT NAMED WELCOME AND DATA (STRING WITH VALUE=MESSAGE) FOR CLIENT WHICH CONNECTED 
    
    // socket.broadcast.emit("serverMessage",genMessage("A new User has joined!")); //BROADCASTS TO ALL OTHER CLIENTS ACCEPT CLIENT WHICH FIRED MESSAGE EVENT
    
    socket.on("join",({username,room},cb)=>{ //LAST PARAM IS CALLBACK WHICH SENDS ACKNOWLEDGEMENT
        const {user,error}=addUser({id:socket.id,username,room})  //ADDUSER RETURNS ERROR OR USER 
        //SOCKET.ID PARTICULAR ID FOR PARTICULAR SOCKET,SET BY SOCKET.IO ITSELF
        if(error)
        {
            return cb(error);
        }
        socket.join(user.room)  //NOW ALL SOCKET EVENTS WILL OCCUR FOR THAT PARTICULAR ROOM FOR JOIN EVENT
        socket.emit("serverMessage", genMessage("Welcome "+user.username,"admin")); 
        socket.broadcast.to(user.room).emit("serverMessage",genMessage(`${user.username} just joined!`,"admin"));//broadcast to particular room
        io.to(room).emit("userList",{users:getUsersinRoom(room),room})
        cb()   //ACKNOWLEDGEMENT
    })
    
    socket.on("message",(data,fn)=>{                //TRIGGERRED WHEN CLIENT FIRES EVENT NAMED MESSAGE 
        const {username,room}=getUser(socket.id);
        if(filter.isProfane(data))
        {
            io.to(room).emit("serverMessage",genMessage(filter.clean(data),username));                //NOW ALL CLIENTS GET RESULT
            return fn("Please refrain from profainity!!");              //ACKNOWLEDGEMENT SENT TO CLIENT     
        }
        io.to(room).emit("serverMessage",genMessage(data,username));
         //socket.emit("welcome",data)           // DATA SENT TO PARTICULAR CLIENT WHICH FIRED MESSAGE EVENT COZ SOCKET STORES CLIENT INFO
        fn();                   //ACKNOWLEDGEMENT SENT TO CLIENT
    })

    socket.on("sendLocation",(data,cb)=>{
        const { username,room } = getUser(socket.id);
        var url=`https://us1.locationiq.com/v1/reverse.php?key=${process.env.API_KEY}&lat=${data.latitude}&lon=${data.longitude}&format=json`;
        fetch(url).
        then(res=>res.json()).
        then((res)=>{
            io.to(room).emit("serverLocationMessage",genLocMessage(`https://www.google.com/maps?q=${data.latitude},${data.longitude}`,res.display_name,username));
            cb();
        })
        .catch((err)=>{
            cb(err);
        })
        
    })

    socket.on("disconnect",()=>{        //EVENT FIRED WHEN A CLIENT DISCONNECTS(IN BULIT EVENT)
        const user=removeUser(socket.id)
        if(user)
        {
            io.to(user.room).emit("serverMessage",genMessage(`${user.username} just disconnected`,"admin")); //ALL CONNECTED CLIENTS INFORMED OF SAME
            io.to(user.room).emit("userList",{users:getUsersinRoom(user.room),room:user.room})
        }
    })
})

server.listen(PORT,()=>{
    console.log(`Server started at ${PORT}`);
})