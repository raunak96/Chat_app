const socket=io()    //TO CONNECT CLIENT TO SERVER SOCKETIO
var formInput = document.querySelector('input[type="text"]');
var sendBtn =document.querySelector('#send');
var locBtn = document.querySelector("#send-location");
var messages= document.querySelector("#messages");
var sidebar= document.querySelector("#sidebar");
var messageTemplate = document.querySelector("#message-template").innerHTML;
var locationTemplate = document.querySelector("#location-message-template").innerHTML;
var sidebarTemplate= document.querySelector("#sidebar-template").innerHTML;

//ignoreQueryPrefix removes ? from form query
var {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true}) //QS IS JS LIBRARY WE'VE INCLUDED FROM CDN,LOCATION.SEARCH CONTAINS PARAMS OF FORM QUERY

//AUTOSCROLLS WHEN NEW MESSAGE ARRIVES<BUT DOESNT WHEN WE HAVE SCROLLED UP TO LOOK AT PAST MESSAGES
const autoscroll=()=>{
    const newMessage=messages.lastElementChild;  //GETS LAST CHILD ELEMENT OF MESSAGES DIV WHICH HAS ALL OUR MESSAGES

    const styles=getComputedStyle(newMessage);    //GETS ALL CSS STYLES OF SPECIFIED ELEMENT
    const margin=parseInt(styles.marginBottom);      //gets margin size of new Message

    //HEIGHT OF newMessage (OFFSETHEIGHT-doesnot include margin) + its MARGIN(margin)
    const newMessageheight = newMessage.offsetHeight + margin;    
    
    //HEIGHT OF VISIBLE MESSAGES CONTAINER WHICH ALSO CONTAINS newMessage
    const visibleHeight=messages.offsetHeight;  //without margin

    const containerHeight=messages.scrollHeight;   //ENTIRE HEIGHT OF MESSAGES CONTAINER  without margin
    
    //HOW FAR HAVE WE SCROLLED=distance from top + visible height of container 
    const scrolled=messages.scrollTop + visibleHeight ; //scrollTop RETURNS HEIGHT FROM TOP WE ARE AT

    //if leftover height(total container height - height we have scrolled <= height of new message i.e we are bottom,then autoScroll)
    if(containerHeight-scrolled <= newMessageheight)
    {
          messages.scrollTop=containerHeight;  // GO TO CONTAINER'S HEIGHT DISTANCE FROM TOP I.E AT BOTTOM OF CONTAINER
    }

}

socket.on("serverMessage",(data)=>{
      console.log(data);             //WHENEVER WELCOME EVENT EMITTED FROM SERVER,IT IS RECIEVED USING THIS
      const html=Mustache.render(messageTemplate,{
            message: data.text,                 //MESSAGE IN messageTemplate SCRIPT REPLACED BY DATA
            username:data.username,
            createdAt:moment(data.createdAt).format("h:mm a")
      });
      messages.insertAdjacentHTML('beforeend',html);
      autoscroll()
})

socket.on("serverLocationMessage",(data)=>{
      console.log(data);
      const html=Mustache.render(locationTemplate,{
            url:data.url,
            place:data.place,
            username:data.username,
            createdAt:moment(data.createdAt).format("h:mm a")
      })
      messages.insertAdjacentHTML("beforeend", html);
      autoscroll()
})
socket.on("userList",({users,room})=>{
      const html=Mustache.render(sidebarTemplate,{
            room,
            users
      });
      sidebar.innerHTML=html;
})

document.querySelector("#frm").addEventListener('submit',(e)=>{
      e.preventDefault();
      
      //DISABLE SEND BUTTON TILL WE DONT GET ACKNOWLEDGEMENT FROM SERVER
      sendBtn.setAttribute('disabled','disabled');

      var input=e.target.elements.Message.value       //ALTERNATIVE WAY TO SELECT INPUT INSIDE FORM BY THEIR NAME(message in this case)
      socket.emit('message',input,(error)=>{          //TO SEND DATA FROM CLIENT TO SERVER WITH EVENT NAME MESSAGE,THEN REMAINING PARAMS ARE DATA
            if(error)                             //LAST PARAM(OPTIONAL) CALLBACK FOR EVENT ACKNOWLEDGEMENT SENT BY SERVER whose param data sent by server in acknowledgement
                  console.log(error);                 
            else
                  console.log("Message was delivered!"); 
            sendBtn.removeAttribute('disabled');
            formInput.value="";
            formInput.focus();                                    
      });                     
})

locBtn.addEventListener('click',()=>{
      if(!navigator.geolocation)
            return alert("Gelocation not supported by your browser");

      locBtn.setAttribute("disabled", "disabled");
      
      navigator.geolocation.getCurrentPosition((position)=>{
            var pos={latitude:position.coords.latitude, longitude:position.coords.longitude},place;
            socket.emit("sendLocation",pos,()=>{
                  console.log("Location shared!");
                  locBtn.removeAttribute('disabled');
            });
            
      })
})

socket.emit("join",{username,room},(error)=>{
      if(error)
      {
            location.href = "/"; //REDIRECT BACK TO ROOT ROUTE
            alert(error);
      }
});