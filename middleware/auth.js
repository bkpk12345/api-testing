const jwt = require('jsonwebtoken')

const authenticate = (req, res, done) => {
    const token = req.headers.authorization
    // console.log("token comes from frontend ",token)
    
    let id = null
    try {
      id = jwt.verify(token, 'secretkey').id
    }catch(e) {
        return res.status(401).send(e.message)
    }
    // console.log(id);
    req.id = id
    done() 
}


module.exports = {authenticate}