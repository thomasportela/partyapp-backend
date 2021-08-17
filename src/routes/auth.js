const routes = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const con = require('../config/database');

function getDateWithYear(datetime) {
  return datetime !== null ? `${datetime.getDate() < 10 ? '0' + datetime.getDate() : datetime.getDate()}/${datetime.getMonth() < 9 ? '0' + (datetime.getMonth()+1) : datetime.getMonth()+1}/${datetime.getFullYear()}` : null;
}

routes.post('/login', (req, res) => {
    console.log('tentei logar')
    con.query(`SELECT uid, email, password from users WHERE email = '${req.body.email}'`,  async function (err, rows){
        if(err){return res.status(500).send()}
        else{
            if(rows.length === 0){
                return res.status(412).send('Email not found')
            }else if(await bcrypt.compare(req.body.password, rows[0].password)){
                con.query(`
                    SELECT u.uid, u.name, u.email, u.phone, u.cpf, u.gender, u.birthDate, u.instagram, u.twitter, u.tiktok, u.youtube, pp.url FROM users as u
                    LEFT JOIN profile_pictures as pp
                    ON u.uid = pp.uid
                    WHERE u.uid = '${rows[0].uid}'
                    `, function(err, rows){
                        if(err){res.status(500).send()}
                        console.log(rows)
                        const birthDate = rows[0].birthDate
                        const user = {...rows[0], birthDate: getDateWithYear(birthDate)};
                        const accessToken = jwt.sign({userId: user.uid}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '6h'})
                        console.log(`Token criado: ${accessToken}`)
                        const refreshToken = jwt.sign({userId: user.uid}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '6h'})
                        return res.status(200).json({accessToken: accessToken, refreshToken: refreshToken, user: user});
                    }
                )
            }else{
                return res.status(401).send('Wrong password')
            }
        }
    })
})

routes.post('/token', (req, res) => {
    const refreshToken = req.body.refreshToken
    if(refreshToken == null){return res.status(401).send('Missing token')}
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, response) => {
        if(err){
            return res.status(403).send('Invalid token')
        }else{
            const accessToken = jwt.sign({userId: response.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10s'})
            return res.status(201).json({accessToken: accessToken})
        }
    })
})

module.exports = routes;