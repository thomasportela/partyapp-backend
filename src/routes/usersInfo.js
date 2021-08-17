const routes = require('express').Router();
const con = require('../config/database');
const auth = require('../authentication');
const bcrypt = require('bcrypt');

const fieldsNames = [["instagram", "instagram"], ["twitter", "twitter"], ["tiktok", "tiktok"], ["youtube", "youtube"]];

const fieldsMap = new Map(fieldsNames);

function getString(string) {
    return string !== null && string !== '' ? `\'${string}\'` : null;
}


routes.post('/users/name-and-picture', auth.token, (req, res) => {
    con.query(`
            SELECT u.uid, u.name, pp.url FROM users AS u
            LEFT JOIN profile_pictures AS pp
            ON u.uid = pp.uid
            WHERE u.uid = '${req.body.uid}'
            `, function(err, rows){
                if(err){return res.status(404).send(err)}
                else{
                    return res.status(200).json({user: rows})
                }
            }
    )
})

routes.post('/users/socials', auth.token, (req, res) => {
    con.query(`SELECT instagram, twitter, tiktok, youtube FROM users WHERE uid = '${req.body.uid}'`, function(err, rows){
        if(err){return res.status(500).send()}
        res.status(200).json({socials: rows[0]})
    })
})

routes.post('/update-user', auth.token, (req, res) => {
    const body = req.body.changes
    console.log(body)
    var query = 'UPDATE users SET'
    for(var key in body){
        console.log(key)
        query += ` ${key} = ${getString(body[key])},`
    }
    query = query.slice(0, -1)
    query += ` WHERE uid = '${req.uid}'`
    console.log(query)
    con.query(query, function(err){
        if(err){
            console.log(err)
            return res.status(500).send()
        }
        res.status(201).send()
    })
})

routes.post('/change-user-password', auth.token, (req, res) => {
  con.query(`SELECT password FROM users WHERE uid = '${req.uid}'`, async function(err, rows){
    if(err){return res.status(500).send()}
    if(await bcrypt.compare(req.body.actualPassword, rows[0].password)){
      const hashedPassword = await bcrypt.hash(req.body.newPassword, 10)
      con.query(`UPDATE users SET password = '${hashedPassword}' WHERE uid = '${req.uid}'`, function(err){
          if(err){return res.status(500).send()}
          return res.status(201).send()
      })
    }else{
      console.log('tentei trocar a senha do ' + req.uid + ' com a senha ' + rows[0].password)
      return res.status(400).send()
    }
  })
});

routes.get('/get-user-tickets', auth.token, (req, res) => {
  con.query(`
    SELECT pur.pid, p.name, pur.ticket from purchases as pur
    join parties as p
    on pur.pid = p.pid
    where pur.uid = '${req.uid}';
  `, function(err, rows){
    if(err){return res.status(500).send}
    return res.status(200).json(rows)
  })
})

module.exports = routes;