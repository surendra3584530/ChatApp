const mongoose = require('mongoose');

const Schema  =  mongoose.Schema;
const groupSchema  =  new Schema(
    {
        name: {
            type: String
        },
        userId:{
            type: Array
        }
    });

const groupChat  =  mongoose.model("groupChat", groupSchema,'groupData');
module.exports  =  groupChat;