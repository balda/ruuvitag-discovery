'use strict'

const mqtt = require('mqtt')

const broadcasterFactory = (target) => {

    const broadcaster = {
        connected: false,
        connecting: false,
    }

    const reset = () => {
        broadcaster.connected = false
        broadcaster.connecting = false
    }

    broadcaster.start = () => {
        if (!broadcaster.connected) {
            if (broadcaster.connecting) {
                return
            }
            broadcaster.connecting = true
            const broker = {
                servers: [{
                    // protocop: target.protocol,
                    host: target.host,
                    port: target.port
                }],
            }
            if (target.username && target.username !== ``) {
                broker.username = target.username
            }
            if (target.password && target.password !== ``) {
                broker.password = target.password
            }
            broadcaster.mqtt = mqtt.connect(broker)
            broadcaster.mqtt.on('connect', () => {
                broadcaster.connected = true
                broadcaster.connecting = false
                console.log(`Connected to MQTT "${target.name}"`)
            })
        }
    }

    broadcaster.stop = async () => {
        return new Promise((resolve, reject) => {
            // console.log(`Close mqtt connection...`)
            if (broadcaster.mqtt !== undefined) {
                reset()
                resolve()
                return
            }
            if (!broadcaster.connected && !broadcaster.connecting) {
                reset()
                resolve()
                return
            }
            broadcaster.mqtt.end(err => {
                if (err) {
                    console.log(err)
                    reject(err)
                } else {
                    console.log(`MQTT "${target.name}" disconnected`)
                    resolve()
                }
                reset()
            })
        })
    }

    broadcaster.send = (data) => {
        broadcaster.start()
        let topic = `${target.topic}/${data.field}`
        // TODO: add `postfix`
        // TODO: add `middlefix`
        if (target.measurement === `tag` || target.measurement === `both`) {
            broadcaster.mqtt.publish(`${topic}`, JSON.stringify(data))
        }
        if (target.measurement === `measure` || target.measurement === `both`) {
            for (const measure of data.measures) {
                broadcaster.mqtt.publish(`${topic}/${measure.field}`, `${measure.value}`)
            }
        }
    }

    return broadcaster
}

module.exports = broadcasterFactory
