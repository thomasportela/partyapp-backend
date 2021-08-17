const routes = require('express').Router();
const con = require('../config/database');
const auth = require('../authentication');


routes.get('/check-friend-requests', auth.token, (req, res) => {
    console.log(req.uid)
    con.query(`
        SELECT u.uid, u.name, pp.url FROM friends as f 
        JOIN users as u ON f.friend_s = u.uid
        LEFT JOIN profile_pictures as pp ON u.uid = pp.uid
        WHERE friend_r = '${req.uid}' AND friendship_accepted = false
    `, function(err, rows){
        if(err){return res.status(500).send()}
        if(rows.length !== 0){
          return res.status(200).json({friendRequests: rows})
        }else{
          return res.status(404).send()
        }
    })
})

module.exports = routes;