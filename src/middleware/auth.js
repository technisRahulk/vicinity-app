const jwt=require('jsonwebtoken')
const Admin=require('../models/admin')


const auth=async(req,res,next)=>
{
    try{
        const token = req.cookies.token;
        const decoded=jwt.verify(token,'SecretText')
        const admin=await Admin.findOne({_id:decoded._id})
        if(!admin)
        {
            throw new Error()
        }
        req.admin=admin
        req.token=token
        next()
    }catch(e)
    {
        res.send('{error:Please Authenticate}')
    }
    
}

module.exports=auth