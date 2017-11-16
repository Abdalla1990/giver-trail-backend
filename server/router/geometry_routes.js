var { Mongoose } = require('../db/mongoose.js');
const express = require('express');
const { User } = require('../models/users');
var bodyParser = require('body-parser');
var app = express();
var _ = require('lodash');
const { ObjectID } = require('mongodb');
const { authenticate } = require('../middleware/authenticate');
const { Trails1 } = require('../models/trails.1');
const axios = require('axios');
const getElevation = require('../middleware/getElevation');
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

let getTrails = (req, res) => {
    const url = 'http://overpass-api.de/api/interpreter?data=[out:json];way["highway"="footway"](50.745,7.17,50.75,7.18);out geom;';
    const url2 = 'http://overpass-api.de/api/interpreter?data=[out:json];way["highway"="footway"](45.970,-74.25,46.040,-74.1);out geom;';
    console.log('inside get trails')


    axios.get(url2).then((data) => {

        let r = {

                element: data.data.elements.map((e, index) => {


                    return { thename: e }
                })

            }
            // console.log(r.element[3].thename.type);


        r.element.filter((e) => {
            let bodyTrail = _.pick(e.thename, ['type', 'id', 'bounds', 'tags']);
            let geometry = _.pick(e.thename, ['geometry']);
            let nodes = _.pick(e.thename, ['nodes']);

            let newData = Object.assign(bodyTrail, geometry, nodes);

            let trail1 = new Trails1(newData);
            let latln = newData.geometry.map((geo, index) => {
                // console.log({ lat: geo.lat, lng: geo.lon })
                return { lat: geo.lat, lng: geo.lon }
            });
            getElevation.geTtheElevation(latln, (data) => {

                // let theResult = data.results.map((result, index) => {
                //     console.log('result : ', index, '=', result)
                //     console.log('#################################');
                //     return result;
                // })

                // console.log('#################################the result', theResult);
                // console.log('#################################');


                trail1.id = newData.id;
                // console.log(trail1.id); // id 
                // console.log(newData.id); //
                trail1.type = newData.type;
                // console.log(trail1.type); // type 
                // console.log(newData.type); //

                // console.log('bounds data ', newData.bounds);





                trail1.bounds.minlat = newData.bounds.minlat;
                // console.log('minlat trail ', trail1.bounds.minlat); // minlat

                trail1.bounds.minlon = newData.bounds.minlon;
                // console.log('minlon trail ', trail1.bounds.minlon); //minlon

                trail1.bounds.maxlat = newData.bounds.maxlat;
                // console.log('maxlat trail ', trail1.bounds.maxlat); //maxlat

                trail1.bounds.maxlon = newData.bounds.maxlon;
                // console.log('maxlon trail ', trail1.bounds.maxlon); //maxlon


                trail1.tags = newData.tags;
                // console.log(trail1.tags); //
                // console.log(newData.tags); //

                ///========================================
                let lat = newData.geometry.map((geo) => {
                    // console.log('lat data : ', geo.lat)
                    return geo.lat;
                });
                trail1.geometry.lat = lat;

                ///========================================
                // console.log('lat trail : ', trail1.geometry.lat)
                let lon = newData.geometry.map((geo) => {
                    // console.log('lon data : ', geo.lon)
                    return geo.lon;
                });
                trail1.geometry.lon = lon;
                // console.log('lon trail : ', trail1.geometry.lon)
                trail1.nodes = newData.nodes;
                // console.log('nodes trail : ', trail1.nodes); //
                // console.log('nodes data : ', newData.nodes); //





                // console.log('the final result : ', TheFinalResult)

                //===================== elevation =======================
                // let ele = newData.geometry.map((geo, index) => {

                //     return data.results[index].elevation


                // });
                // trail1.elevation = ele
                // trail1.geometry.elevation = ele

                //======================= elevation =========================
                console.log('before save ')

                trail1.save().then((dataSaved) => {

                }).catch((err) => { res.status(400).send(err) });






            });

        });

        res.status(200).send();

    });


};



let getCenterCoordinates = (req, res) => {
    const url = 'http://overpass-api.de/api/interpreter?data=[out:json];way["highway"="footway"](50.745,7.17,50.75,7.18);out center;';
    const url2 = 'http://overpass-api.de/api/interpreter?data=[out:json];way["highway"="footway"](45.970,-74.25,46.040,-74.1);out center;';

    console.log('inside get trails')


    axios.get(url2).then((data) => {

        let r = {

            element: data.data.elements.map((e) => {


                return { thename: e }
            })

        }



        r.element.filter((e) => {
            let CenterBody = _.pick(e.thename, ['id', 'center']);




            Trails1.findOne({ id: CenterBody.id }).then((thetrail) => {
                thetrail.center = CenterBody.center;
                console.log('before save ')

                thetrail.save().then((dataSaved) => {
                    console.log(dataSaved)
                }).catch((err) => { res.status(400).send(err) });

            });









        });

    });

    res.status(200).send();

};

let sendTrails = (req, res) => {
    Trails1.find().then((trails) => {
        let theTrail = trails.map((trail, index) => {

            let data = {
                id: trail.id,
                type: trail.type,
                center: trail.center
            }
            let geometry = trail.geometry.lat.map((geo, index) => {
                let coordinates = {
                    lat: geo,
                    lng: trail.geometry.lon[index],
                    elevation: trail.geometry.elevation[index],
                }
                return { coordinates }
            })
            let Trail = {
                id: data.id,
                type: data.type,
                center: data.center,
                geometry: geometry
            }

            return { Trail }
        })

        console.log(theTrail);
        res.status(200).send(theTrail)
    });
}


let showTrails = (req, res) => {
    let allTrails = [];
    let count = 0;
    Trails1.find().then((data) => {

        res.send(data);
    });

}
let getElevationAll = (req, res) => {


    Trails1.find({}).then((trails) => {

        trails.map((trail, index) => {


            [trail.geometry.elevation] = trail.elevation[index]


        })
        return trails

    }).then((trails) => {
        trails.save().then((saved) => {
            console.log(saved);
            res.status(200).send(saved);
        }).catch((err) => {
            res.status(400).send(err)
        });
    });



}

module.exports = {
    getTrails,
    showTrails,
    getElevationAll,
    getCenterCoordinates,
    sendTrails
}