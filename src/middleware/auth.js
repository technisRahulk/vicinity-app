const jwt=require('jsonwebtoken')
const Admin=require('../models/admin')


const auth=async(req,res,next)=>
{
    // console.log(req.cookies.token)
    try{
        const token = req.cookies.token;
        // console.log(token)
        const decoded=jwt.verify(token,'SecretText')
        const admin=await Admin.findOne({_id:decoded._id})
        if(!admin)
        {
            throw new Error()
        }
        req.admin=admin
        req.token=token
        console.log(req.admin);
        next()
    }catch(e)
    {
        console.log("Authentication failed!");

        res.redirect('/login?error=' + encodeURIComponent('Incorrect_Credentials'))
    }
}

module.exports=auth