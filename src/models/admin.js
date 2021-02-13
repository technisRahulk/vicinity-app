const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt=require('bcryptjs')
const jwt =require('jsonwebtoken')
const adminSchema=new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        require:true,
        trim:true,
        lowercase:true,
        validate(val)
        {
            if(!validator.isEmail(val))
            {
                throw new Error('Incorrect Email')
            }
        }
    },
    password:
    {
        type:String,
        trim:true,
        required:true,
        minlength:5
    },
    name: {
        type: String,
        required: true
    }
})

adminSchema.methods.generateAuthToken=async function()
{
    const admin=this
    const token=jwt.sign({_id:admin._id.toString()},"SecretText",{expiresIn:"1 day"}) 
    return token
}
adminSchema.pre('save',async function(next)
{
    const admin=this 
    if(admin.isModified('password')) 
    {
        admin.password=await bcrypt.hash(admin.password,8)
    }
    next()
})

adminSchema.statics.findByCredentials=async(email,password)=>
{
    const admin=await Admin.findOne({email})
    if(!admin)
    {
        throw new Error('Unable to login')
    }
    const isMatch=await bcrypt.compare(password,admin.password)
    if(!isMatch)
    {
        throw new Error('Unable to login')
    }
    return admin
}
const Admin = mongoose.model('admin', adminSchema);
module.exports = Admin;