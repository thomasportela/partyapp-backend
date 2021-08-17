const routes = require('express').Router();
const bcrypt = require('bcrypt');
const con = require('../config/database');
const aws = require('aws-sdk')
var twilio = require('twilio');

const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

const s3 = new aws.S3();

routes.post('/sendCode',(req, res) => {
    con.query(`SELECT email, phone, cpf FROM users WHERE email = '${req.body.email}' OR phone = '${req.body.phone}' OR cpf = '${req.body.cpf}'`, async function(err, rows){
        if(rows.length != 0){
            if(rows[0].email === req.body.email) return res.status(401).send('email');
            if(rows[0].phone === req.body.phone) return res.status(401).send('phone');
            if(rows[0].cpf === req.body.cpf) return res.status(401).send('cpf');
        }else if(rows.length === 0){
            try{
                const response = await client
                    .verify
                    .services(process.env.TWILIO_SERVICE_SID)
                    .verifications
                    .create({
                      to: req.body.phone,
                      channel: 'sms'
                    })
                return res.status(200).send()
            }catch(err){
                return res.status(500).send()
            }
        }
    }) 
})

routes.post('/verifyCode', async (req, res) => {
    try{
        console.log(req.body)
        const response = await client
            .verify
            .services(process.env.TWILIO_SERVICE_SID)
            .verificationChecks
            .create({
                to: req.body.user.phone,
                code: req.body.code
            })
        console.log(response)
        if (response.valid === false) {
            return res.status(401).send()
        }else if(response.valid){
            console.log(req.body.user)
            if(req.body.user.name == undefined || req.body.user.email == undefined || req.body.user.password == undefined || req.body.user.cpf == undefined || req.body.user.gender == undefined || req.body.user.phone == undefined || req.body.user.birthDate == undefined){
                return res.status(400).send()
            }else{
                birthDate = req.body.user.birthDate
                const hashedPassword = await bcrypt.hash(req.body.user.password, 10)
                con.query(`INSERT INTO users values (
                    default,
                    '${req.body.user.name}',
                    '${req.body.user.email}',
                    '${req.body.user.cpf}',
                    '${req.body.user.gender}',
                    '${hashedPassword}',
                    '${req.body.user.phone}',
                    '${birthDate.split("/")[2]}-${birthDate.split("/")[1]}-${birthDate.split("/")[0]}',
                    default,
                    default,
                    default,
                    default,
                    default
                )`, function(err){if(err){res.status(500).send()}})
                return res.status(201).send()
            }
        }
    }catch(err){
        console.log(err)
        return res.status(500).send()
    }
})

routes.post('/sendCode-forgotPassword', (req, res) => {
    con.query(`SELECT uid FROM users WHERE phone = '${req.body.phone}'`, async function(err, rows){
        if(err){
            console.log(err)
            return res.status(500).send()
        }else{
            if(rows.length === 0){
                return res.status(404).send()
            }else{
                try{
                    const response = await client
                        .verify
                        .services(process.env.TWILIO_SERVICE_SID)
                        .verifications
                        .create({
                            to: req.body.phone,
                            channel: 'sms'
                        })
                    console.log(response)
                    return res.status(201).send(response)
                }catch(err){
                    return res.status(500).send()
                }
            }
        }
    })
})

routes.post('/verifyCode-forgotPassword', async (req, res) => {
    try{
        console.log(req.body)
        const response = await client
            .verify
            .services(process.env.TWILIO_SERVICE_SID)
            .verificationChecks
            .create({
                to: req.body.phone,
                code: req.body.code
            })
        console.log(response)
        if(response.valid === false){
            return res.status(401).send()
        }else if(response.valid){
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            con.query(`UPDATE users SET password = '${hashedPassword}' WHERE phone = '${req.body.phone}'`, function(err){
                if(err){return res.status(500).send()}
                con.query(`SELECT email FROM users WHERE phone = '${req.body.phone}'`, function(err, rows){
                    if(err){return res.status(500).send()}
                    console.log(rows)
                    res.status(201).json({email: rows[0].email})
                })
            })
        }
    }catch(err){
        console.log(err)
        return res.status(500).send()
    }
})

module.exports = routes;