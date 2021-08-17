const routes = require('express').Router();
const con = require('../config/database');
const auth = require('../authentication');

function getDateWithYear(datetime) {
  return datetime !== null ? `${datetime.getDate() < 10 ? '0' + datetime.getDate() : datetime.getDate()}/${datetime.getMonth() < 9 ? '0' + (datetime.getMonth()+1) : datetime.getMonth()+1}/${datetime.getFullYear()}` : null;
}

function getTime(datetime) {
  return datetime !== null ? `${datetime.toTimeString().slice(0, 5)}` : null;
}

routes.post('/search-people', auth.token, (req, res) => {
  con.query(`
    SELECT u.uid, u.name, pp.url FROM users as u
    LEFT JOIN profile_pictures as pp ON pp.uid = u.uid
    WHERE u.name LIKE '%${req.body.search}%'
  `, function(err, rows) {
    if(err){return res.status(500),send()}
    if(rows.length === 0){return res.status(404).send()}
    else{return res.status(200).json({users: rows})}
  })
})

routes.post('/search-parties', auth.token, (req, res) => {
  con.query(`
    SELECT p.*, pb.url FROM parties AS p
    LEFT JOIN party_banners AS pb ON pb.pid = p.pid
    WHERE p.name LIKE '%${req.body.search}%';
  `, function(err, rows){
    if(err){return res.status(500).send()}
    if(rows.length === 0){return res.status(404).send()}
    else{
      const parties = [];
      for(var i = 0; i < rows.length; i++){
        const party = {
            pid: rows[i].pid,
            name: rows[i].name,
            creator_uid: rows[i].creator_uid,
            price: rows[i].price_1,
            latitude: rows[i].latitude,
            longitude: rows[i].longitude,
            obs1: rows[i].obs1,
            obs2: rows[i].obs2,
            obs3: rows[i].obs3,
            date: getDateWithYear(rows[i].start_time),
            start_time: getTime(rows[i].start_time),
            end_time: getTime(rows[i].end_time),
            url: rows[i].url,
            about: rows[i].about,
        }
        parties.push(party)
      }
      return res.status(200).json({parties: parties})
    }
  })
})

module.exports = routes;