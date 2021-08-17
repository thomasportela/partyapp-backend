const jwt = require('jsonwebtoken');
const con = require('./config/database');


module.exports = {
  token: function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        res.status(401).send('Missing token')
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, uid) => {
        if (err) {
            console.log('token invalido nessa pora')
            res.status(403).send('Invalid token')
        }else{
            req.uid = uid.userId
            next()
        }
    })
  },
  owner: function authenticateOwnership(req, res, next){
    con.query(`SELECT creator_uid FROM parties WHERE pid = '${req.body.pid}'`, function(err, rows){
      if(err){return res.status(500).send()}
      if(req.uid === rows[0].creator_uid){
        next()
      }else{
        return res.status(400).send('notowner')
      }
    })
  }
}