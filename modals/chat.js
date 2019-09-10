const mongoose = require('mongoose');

const Schema  =  mongoose.Schema;
const chatSchema  =  new Schema(
    {
    message: {
      type: String
    },
    from: {
      type: mongoose.Schema.Types.ObjectId
    },
    to:{
        type: mongoose.Schema.Types.ObjectId
    },
    groupId:{
      type: mongoose.Schema.Types.ObjectId
    },
    date:{
      type: Date,
      default: Date.now
    },
    status:{
      type: Number
    }
});

let Chat  =  mongoose.model("Chat", chatSchema,'chat');
module.exports  =  Chat;