const routes = require('express').Router();
const con = require('../config/database');
const auth = require('../authentication');

// const nowDate = new Date()
var nowDate = new Date(2021,02,04);

const fieldsNames = [["name", "name"], ["lotes", "lotes"], ["price1", "price_1"], ["price2", "price_2"], ["price3", "price_3"], ["price4", "price_4"], ["tickets_number1", "tickets_number_1"], ["tickets_number2", "tickets_number_2"], ["tickets_number3", "tickets_number_3"], ["tickets_number4", "tickets_number_4"], ["about", "about"], ["start_time", "start_time"], ["date", "start_time"], ["end_time", "end_time"], ["lat", "latitude"], ["lng", "longitude"], ["changeLoteByDate", "end_sales_by_time"], ["obs1", "obs1"], ["obs2", "obs2"], ["obs3", "obs3"], ["change_lote_time1", "end_sales_date_1"], ["change_lote_time2", "end_sales_date_2"], ["change_lote_time3", "end_sales_date_3"], ["change_lote_date1", "end_sales_date_1"], ["change_lote_date2", "end_sales_date_2"], ["change_lote_date3", "end_sales_date_3"]];

var fieldsMap = new Map(fieldsNames);

function getDatetime(date, time) {
    return date !== null && time !== null ? `\'${nowDate.getFullYear()}-${date.split('/')[1]}-${date.split('/')[0]} ${time}\'` : null;
}
function getString(string) {
    return string !== null && string !== '' ? `\'${string}\'` : null;
}

function getNumber(number) {
    return number !== null ? Number(number.replace(',','.')) : null;
}

function getDateWithYear(datetime) {
    return datetime !== null ? `${datetime.getDate() < 10 ? '0' + datetime.getDate() : datetime.getDate()}/${datetime.getMonth() < 9 ? '0' + (datetime.getMonth()+1) : datetime.getMonth()+1}/${datetime.getFullYear()}` : null;
}

function getDate(datetime) {
    return datetime !== null ? `${datetime.getDate() < 10 ? '0' + datetime.getDate() : datetime.getDate()}/${datetime.getMonth() < 9 ? '0' + (datetime.getMonth()+1) : datetime.getMonth()+1}` : null;
}

function getTime(datetime) {
    return datetime !== null ? `${datetime.toTimeString().slice(0, 5)}` : null;
}

routes.get('/parties', auth.token, function(req, res){
    con.query('SELECT p.*, pb.url FROM parties AS p LEFT JOIN party_banners AS pb ON pb.pid = p.pid', function(err, rows){
        if(err){return res.status(500).send(err)}
        else{
            const parties = [];
            for(var i = 0; i < rows.length; i++){
              let actualPrice = rows[i].price1
              if(rows[i].end_sales_by_time == false){
                if(rows[i].tickets_sold_1 < rows[i].tickets_number_1){
                  actualPrice = rows[i].price_1
                }else if(rows[i].tickets_sold_2 < rows[i].tickets_number_2 && rows[i].tickets_number_2 !== null && rows[i].lotes > 1){
                  actualPrice = rows[i].price_2
                }else if(rows[i].tickets_sold_3 < rows[i].tickets_number_3 && rows[i].tickets_number_3 !== null && rows[i].lotes > 2){
                  actualPrice = rows[i].price_3
                }else if(rows[i].tickets_sold_4 < rows[i].tickets_number_4 && rows[i].tickets_number_4 !== null && rows[i].lotes > 3){
                  actualPrice = rows[i].price_4
                }else{
                  actualPrice = 0
                }
              }else if(rows[i].end_sales_by_time == true){
                console.log(rows[i].end_sales_date_1)
                console.log(nowDate)
                console.log(rows[i].end_sales_date_1 > nowDate)
                if(rows[i].tickets_sold_1 < rows[i].tickets_number_1 && rows[i].end_sales_date_1 > nowDate){
                  actualPrice = rows[i].price_1
                }else if(rows[i].tickets_sold_2 < rows[i].tickets_number_2 && rows[i].tickets_number_2 !== null && rows[i].lotes > 1 && rows[i].end_sales_date_2 > nowDate){
                  actualPrice = rows[i].price_2
                }else if(rows[i].tickets_sold_3 < rows[i].tickets_number_3 && rows[i].tickets_number_3 !== null && rows[i].lotes > 2 && rows[i].end_sales_date_3 > nowDate){
                  actualPrice = rows[i].price_3
                }else if(rows[i].tickets_sold_4 < rows[i].tickets_number_4 && rows[i].tickets_number_4 !== null && rows[i].lotes > 3){
                  actualPrice = rows[i].price_4
                }else{
                  actualPrice = 0
                }
              }
              const party = {
                pid: rows[i].pid,
                name: rows[i].name,
                creator_uid: rows[i].creator_uid,
                price: actualPrice,
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

routes.post('/user-parties', auth.token, function(req, res){
    if(req.body.uid === req.uid){
        con.query(`SELECT p.*, pb.url FROM parties AS p LEFT JOIN party_banners AS pb ON pb.pid = p.pid WHERE creator_uid = '${req.uid}'`, function(err, rows){
            if(err){return res.status(500).send()}
            const parties = [];
            if(rows.length !== 0){
                for(var i = 0; i < rows.length; i++){
                    const party = {
                        pid: rows[i].pid,
                        name: rows[i].name,
                        lotes: rows[i].lotes,
                        money_made: rows[i].money_made,
                        creator_uid: rows[i].creator_uid,
                        date: getDate(rows[i].start_time),
                        start_time: getTime(rows[i].start_time),
                        end_time: getTime(rows[i].end_time),
                        price1: rows[i].price_1,
                        price2: rows[i].price_2,
                        price3: rows[i].price_3,
                        price4: rows[i].price_4,
                        tickets_number1: rows[i].tickets_number_1,
                        tickets_number2: rows[i].tickets_number_2,
                        tickets_number3: rows[i].tickets_number_3,
                        tickets_number4: rows[i].tickets_number_4,
                        tickets_sold1: rows[i].tickets_sold_1,
                        tickets_sold2: rows[i].tickets_sold_2,
                        tickets_sold3: rows[i].tickets_sold_3,
                        tickets_sold4: rows[i].tickets_sold_4,
                        changeLoteByDate: rows[i].end_sales_by_time,
                        change_lote_date1: rows[i].end_sales_by_time ? getDate(rows[i].end_sales_date_1) : null,
                        change_lote_date2: rows[i].end_sales_by_time ? getDate(rows[i].end_sales_date_2) : null,
                        change_lote_date3: rows[i].end_sales_by_time ? getDate(rows[i].end_sales_date_3) : null,
                        change_lote_time1: rows[i].end_sales_by_time ? getTime(rows[i].end_sales_date_1) : null,
                        change_lote_time2: rows[i].end_sales_by_time ? getTime(rows[i].end_sales_date_2) : null,
                        change_lote_time3: rows[i].end_sales_by_time ? getTime(rows[i].end_sales_date_3) : null,
                        latitude: rows[i].latitude,
                        longitude: rows[i].longitude,
                        obs1: rows[i].obs1,
                        obs2: rows[i].obs2,
                        obs3: rows[i].obs3,
                        url: rows[i].url,
                        about: rows[i].about,
                    }
                    parties.push(party)
                }
            }
            return res.status(200).json({parties: parties})
        })
    }else{
      con.query(`SELECT p.*, pb.url FROM parties AS p LEFT JOIN party_banners AS pb ON pb.pid = p.pid WHERE creator_uid = '${req.body.uid}'`, function(err, rows){
        if(err){return res.status(500).send(err)}
        else{
          const parties = [];
          for(var i = 0; i < rows.length; i++){
            let actualPrice = rows[i].price1
            if(rows[i].end_sales_by_time === false){
              if(rows[i].tickets_sold_1 < rows[i].tickets_number_1){
                actualPrice = rows[i].price_1
              }else if(rows[i].tickets_sold_2 < rows[i].tickets_number_2 && rows[i].tickets_number_2 !== null & rows[i].lotes > 1){
                actualPrice = rows[i].price_2
              }else if(rows[i].tickets_sold_3 < rows[i].tickets_number_3 && rows[i].tickets_number_3 !== null & rows[i].lotes > 2){
                actualPrice = rows[i].price_3
              }else if(rows[i].tickets_sold_4 < rows[i].tickets_number_4 && rows[i].tickets_number_4 !== null & rows[i].lotes > 3){
                actualPrice = rows[i].price_4
              }else{
                actualPrice = 0
              }
            }else{
              actualPrice = rows[i].price_1
            }
            const party = {
              pid: rows[i].pid,
              name: rows[i].name,
              creator_uid: rows[i].creator_uid,
              price: actualPrice,
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
    }
})

routes.post('/organizers', auth.token, function(req, res){
    con.query(`
        SELECT o.uid, u.name, pp.url FROM users AS u
        JOIN organizers AS o
        ON o.uid = u.uid
        LEFT JOIN profile_pictures AS pp
        ON u.uid = pp.uid
        WHERE o.pid = '${req.body.pid}'
        `, function(err, rows){
            if(err){res.status(400).send(err)}
            else{
                return res.status(200).json({organizers: rows})
            }
        })
})

routes.post('/create-party', auth.token, function(req, res){
    const party = req.body.party
    console.log(party)
    console.log(Number(party.lat))

    if(typeof(party.name) === 'string' && typeof(party.date) === 'string' && typeof(party.start_time) === 'string' && typeof(party.end_time) === 'string' && (typeof(party.about) === 'string' || party.about === null) && typeof(party.price1) === 'string' && (typeof(party.price2) === 'string' || party.price2 === null) && (typeof(party.price3) === 'string' || party.price3 === null) && (typeof(party.price4) === 'string' || party.price4 === null) && typeof(party.tickets_number1) === 'string' && (typeof(party.tickets_number2) === 'string' || party.tickets_number2 === null) && (typeof(party.tickets_number3) === 'string' || party.tickets_number3 === null) && (typeof(party.tickets_number4) === 'string' || party.tickets_number4 === null) && (typeof(party.change_lote_date1) === 'string' || party.change_lote_date1 === null) && (typeof(party.change_lote_date2) === 'string' || party.change_lote_date2 === null) && (typeof(party.change_lote_date3) === 'string' || party.change_lote_date3 === null) && (typeof(party.change_lote_time1) === 'string' || party.change_lote_time1 === null) && (typeof(party.change_lote_time2) === 'string' || party.change_lote_time2 === null) && (typeof(party.change_lote_time3) === 'string' || party.change_lote_time3 === null) && typeof(party.lotes) === 'number' && (typeof(party.obs1) === 'string' || party.obs1 === null) && (typeof(party.obs2) === 'string' || party.obs2 === null) && (typeof(party.obs3) === 'string' || party.obs3 === null) && typeof(party.changeLoteByDate) === 'boolean' && typeof(party.lat) === 'number' && typeof(party.lng) === 'number'){
        con.query(`INSERT INTO parties VALUES (
            default,
            ${req.uid},
            default,
            '${party.name}',
            ${party.lotes},
            default,
            ${getNumber(party.price1)},
            ${getNumber(party.tickets_number1)},
            default,
            ${party.changeLoteByDate ? getDatetime(party.change_lote_date1, party.change_lote_time1) : null},
            ${party.changeLoteByDate},
            ${getDatetime(party.date, party.start_time)},
            ${getDatetime(party.date, party.end_time)},
            ${party.lat},
            ${party.lng},
            ${getString(party.about)},
            ${getString(party.obs1)},
            ${getString(party.obs2)},
            ${getString(party.obs3)},
            ${getNumber(party.price2)},
            ${getNumber(party.price3)},
            ${getNumber(party.price4)},
            ${getNumber(party.tickets_number2)},
            default,
            ${getNumber(party.tickets_number3)},
            default,
            ${getNumber(party.tickets_number4)},
            default,
            ${party.changeLoteByDate ? getDatetime(party.change_lote_date2, party.change_lote_time2) : null},
            ${party.changeLoteByDate ? getDatetime(party.change_lote_date3, party.change_lote_time3) : null}
        )`, function(err, result) {
            if(err) {return res.status(500).send()}
            return res.status(200).json({pid: result.insertId})
        })
    }else{
        console.log('se fodeu otario')
        return res.status(400).send()
    }
})

routes.post('/insert-organizers', auth.token, auth.owner, function(req, res) {
    const organizers = req.body.organizers;
    con.query(`DELETE FROM organizers WHERE pid = '${req.body.pid}';`, function(err){
      if(err){return res.status(500).send()}
      if(organizers.length !== 0){
        let query = `INSERT INTO organizers VALUES`;
        for(var i = 0; i < organizers.length; i++){
            if(i === (organizers.length - 1)){
                query += ` (default, '${organizers[i]}', '${req.body.pid}')`
            }else{
                query += ` (default, '${organizers[i]}', '${req.body.pid}'),`
            }
        }
        console.log(query)
        con.query(query, function(err){
          if(err){
            console.log(err)
            return res.status(500).send()
          }
          return res.status(201).send()
        })
      }else{
        res.status(201).send()
      }
    })
})

routes.post('/update-party', auth.token, auth.owner, function(req, res){
    console.log(req.body)
    body = req.body.changes;
    console.log(body)
    var query = 'UPDATE parties SET'
    for(var key in body){
        if(key === 'start_time' || key === 'end_time' || key === 'change_lote_time1' || key === 'change_lote_time2' || key === 'change_lote_time3'){
            query += ` ${fieldsMap.get(key)} = concat(date(${fieldsMap.get(key)}), ' ${body[key]}'),`
        }else if(key === 'date' || key === 'change_lote_date1' || key === 'change_lote_date2' || key === 'change_lote_date3'){
            query += ` ${fieldsMap.get(key)} = concat('${nowDate.getFullYear()}-${body[key].split('/')[1]}-${body[key].split('/')[0]} ', time(${fieldsMap.get(key)})),`
        }else if(key === 'name' || key === 'obs1' || key === 'obs2' || key === 'obs3' || key === 'about'){
            query += ` ${fieldsMap.get(key)} = ${getString(body[key])},`
        }else if(key === 'price1' || key === 'price2' || key === 'price3' || key === 'price4' || key === 'tickets_number1' || key === 'tickets_number2' || key === 'tickets_number3' || key === 'tickets_number4'){
            query += ` ${fieldsMap.get(key)} = ${getNumber(body[key])},`
        }else{
            query += ` ${fieldsMap.get(key)} = ${body[key]},`
        }
    }
    query = query.slice(0, -1)
    query += ` WHERE pid = '${req.body.pid}'`
    console.log(query)
    con.query(query, function(err){
        if(err){
            console.log(err)
            return res.status(500).send()
        }
        return res.status(201).send()
    })

})

routes.post('/get-buyers', auth.token, auth.owner, (req, res) => {
  con.query(`
    SELECT pur.uid, u.name, pp.url, u.cpf FROM purchases as pur
    JOIN users as u
    ON pur.uid = u.uid
    LEFT JOIN profile_pictures as pp
    ON pur.uid = pp.uid
    WHERE pur.pid = '${req.body.pid}' AND pur.inside = ${req.body.inside};
  `, function(err, rows){
    if(err){return res.status(500).send()}
    return res.status(200).json({people: rows})
  })
})

module.exports = routes;