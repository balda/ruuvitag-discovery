'use strict'

const log = require(`:lib/log`)
const logPrefix = `[MQTT]`
const mqtt = require(':lib/mqtt')
const measures = require(':lib/measures')

const broadcasterFactory = (target) => {

    const broadcaster = {}

    mqtt.reset(broadcaster)

    broadcaster.start = (server) => {
        mqtt.start(broadcaster, target, server)
    }

    broadcaster.stop = async () => {
        return await mqtt.stop(broadcaster, target)
    }

    broadcaster.send = (data) => {
        broadcaster.start()
        let topic = `${target.topic}/${data.field}`
        // TODO: add `postfix`
        // TODO: add `middlefix`
        data.measures = measures.update(data.measures)
        if (target.measurement === `tag` || target.measurement === `both`) {
            // TODO: remove data.measures[].measure
            broadcaster.mqtt.publish(`${topic}`, JSON.stringify(data))
            log.debug(`${logPrefix} Publish on topic "${topic}" message: ${JSON.stringify(data)}`)
        }
        if (target.measurement === `measure` || target.measurement === `both`) {
            for (const measure of data.measures) {
                broadcaster.mqtt.publish(`${topic}/${measure.field}`, `${measure.value}`)
                log.debug(`${logPrefix} Publish on topic "${topic}/${measure.field}" message: ${measure.value}`)
            }
        }
    }

    return broadcaster
}

module.exports = broadcasterFactory
