const express = require('express');
const router = express.Router();
const sendMail = require('nodemailer')
const User = require('./../modals/user');
const bcrypt = require('bcryptjs');
const Chat = require('./../modals/chat');
var mongoose = require('mongoose');
var groupChat = require('./../modals/group');

let transporter = sendMail.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
           user: 'hada35555@gmail.com',
           pass: '9602413585'
       }
  });

var email;
router.get('/',(req,res) =>{
    res.render('login');
})

router.get('/signUp',(req,res) =>{
    res.render('SignUp');
})

router.get('/getUser',(req,res) =>{
    var userlist = [],user2= [];
    console.log(req.query.name.length);
if(req.query.name.length != 0){
    const regex = new RegExp(req.query.name);
    User.find({
        email: { $nin: email},
        firstname: {$regex: regex}
    },{_id:1,firstname:1,phoneno: 1})
    .then(user=>{
       console.log(user);
       if(user.length != 0){
        User.find({email: email},{friends: 1})
        .then(data=>{
            data[0].friends.forEach(id=>{
                userlist.push(JSON.stringify(id));
            }) 
            console.log(data[0].id);
            user.forEach(element=>{
                console.log(element.id)
                console.log(userlist);
                var flag = userlist.indexOf(JSON.stringify(element.id));
                if(flag == -1){
                       user2.push(element);
                   }
                })
                if(user2.length == 0)  res.send('no friends of these name');
                else res.send(user2);
            })
       }else{
           res.send('no friends of these name')
       }
    })
}
})
router.get('/getData',(req,res) =>{

User.find({email: email},{friends: 1}).then(user =>{
     console.log(user[0].friends.length);
   if(user[0].friends.length !=0){
    User.aggregate([
        {
            $match: { email: email}
        },
        {
           $lookup:
              {
                 from: "User",
                 localField: "friends",
                 foreignField: "_id",
                 as: "friendlist"
             }
        }
    ]).exec((err,data)=>{
        console.log(data);
        res.send(data[0].friendlist);
    })
}
 })
})


router.get('/userList',(req,res) =>{
    User.aggregate([
        {
            $match: { email: email}
        },{
           $lookup:
              {
                 from: "User",
                 localField: "friends",
                 foreignField: "_id",
                 as: "friendlist"
             }
        }
    ]).exec((err,data)=>{
        console.log(data);
        console.log(data[0].friendlist)
        res.send(data[0].friendlist);
    })
})

router.get('/getChat',(req,res) =>{ 
    length = Object.keys(req.query.data).length;
    console.log(length);
    if(length >4){
        Chat.find({
                $or: [
                    {$and : [{  from: req.query.currentuser, to : req.query.data }]} ,
                    {$and : [ { from : req.query.data , to : req.query.currentuser } ]}
                ]
        }).sort({
            date: 1
        })
        .then(user=>{
            console.log(user);
                    res.send(user);
                    })
    }else{
        Chat.find({
           groupId :  req.query.data['_id']
    }).sort({
        date: 1
    })
    .then(user=>{
        console.log(user);
                res.send(user);
                })
    }
})

router.post('/friend',(req,res)=>{ 
    var name = [];
    console.log(req.body.friendData,req.body.currentuser)
    req.body.friendData.map(element=>{
        
        User.update({
            _id:element
        },{
            $addToSet: { friends: req.body.currentuser}
        }).then(d=>{
            console.log(d);
        })

        User.find({
            _id: element
        }).then(user=>{
            name.push(user);
        })
    })

    User.update(
       {
           email: email
       },{
         $addToSet: { friends: req.body.friendData}
       }
    ).then(s=>{
        console.log(s,s.nModified);
        if(s.nModified == 0){
            res.send('user already in friend list');
        }else{
           res.send(name);
        }
    })
})


router.post('/group',(req,res)=>{ 
    console.log("insert:"+req.body.groupData)
    groupChat.insertMany({
        name: req.body.groupName,
        userId: req.body.groupData
    }).then(user=>{
        console.log('id:'+mongoose.Types.ObjectId(user[0]._id));
        req.body.groupData.forEach(id=>{
        User.update({
            _id: mongoose.Types.ObjectId(id)
        },{
              $addToSet: { group: mongoose.Types.ObjectId(user[0]._id) }
            }
        ).then(data=>{
            console.log("group:"+user);
        })
      })
        req.flash('success_msg', 'Group Created Sucessfully');
        res.send(user);
    })
})

router.get('/getgroup',(req,res)=>{
    var userGroup = [];
    console.log(req.query.userid)
    User.find({
        _id: req.query.userid
    },{group:1}).then(user=>{
            console.log(user);
            user[0].group.forEach(element=>{
                userGroup.push(mongoose.Types.ObjectId(element));
            })
            console.log(userGroup);
               groupChat.find({
                   _id:{ $in: userGroup}
               }).then(data=>{
                  console.log(data);
                  res.send(data);
               })
    })
})


router.post('/signUp',(req,res) =>{
    console.log(req.body);
    const {firstname,lastname,email,phoneno, password,confirm_password, gender} = req.body;
    let errors = [];

    //check password match
    if(password !== confirm_password){
        errors.push({msg: "Password do not match"});
    }
    //check password length
    if(password.length < 6){
        errors.push({msg: "Password should be atleast 6 characters"});
    }
    if(phoneno.length < 10){
        errors.push({msg: "PhoneNo should be atleast 10 characters"});
    }
    if(errors.length >0){
        res.render('SignUp',{
            errors,
            firstname,
            lastname,
            email,
            phoneno,
            password,
            confirm_password,
            gender
        })
    }else{
        // Validation passed
        User.findOne({email: email})
            .then(user =>{
                if(user){
                    //user exists
                    errors.push({msg:"User already exits"});
                    res.render('SignUp',{
                        errors,
                        firstname,
                        lastname,
                        email,
                        phoneno,
                        password,
                        confirm_password,
                        gender
                    })
                }else{
                   const newUser = new User({
                       firstname,
                       lastname,
                       email,
                       phoneno,
                       password,
                       gender
                   });
                   
                   //Hash password
                   bcrypt.genSalt(10,(err, salt) =>{
                        bcrypt.hash(newUser.password, salt, (err, hash)=>{
                            if(err) throw err;
                            //set password to hashed
                              newUser.password = hash;
                            //Save or insert User
                            User.insertMany({
                                firstname: newUser.firstname,
                                lastname: newUser.lastname,
                                email: newUser.email,
                                phoneno: newUser.phoneno,
                                password: newUser.password,
                                gender: newUser.gender
                            }).then(user => {
                                console.log(req.body.email);
                                let mailOptions = {
                                    to: req.body.email,
                                    subject: "Registration",
                                    text: "You register successfully"
                                };
                                 transporter.sendMail(mailOptions,(err,info) =>{
                                     if(err) return console.log(err);
                                     console.log('mail is sent');
                                });
                                req.flash('success_msg', 'User now sucessfully register and can log in');
                                res.redirect('/');
                                })
                              .catch(err => console.log(err))
                        })
                   })
                }
            })
    }
})

router.post('/login', (req,res)=>{
     
    email = req.body.email;
    User.findOne({
        email: req.body.email
    }).then(user =>{
        if(user == null){
            req.flash('error_msg', 'Email not register');
            res.redirect('/');
        }else{
        //match password
        bcrypt.compare(req.body.password, user.password, (err,isMatch) =>{
            if(err) throw err;
            if(isMatch){
                res.render('chat',{user: user});
            }else{
                req.flash('error_msg', 'Password Incorrect');
                res.redirect('/');
            }
        })
      }
    })
})
module.exports = router;