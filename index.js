
const serverPort = 4000,
http = require("http"),
express = require("express"),
mongoose = require('mongoose'),
cors = require('cors'),
bodyParser = require('body-parser'),
app = express(),
server = http.createServer(app),
WebSocket = require("ws"),
redis = require('./connection'),
//Chat = require('./chatModel');
config  = require('./config');



var websocketServer = new WebSocket.Server({ server });
var pub,sub,result,size,ChatR,i;
var regexp = /(:?\.\s?|^)([A-Za-z\u00C0-\u1FFF\u2800-\uFFFD])/gi;

var blacklist = [];
var chatRooms = [];
var chatRoomUsers = {};
var chatRoomMessages ={};
var response = {};
// var messageArray = [];

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var Filter = require('bad-words');
const { json } = require("body-parser");
filter = new Filter();

// var filter = new Filter({ regex: /\*|\.|$/gi });
 
// var filter = new Filter({ replaceRegex:  /[A-Za-z0-9가-힣_]/g }); 
// filter.addWords('अ');
//filter.clean('हो');

//     var emoji = require('node-emoji');
//     let emojivalue =emoji.get(':smiley:'); 
//     console.log(emojivalue);

// console.log(filter.clean("Don't be an shit"));


// mongoose.connect("mongodb://localhost:27017/myDB", {
//   useUnifiedTopology: true,
//   useNewUrlParser: true
// });

// var db = mongoose.connection;

// db.on("error", console.error.bind(console, "connection error:"));

// db.once("open", function() {
//   console.log("Connection Successful!");
// });


//  const MessageModel = require('./model/message');

//redis initilisation
redis.initCache(config);
//pub = redis.connectRedis();

// when a websocket connection is established
websocketServer.on('connection', async(webSocketClient) => {

webSocketClient.send('{ "connection" : "ok"}');

pub = await redis.connectRedis();

//when a message is received
webSocketClient.on('message', async function(message)  {
    try{
        console.log(typeof(message));

        if(message.toLowerCase === 'keepalive')
        return;
      
         
         pub.publish('chatR',message);
         var message = JSON.parse(message);
         if(message.action=="connectToChat"){
          //  if(message.userId == "Admin1"){
          //   webSocketClient.userId = message.userId;
          //   webSocketClient.chatRoomId = message.chatRoomId;
          //   webSocketClient.send(JSON.stringify({
          //     action:"oldMessages",
          //     messages:chatRoomMessages[message.chatRoomId] || [],
          //     blockUsers:blacklist

          //   }));
          //  }
          //  else{
         webSocketClient.userId = message.userId;
         webSocketClient.chatRoomId = message.chatRoomId;
        
         console.log("blockkkkkk",blacklist);
         blacklist.forEach(function(element,index){
           if(element.userId==message.userId){
           console.log("user is block already");
           webSocketClient.send(JSON.stringify({
            action:"BlockResponse",
            messages:"You have been blocked"
        }))
      }
         })
      //    if(blacklist.includes(message.userId)){
      //      console.log("inside blockkkkkkk aleady");
      //    webSocketClient.send(JSON.stringify({
      //     action:"BlockResponse",
      //     messages:"You have been blocked"
      // }))
         
      //   }
         console.log("chatRoom",chatRooms);
         console.log("chatRoomId",message.chatRoomId);
         console.log(chatRooms.includes(message.chatRoomId));
         socketUserId= message.userId
         if(!chatRooms.includes(message.chatRoomId)){
         
           chatRooms.push(message.chatRoomId);
           chatRoomUsers[message.chatRoomId]={};
           chatRoomUsers[message.chatRoomId][socketUserId] = webSocketClient;
           console.log("only user",chatRoomUsers[message.chatRoomId]);
         }
         else{
          chatRoomUsers[message.chatRoomId][socketUserId]=webSocketClient
           console.log("users",chatRoomUsers);
           console.log("else user",chatRoomUsers[message.chatRoomId]);

         }
        //  if(message.userId=="Admin1"){
        //   webSocketClient.send(JSON.stringify({
        //     action:"oldMessages",
        //     messages:chatRoomMessages[message.chatRoomId] || [],
        //     blockUsers:blacklist
        //   }));
        //  }
        //  else{
         //console.log(chatRoomUsers[message.chatRoomId].length);
         if(message.userId=="Admin1"){
          webSocketClient.send(JSON.stringify({
            action:"oldMessages",
            messages:chatRoomMessages[message.chatRoomId] || [],
            blockUsers:blacklist
          }));
          return;
         }
         webSocketClient.send(JSON.stringify({
          action:"oldMessages",
          messages:chatRoomMessages[message.chatRoomId] || []
        }));
          
      //}
        }
        else if(message.action=="sendTextMessage"){
          blacklist.forEach(function(element,index){
            if(element.userId==message.userId){
            console.log("user is block already");
            webSocketClient.send(JSON.stringify({
             action:"BlockResponse",
             messages:"You have been blocked"
         }))
         return;
       } 
          })
        
         
          const userIds = Object.keys(chatRoomUsers[message.chatRoomId]);
          console.log("userIDDDDD",userIds);
            var result = moderateMessage(message.text);
            response ={action:"TextResponse",
            name: message.name,
            text: result,
            msgType: message.msgType,
            photoUrl: message.photoUrl,
            userId:message.userId,
            messageId:message.userId+new Date(),
            timeStamp: message.timeStamp,
            originalText:message.text,
            sanitized: true,
            moderated: message.text !== result}
       
          if(! chatRoomMessages[message.chatRoomId]){
            chatRoomMessages[message.chatRoomId]=[(response)]
          }
          else{
            console.log("inside else");
            if(chatRoomMessages[message.chatRoomId].length>100){
              console.log("inside length");
              chatRoomMessages[message.chatRoomId].splice(0,1);
              chatRoomMessages[message.chatRoomId].push(response);
              console.log("after",chatRoomMessages[message.chatRoomId]);

            }
            else{
              console.log("after",chatRoomMessages[message.chatRoomId]);
           chatRoomMessages[message.chatRoomId]=
            chatRoomMessages[message.chatRoomId].concat((response));
          }
          }
          userIds.forEach(userId=>{
            let user = chatRoomUsers[message.chatRoomId][userId];
            console.log("user",userId);
            user.send(JSON.stringify(response)
            )});

            //save in mongoDb
           // Chat.saveChat(response);
        }

        else if(message.action=="sendEmojiMessage"){
          const users = Object.keys(chatRoomUsers[message.chatRoomId]);
          blacklist.forEach(function(element,index){
            if(element.userId==message.userId){
            console.log("user is block already");
            webSocketClient.send(JSON.stringify({
             action:"BlockResponse",
             messages:"You have been blocked"
         }))
         return;
       } 
          })
        //   if(blacklist.includes(message.userId)){
        //     console.log("inside blockkkkkkk aleady");
        //     webSocketClient.send(JSON.stringify({
        //       action:"BlockResponse",
        //       messages:"You have been blocked"
        //   }))
        //   return;
        //  }
          users.forEach(userId=>{
            let emojiuser = chatRoomUsers[message.chatRoomId][userId]
            emojiuser.send(JSON.stringify({
                    action:"EmojiResponse",
                    emojiText: message.emojiText,
                    userId:message.userId,
                    chatRoomId:message.chatRoomId
                   
                }));

          })
        }

        else if(message.action=="UserBlock"){
          //console.log("chatRoomUsers",chatRoomUsers);
          console.log("inside block action");
      
          const id = message.userId;
          const userIds = chatRoomUsers[message.chatRoomId][id];
          var chatRoomUserName = chatRoomMessages[message.chatRoomId];
          console.log("name",chatRoomUserName);
          var userName;
          //userName = chatRoomUserName.name;
          //  chatRoomUserName.forEach(function(element,index){
          //    if(element.userId==message.userId){
          //    userName = element.name
          //    console.log("match found");
          //    break;
          //    }
          //  });
          for(let i=0;i<chatRoomUserName.length;i++){
            if(chatRoomUserName[i].userId==message.userId){
              console.log("match found");
              userName = chatRoomUserName[i].name
              break;
            }
          }
           console.log("after");
          // for(let i=0;i<name.length;i++){
          //   if(name[i].userId==message.userId){
          //     console.log("name match");
          //     userName = name[i].name
          //     break;
          //   }
          // }
          // console.log("after loppp")
          // var userName;
          // name.forEach(element=>{
          //   if(element.userId==message.userId){
          //   console.log("eleeeeeee",element.name);
          //   userName=element.name;
          //   return;
          // }
          
          // })
          
          // console.log("name",userName);
          
         //console.log("userrrrrrrr",userIds);
     
           if(message.Block==true){
            console.log("inside trueeeee");
           
            if(blacklist.length==0){
              console.log("inside zero");
              blacklist.push({userId:message.userId,name:userName});
              console.log("blackList",blacklist);
              webSocketClient.send(JSON.stringify('{"message":"User is blocked"}'));
              userIds.send(JSON.stringify({
                action:"BlockResponse",
                messages:"You have been blocked"
            }));
            }
            else{
              console.log(">>>>>>> zerooooo");
              blacklist.forEach(function(element,index){
                if(element.userId==message.userId){
                  console.log("already present");
                  console.log("user is blocked already");
               webSocketClient.send(JSON.stringify('{"message":"User is already blocked"}'));
                }
                else{
                  console.log("inside else new");
                  blacklist.push({userId:message.userId,name:userName});
                  console.log("blackList",blacklist);
                  webSocketClient.send(JSON.stringify('{"message":"User is blocked"}'));
                  userIds.send(JSON.stringify({
                    action:"BlockResponse",
                    messages:"You have been blocked"
                }));
                }
              })
            }
           
            // if(!blacklist[i].includes(message.userId)){
            //   console.log("inside iffffffffff");
            //   blacklist.push({userId:message.userId});
            //   console.log("blackList",blacklist);
            //   webSocketClient.send(JSON.stringify('{"message":"User is blocked"}'));
            //   userIds.send(JSON.stringify({
            //     action:"BlockResponse",
            //     messages:"You have been blocked"
            // }));
        //       console.log("user is blocked",chatRoomUsers[message.chatRoomId][message.userId]);
        //       chatRoomUsers[message.chatRoomId][message.userId].send('{"You have been blocked"}');
        
               //webSocketClient.send('{ "User is blocked"}');
          //  }
          //    else{
          //      console.log("user is blocked already");
          //      webSocketClient.send(JSON.stringify('{"message":"User is already blocked"}'));
          //    }
            
    
      
      }
    }

      else if(message.action=="UnblockUser"){
        console.log("inside unblock");
        const Id = message.userId
          const userId = chatRoomUsers[message.chatRoomId][Id];
         
        //  console.log("useridddddd",userId);
        //   blacklist.forEach(element=>{
        //     element==message.userId;
        //     console.log("if true");
        //     webSocketClient.send(json.stringify('{"message" :"User is Unblocked"}'));
        //          console.log("after");
        //          userId.send(JSON.stringify({
        //            action:"UnblockResponse",
        //            messages:"You are unblocked"
        //       }));
        //     blacklist.pop(element)
        //   })
          
        //  if(blacklist.includes(message.userId)){
          for(let i=0;i<blacklist.length;i++){
            if(blacklist[i].userId==message.userId){
              blacklist.pop(blacklist[i]);
              console.log("unblockkk",blacklist);
              console.log("before");
              webSocketClient.send(JSON.stringify('{"message" :"User is Unblocked"}'));
              console.log("after");
              userId.send(JSON.stringify({
                action:"UnblockResponse",
                messages:"You are unblocked"
            }));
             
            }
            // return;
          }
         
        // }
        // else{
        //   webSocketClient.send(JSON.stringify('{"message":"User is not present in block list"}'))
        // }
      }

      else if(message.action=="DeleteMessage"){
        const userIds = Object.keys(chatRoomUsers[message.chatRoomId]);
        console.log("deleteteeee",chatRoomMessages[message.chatRoomId]);
       chatRoomMessages[message.chatRoomId].forEach(function(element,index){
         console.log("element",element)
         if(element.messageId==message.messageId){
           console.log("element found",element,index);
           chatRoomMessages[message.chatRoomId].splice(index,1);
           webSocketClient.send(JSON.stringify({
            action:"DeleteResponse",
            messages:"Message has been deleted",
        }));
        userIds.forEach(userId=>{
          let user = chatRoomUsers[message.chatRoomId][userId];
          //console.log("user",userId);
          user.send(JSON.stringify({ action:"DeleteResponse",
          message:"Message has been deleted",
          deletedMessage:element

      })
          )});
         }
       })

        
        // chatRoomMessages[message.chatRoomId].remove(message.text);
        // console.log("after delete",chatRoomMessages[message.chatRoomId]);

      }

      else if(message.action=="connectToChatRoom"){
        if(message.userId=="Admin1"){
        var chatroom = chatRoomMessages[message.chatRoomId];
        console.log("chatroom",chatroom);
        webSocketClient.send(JSON.stringify({
          action:"Messages",
          messages:chatRoomMessages[message.chatRoomId] || [],
          blockUsers:blacklist
        }));
      }
    }

     else if(message.action ==="disconnectFromChat" )
{
 
  if(webSocketClient.userId)
  webSocketClient.chatRoomId == null;  

delete webSocketClient.chatRoomId;
console.log("disconnect",webSocketClient.chatRoomId);
}

else{
  webSocketClient.send("Invalid action");
}

        webSocketClient.on('close', async function close() {
          console.log('disconnected: ', webSocketClient.chatRoomId+ " "+webSocketClient.userId);
          if(webSocketClient.chatRoomId) {
            let Message = JSON.stringify({
              action: 'disconnectFromChat',
              chatRoomId: webSocketClient.chatRoomId,
              userId: webSocketClient.userId
            })
            console.log(Message);
          }
        });
   

}
catch(err){

}
});  
});


server.listen(serverPort, () => {
console.log(`Websocket server started on port ` + serverPort);
});


function moderateMessage(message) {
// Re-capitalize if the user is Shouting.
if (isShouting(message)) {
  console.log('User is shouting. Fixing sentence case...');
  message = stopShouting(message);
}

// // Moderate if the user uses SwearWords.
if (containsSwearwords(message)) {
  console.log('User is swearing. moderating...');
  message = moderateSwearwords(message);
}

return message;


}


// Detect if the current message is shouting. i.e. there are too many Uppercase
// characters or exclamation points.
function isShouting(message) {
console.log("inside shout ",message);
return message.replace(/[^A-Z]/g, '').length > message.length / 2 || message.replace(/[^!]/g, '').length >= 3;
}

// Correctly capitalize the string as a sentence (e.g. uppercase after dots)
// and remove exclamation points.
function stopShouting(message) {
return capitalizeSentence(message.toLowerCase()).replace(/!+/g, '.');
}

// Returns true if the string contains swearwords.
function containsSwearwords(message) {
return message !== filter.clean(message);
}

function moderateSwearwords(message) {
return filter.clean(message);
}


function capitalizeSentence(input) {
  return input.replace(regexp, function (match) {
    return match.toUpperCase();
  });
}

//module.exports.broadcast = broadcast;