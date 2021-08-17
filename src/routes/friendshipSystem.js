const routes = require('express').Router();
const con = require('../config/database');
const auth = require('../authentication');

routes.post('/send-friend-request', auth.token, (req, res) => {
    con.query(`INSERT INTO friends values (default, '${req.uid}', '${req.body.friend_uid}', default, default)`, function(err){
        if(err){
            console.log(err);
            return res.status(500).send()
        }
        return res.status(201).send()
    })
})


routes.post('/unfriend', auth.token, (req, res) => {
    con.query(`
        DELETE FROM friends WHERE friend_s = '${req.uid}' AND friend_r = '${req.body.friend_uid}'
        OR friend_s = '${req.body.friend_uid}' AND friend_r = '${req.uid}';
    `, function(err){
        if(err){
            console.log(err);
            return res.status(500).send()
        }
        res.status(201).send()
    })
})

routes.post('/accept-friend-request', auth.token, (req, res) =>{
    con.query(`UPDATE friends SET friendship_accepted = true, friendship_time = CURRENT_TIMESTAMP WHERE friend_s = '${req.body.friend_uid}' AND friend_r = '${req.uid}'`, function(err){
        if(err){return res.status(500).send()}
        return res.status(201).send()
    })
})

routes.post('reject-friend-request', auth.token, (req, res) =>{
    con.query(`DELETE FROM friends WHERE friend_s = '${req.body.friend_uid}' AND friend_r = '${req.uid}'`, function(err){
        if(err){return res.status(500).send()}
        return res.status(200).send()
    })
})

routes.post('/check-friend', auth.token, (req, res) => {
    console.log(req.uid)
    console.log(req.body.friend_uid)
    con.query(`SELECT friendship_accepted FROM friends WHERE friend_s = '${req.uid}' AND friend_r = '${req.body.friend_uid}'`, function(err, rows){
        if(err){return res.status(500).send()}
        if(rows.length !== 0){
            if(rows[0].friendship_accepted){
                return res.status(200).send('friends')
            }else{
                return res.status(400).send('sent')
            }
        }else if(rows.length === 0){
            con.query(`SELECT friendship_accepted FROM friends WHERE friend_s = '${req.body.friend_uid}' AND friend_r = '${req.uid}'`, function(err, rows){
                if(err){return res.status(500).send()}
                if(rows.length !== 0){
                    if(rows[0].friendship_accepted){
                        return res.status(200).send('friends')
                    }else{
                        return res.status(400).send('waiting')
                    }
                }
            })
        }else{
            return res.status(404).send('not-friends')
        }

    })
})

routes.get('/get-friends', auth.token, (req, res) => {
    con.query(`
        SELECT u.uid, u.name, pp.url FROM friends as f
        JOIN users as u ON f.friend_s = u.uid
        LEFT JOIN profile_pictures as pp ON u.uid = pp.uid
        WHERE friend_r = '${req.uid}' AND friendship_accepted = true
        UNION
        SELECT u.uid, u.name, pp.url FROM friends as f
        JOIN users as u ON f.friend_r = u.uid
        LEFT JOIN profile_pictures as pp ON u.uid = pp.uid
        WHERE friend_s= '${req.uid}' AND friendship_accepted = true;
    `, function(err, rows) {
        if(err){return res.status(500).send()}
        if(rows.length === 0){return res.status(404).send()}
        else{return res.status(200).json({friends: rows})}
    })
})

module.exports = routes;