'use strict'

const Influx = require('influx')

const broadcasterFactory = (target) => {
    // console.log({target})

    const broadcaster = {}

    broadcaster.start = () => {
        const config = {
            database: target.database,
        }
        if (target.host && target.host !== ``) {
            config.host = target.host
        }
        if (target.port && target.port !== ``) {
            config.port = target.port
        }
        if (target.username && target.username !== ``) {
            config.username = target.username
        }
        if (target.password && target.password !== ``) {
            config.password = target.password
        }
        // console.log(config)
        broadcaster.influx = new Influx.InfluxDB(config)
    }
    broadcaster.stop = async () => {
        if (broadcaster.influx) {
            try {
                delete broadcaster.influx
            } catch(error) {
                console.log(`InfluxDB stop error`)
                console.log(error)
            }
        }
    }
    broadcaster.send = (data) => {
        // console.log(data)
        broadcaster.start()
        const points = []
        if (target.measurement === `tag` || target.measurement === `both`) {
            const point = {
                measurement: `${data.field}`,
                tags: {
                    id: `${data.id}`,
                    // ruuvitag: `${data.name}`,
                },
                fields: {},
            }
            for (const measure of data.measures) {
                point.fields[measure.field] = measure.value
            }
            points.push(point)
        }
        if (target.measurement === `measure` || target.measurement === `both`) {
            for (const measure of data.measures) {
                const point = {
                    measurement: `${measure.field}`,
                    tags: {
                        id: `${data.id}`,
                        // ruuvitag: `${data.name}`,
                        // tag: `${data.field}`,
                        // measure: `${measure.label}`,
                    },
                    fields: {
                        value: measure.value,
                    },
                }
                points.push(point)
            }
        }
        // console.log(points)
        if (points.length && broadcaster.influx) {
            broadcaster.influx.writePoints(points).then(() => {
                // console.log(`OK`)
            }).catch(error => {
                console.log(`InfluxDB write error`)
                console.log(error)
            })
        }
    }

    return broadcaster
}

module.exports = broadcasterFactory
