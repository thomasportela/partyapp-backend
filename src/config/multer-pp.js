const crypto = require('crypto');
const aws = require('aws-sdk')
const multerS3 = require('multer-s3');

const storageS3 = multerS3({
    s3: new aws.S3(),
    bucket: 'party-app-profile-pictures',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: (req, file, cb) => {
        crypto.randomBytes(16, (err, hash) => {
            if(err) cb(err);
            const key = `${hash.toString("hex")}${req.uid}.${file.mimetype.split('/')[1]}`
            cb(null, key);
        })
    }
});

module.exports = {
    storage: storageS3,
    limits: {
        fileSize: 3 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/pjpeg',
            'image/png',
            'image/jpg',
        ]
        if(allowedMimes.includes(file.mimetype)) {
            cb(null, true)
        }else{
            cb(new Error('Invalide file type'))
        }
    }
}