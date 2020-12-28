const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    name: {type:String, required:true},
    text: {type:String, default:null},
    msgType: {type:String, enum:['TEXT','IMAGE'], default:"TEXT"},
    photoUrl: {type:String, default:null},
    timeStamp: {type:Date, default:Date.now()}
    //userId:{}
});

module.exports = mongoose.model('messages',messageSchema );