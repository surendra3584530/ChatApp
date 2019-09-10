const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
    },
    lastname: {
        type: String
    },
    email: {
        type: String
    },
    phoneno:{
        type: Number
    },
    password: {
        type: String
    },
    gender:{
        type: String
    },
    friends:[{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    group:[{
        type: mongoose.Schema.Types.ObjectId,ref:'User'
    }]
});


const User = mongoose.model('User',userSchema,'User');

module.exports = User;