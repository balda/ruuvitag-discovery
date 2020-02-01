'use strict'

const mqtt = require(':lib/mqtt')

const broadcasterFactory = (target) => {

    const broadcaster = {}

    mqtt.reset(broadcaster)

    broadcaster.start = () => {
        mqtt.start(broadcaster, target)
    }

    broadcaster.stop = async () => {
        return await mqtt.stop(broadcaster, target)
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
