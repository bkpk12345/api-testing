const mongoose = require('mongoose');
const validator = require('validator')
const jwt = require('jsonwebtoken');

const _ = require('lodash');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;
var AdminSchema = new Schema({
    username: {type:String},
    email: {
        type:String,
        validate: {
            validator:validator.isEmail,
            message:'Email is not valid..'
        }
    },
    password: {type: String}
})

AdminSchema.methods.toJSON = function() {
    var admin = this;
    var adminObj = admin.toObject();
    return _.pick(adminObj, ['_id', 'email']);
}

AdminSchema.methods.generateAuthToken = function () {
    var admin = this;
    var access = 'auth';
    var token = jwt.sign({_id: admin._id.toHexString(), access}, 'abc123').toString();
        
    return admin.save().then(() => {
       return token;
    });
    };
AdminSchema.methods.removeToken = function (token) {
    var user = this;
  
    return user.update({
        $pull: {
            tokens: {token}
        }
    })
  }

 
AdminSchema.statics.findByToken = function (token) {
    var Admin = this;
    var decoded;

    try {
     decoded = jwt.verify(token, 'abc123');
    }catch(e) {
      return Promise.reject();
    }
    return Admin.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
    })
}



AdminSchema.statics.findByCredentials = function(email, password) {
    var Admin = this;
    return Admin.findOne({email}).then((user) => {
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
}

AdminSchema.pre('save', function (next) {
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

module.exports = mongoose.model('Admin', AdminSchema, 'admin');