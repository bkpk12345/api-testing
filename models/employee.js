const mongoose = require('mongoose');
const validator = require('validator');

const Schema = mongoose.Schema;

var EmployeeSchema = new Schema({
    name: {type:String},
    email: {
        type: String,
        validate: {
            validator:validator.isEmail,
            message:'Email is not valid...'
        }
    },
    _creator: {type:mongoose.Schema.Types.ObjectId}
})

module.exports = EmployeeSchema;