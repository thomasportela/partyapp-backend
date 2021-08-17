const routes = require('express').Router();
const con = require('../config/database');
const auth = require('../authentication');
const multer = require('multer')
const multerPPConfig = require('../config/multer-pp')
const multerPBConfig = require('../config/multer-pb')
const aws = require('aws-sdk')

const s3 = new aws.S3();

routes.post('/upload-profile-picture', auth.token, multer(multerPPConfig).single('file'), function(req, res){
    con.query(`SELECT _key FROM profile_pictures WHERE uid = '${req.uid}'`, function(err, rows){
        if(err){
            console.log(err)
            return res.status(500).send()
        }
        if(rows.length === 0){
            con.query(`INSERT INTO profile_pictures values (default, '${req.uid}', '${req.file.key}', '${req.file.size}', '${req.file.location}', default)`, function(err){
                if(err){return res.status(500).send()}
                else{return res.status(201).send()}
            })
        }else{
            console.log(rows[0]._key)
            s3.deleteObject({
                Bucket: 'party-app-profile-pictures',
                Key: rows[0]._key
            }, function(err, data){
                if(err){console.log(err)}
            })
            con.query(`
                UPDATE profile_pictures SET url = '${req.file.location}', size = '${req.file.size}',
                _key = '${req.file.key}', create_date = default
                WHERE uid = '${req.uid}'
            `, function(err){
                if(err){
                    return res.status(500).send()
                }
                else{return res.status(201).send()}
            })
        }
    })
})

routes.post('/upload-party-banner', auth.token, multer(multerPBConfig).single('file'), function(req, res){
    console.log(req.body.pid)
    con.query(`
        SELECT pb._key FROM parties as p
        LEFT JOIN party_banners as pb ON pb.pid = p.pid 
        WHERE p.pid = ${req.body.pid} AND p.creator_uid = ${req.uid};
    `, function(err, rows){
        console.log(rows)
        if(err){return res.status(500).send()}
        if(rows.length === 0){
            return res.status(400).send()
        }else if(rows.length === 1){
            if(rows[0]._key === null){
                con.query(`INSERT INTO party_banners values (default, '${req.body.pid}', '${req.file.key}', '${req.file.size}', '${req.file.location}', default)`, function(err){
                    if(err){return res.status(500).send()}
                    return res.status(201).send()
                })
            }else{
                s3.deleteObject({
                    Bucket: 'party-app-party-banners',
                    Key: rows[0]._key
                }, function(err, data){
                    if(err){console.log(err)}
                })
                con.query(`
                    UPDATE party_banners SET url = '${req.file.location}', size = '${req.file.size}',
                    _key = '${req.file.key}', create_date = default
                    WHERE pid = '${req.body.pid}'
                `, function(err){
                if(err){
                    return res.status(500).send()
                }
                else{return res.status(201).send()}
            })
            }
        }
    })
})

module.exports = routes;