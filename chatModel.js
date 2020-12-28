const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({  
  chatRoomId: {type: String,required:true},
  msgType: {type: String,  default: 'TEXT'},
  text: {type:String},
  originalText:{type:String},
  userId:{type:String},
  name:{type:String},
  photoUrl:{type:String,default:null},
  timeStamp:{type:String,default:null},
});
// module.exports = mongoose.model('chats', ChatSchema);

var saveChat = async function(details){
  console.log("det",details);
    let Obj ={
        chatRoomId:details.chatRoomId,
        msgType:details.msgType,
        text:details.text,
        originalText:details.originalText,
        userId:details.userId,
        name:details.name,
        photoUrl:details.photoUrl,
        timeStamp
    }
    console.log("chat",Obj);
    let chat = new ChatSchema(Obj);
    await chat.save();
}

module.exports.saveChat = saveChat;