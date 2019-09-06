const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const {ObjectId} = require('mongodb');

const EmployeeSchema = require('./employee');
const SaasSchema = require('./saas');

const Schema = mongoose.Schema;
var UserSchema = new Schema({
  userName: {type: String},
  email: {
    type: String,
    validate: {
        validator:validator.isEmail,
        message:'Email is not valid'
    }
  },
  password: {type: String},
  empList:[String],
  employees:[EmployeeSchema],
  SaaS:[SaasSchema],
});

// UserSchema.methods.toJSON = function () {
//   var user = this;
//   var userObject = user.toObject();
//   return _.pick(userObject, ['userName','_id', 'email']);
// }

UserSchema.methods.removeToken = function (token) {
    var user = this;
  
    return user.update({
        $pull: {
            tokens: {token}
        }
    })
  }
  
   UserSchema.statics.findByToken = function (token) {
       var User = this;
       var decoded;
  
       try {
        decoded = jwt.verify(token, 'abc123');
       }catch(e) {
         return Promise.reject();
       }
       return User.findOne({
       '_id': decoded._id,
       })
   }

UserSchema.methods.generateAuthToken = function () {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(), access}, 'abc123').toString();
 
  return user.save().then(() => {
      return token;
  });
};


UserSchema.statics.findByCredentials = function (email, password) {
   var User = this;

  return User.findOne({email}).then((user) => {
      console.log(user)
       if(!user) {
           return Promise.reject();
       }
       return new Promise((resolve, reject) => {
       bcrypt.compare(password, user.password, (err, res) => {
           if(res) {
               resolve(user);
           } else {
               reject();
           }
       })
       });
   });
};

UserSchema.pre('save', function (next) {
   var user = this;

   if(user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(user.password, salt, (err, hash) => {
            user.password = hash;
            next();
        })
    })
   } else {
       next();
   }
});

module.exports = mongoose.model('User', UserSchema, 'users');