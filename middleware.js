const { authenticate } = require("passport");

module.exports=loggedIn=async(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.flash('error','first login the website')
        return res.redirect('/login');
     
    }
    next()
}


