const mongoose = require('mongoose');


const Schema = mongoose.Schema;

var ProductSchema = new Schema({
    name:{
        type:String,
        required:true,
        minlength:1,
        trim:true,
        unique:true
    },
    category: {
        type:String,
        required:true,
        minlength:true,
    },
    plans: [{
        type: {
            type:String,
            required:true
        },
        cost: {
            type:Number,
            required:true
        }}
    ]
});

module.exports = mongoose.model('Product', ProductSchema, 'products');