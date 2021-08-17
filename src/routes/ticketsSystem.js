const routes = require('express').Router();
const con = require('../config/database');
const auth = require('../authentication');
const jwt = require('jsonwebtoken');



routes.post('/purchase-ticket', auth.token, (req, res) => {
  console.log(req.body.pid)
  con.query(`SELECT creator_uid FROM parties WHERE pid = '${req.body.pid}'`, function(err, rows){
    if(err){return res.status(500).send()}
    if(rows.length > 0){
      if(req.uid !== rows[0].creator_uid){
        con.query(`SELECT purchaseid FROM purchases WHERE pid = '${req.body.pid}' AND uid = '${req.uid}'`, function(err, rows){
          if(err){return res.status(500).send()}
          if(rows.length === 0){
            con.query(`INSERT INTO purchases values(default, default, '${req.uid}', '${req.body.pid}', default, default);`, function(err, result){
              if(err){return res.status(500).send()}
              const ticket = jwt.sign({purchaseid: result.insertId}, process.env.PURCHASE_TOKEN_SECRET)
              con.query(`UPDATE purchases SET ticket = '${ticket}' WHERE purchaseid = ${result.insertId}`, function(err){
                if(err){return res.status(500).send()}
                return res.status(201).send()
              }) 
            })
          }else{
            return res.status(400).send('alreadyPurchased')
          }
        })
      }else{
        return res.status(400).send('owner')
      }
    }else{
      return res.status(400).send('partyNotAvailable')
    }
  })
})

// colocar verificacao se o maluco ja esta dentro da festa

routes.post('/verify-ticket', auth.token, auth.owner, (req, res) => {
  jwt.verify(req.body.ticket, process.env.PURCHASE_TOKEN_SECRET, (err, data) => {
    if(err){
      console.log('ticket invalido')
      res.status(400).send('invalidTicket')
    }else{
      con.query(`
        SELECT pur.pid, pur.uid, u.name, pp.url, pur.inside FROM purchases as pur
        LEFT JOIN profile_pictures AS pp
        ON pp.uid = pur.uid
        JOIN users as u
        ON pur.uid = u.uid
        WHERE pur.purchaseid = '${data.purchaseid}';
      `, function(err, rows){
        if(err){return res.status(500).send()}
        if(rows[0].pid == req.body.pid){
          return res.status(200).json({uid: rows[0].uid, name: rows[0].name, url: rows[0].url, inside: rows[0].inside})
        }else{
          return res.status(400).send('ticketToAnotherParty')
        }
      })
    }
  })
})

routes.post('/accept-user-in-party', auth.token, auth.owner, (req, res) => {
  con.query(`SELECT purchaseid FROM purchases WHERE uid = ${req.body.uid} AND pid = ${req.body.pid}`, function(err, rows){
    if(err){return res.status(500).send()}
    if(rows.length > 0){
      con.query(`UPDATE purchases SET inside = true WHERE purchaseid = ${rows[0].purchaseid};`, function(err, result){
        if(err){return res.status(500).send()}
          return result.changedRows !== 0 ? res.status(201).send() : res.status(400).send('userAlreadyIn')
      })
    }else{
        return res.status(400).send('notPurchased')
    }
  })
})

routes.post('/remove-user-from-party', auth.token, auth.owner, (req, res) => {
  con.query(`UPDATE purchases SET inside = false WHERE pid = ${req.body.pid} AND uid = ${req.body.uid}`, function(err, result){
    if(err){return res.status(500).send()}
    console.log(result)
    return result.changedRows === 0 ? res.status(400).send('userAlreadyOut') : res.status(201).send()
  })
})

// criar ban list


module.exports = routes;