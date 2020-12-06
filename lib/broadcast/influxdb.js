'use strict'

const Influx = require('influx')

const broadcasterFactory = (target) => {
    // console.log({target})

    const broadcaster = {}

    broadcaster.start = (server) => {
        if (server) {
            broadcaster.server = server
        }
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
        try {
            broadcaster.influx = new Influx.InfluxDB(config)
        } catch(error) {
            if (broadcaster.server) {
                broadcaster.server.error({
                    error: error.message,
                    target,
                })
            }
        }
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
            try {
                broadcaster.influx.writePoints(points)
            } catch(error) {
                if (broadcaster.server) {
                    broadcaster.server.error({
                        error: error.message,
                        target,
                    })
                    broadcaster.stop()
                }
            }
        }
    }

    return broadcaster
}

module.exports = broadcasterFactory
