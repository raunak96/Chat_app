const users=[]
//ADDUSER,REMOVEUSER,GETUSER,GETUSERINROOM

const addUser=({id,username,room})=>{
      
      username=username.trim().toLowerCase()          //clean the data
      room=room.trim().toLowerCase();

      if(!username || !room)              //validate user
      {
            return {
                  error :'Username and room required!'
            }
      }
      const existUser=users.find(user=>user.username===username && user.room===room )      //check if same user already exists in that room
      if(existUser)
            return {error:'username already in use!'};
      const user={id,username,room}       
      users.push(user);  //STORE USER
      return {user};
}
const removeUser=(id)=>{
      const index=users.findIndex(user=>user.id===id)
      if(index!==-1)
      {
            return users.splice(index,1)[0]   //return removed user
      }
}
const getUser=(id)=>{
      return users.find(user=>user.id===id);
}
const getUsersinRoom=(room)=>{
      room=room.trim().toLowerCase();
      return users.filter(user => user.room === room);
}
module.exports={
      addUser,removeUser,getUser,getUsersinRoom
}