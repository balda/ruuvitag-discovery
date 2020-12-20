'use strict'

const log = require(`:lib/log`)
const logPrefix = `[HA MQTT]`
const mqtt = require(':lib/mqtt')
const presentInterval = require(`#ha_mqtt.present`)
const measures = require(':lib/measures')

const broadcasterFactory = (target) => {

    const broadcaster = {}

    broadcaster.stoping = false
    broadcaster.presented = {}

    const topic = (tag, measure) => {
        return `${target.topic}/sensor/${tag.id}/${measure}`
    }

    const cleanup = (prefix) => {
        log.debug(`${logPrefix} Unpresent device measure ${prefix}`)
        broadcaster.mqtt.publish(`${prefix}/state`, ``)
        broadcaster.mqtt.publish(`${prefix}/attributes`, ``)
        broadcaster.mqtt.publish(`${prefix}/config`, ``)
    }

    const present = (tag) => {
        if (!tag || !tag.id) {
            return
        }
        const device = {
            ids: `ruuvitag-${tag.id}`,
            mf: `Ruuvi Innovations Ltd`,
            mdl: `RuuviTag`,
            name: `${tag.name}`,
            // sw: `${data.dataFormat}`,
        }
        // console.log(device)
        log.debug(`${logPrefix} Search device measures to present for tag ${JSON.stringify(tag)}`)
        for (const availableMeasure of measures.all()) {
            const prefix = topic(tag, availableMeasure.field)
            if (tag.measures[availableMeasure.field] !== undefined) {
                const measure = tag.measures[availableMeasure.field]
                // const attributes = {
                //     RuuviTag: tag.id,
                //     Measure: measure.label,
                // }
                const entry = {
                    stat_t: `${prefix}/state`,
                    json_attr_t: `${prefix}/attributes`,
                    name: `${tag.name} ${measure.label}`,
                    unit_of_meas: availableMeasure.unit ? `${availableMeasure.unit}` : ``,
                    dev_cla: availableMeasure.type ? `${availableMeasure.type}` : undefined,
                    // expire_after: 1 * target.interval === 0 ? 60 : 2 * target.interval,
                    uniq_id: `ruuvitag_${tag.id}_${availableMeasure.field}`,
                    icon: availableMeasure.icon ? `mdi:${availableMeasure.icon}` : undefined,
                    // battery_level: Math.round(data.battery * 100 / 3200),
                    device,
                }
                broadcaster.mqtt.publish(`${prefix}/config`, JSON.stringify(entry))
                log.debug(`${logPrefix} Present device measure: ${JSON.stringify(entry)}`)
                // broadcaster.mqtt.publish(`${prefix}/attributes`, JSON.stringify(attributes))
            } else {
                cleanup(prefix)
            }
        }
    }

    const unpresent = (tag) => {
        for (const availableMeasure of measures.all()) {
            const prefix = topic(tag, availableMeasure.field)
            cleanup(prefix)
        }
    }

    mqtt.reset(broadcaster)

    broadcaster.start = (server) => {
        broadcaster.stoping = false
        const state = mqtt.start(broadcaster, target, server)
        if (state === `connect`) {
            for (const tag in target.tags) {
                present(target.tags[tag])
            }
        }
    }

    broadcaster.stop = async () => {
        broadcaster.stoping = true
        if (broadcaster.mqtt) {
            for (const tag in target.tags) {
                unpresent(target.tags[tag])
            }
        }
        await mqtt.stop(broadcaster, target)
        broadcaster.stoping = false
        return
    }

    broadcaster.send = (tag) => {
        if (broadcaster.stoping) {
            return
        }
        broadcaster.start()
        if (broadcaster.presented[tag.id] === undefined) {
            broadcaster.presented[tag.id] = Date.now() - presentInterval
        }
        if (Date.now() - broadcaster.presented[tag.id] >= presentInterval) {
            broadcaster.presented[tag.id] = Date.now()
            present(target.tags[tag.id])
        }
        for (const measure of tag.measures) {
            const prefix = topic(tag, measure.measure)
            const measureValue = measures.find(measure.field)
            let value = measure.value
            if (measureValue) {
                try {
                    value = measure.value.toFixed(measureValue.accuracy)
                } catch(error) {}
            }
            broadcaster.mqtt.publish(`${prefix}/state`, `${value}`)
            log.debug(`${logPrefix} Publish on topic "${prefix}/state" message: ${value}`)
            const attributes = {
                RuuviTag: tag.id,
                Measure: measure.label,
            }
            const measureUnit = measures.find(measure.measure)
            if (measureUnit) {
                attributes.Unit = measureUnit.unit
            }
            broadcaster.mqtt.publish(`${prefix}/attributes`, JSON.stringify(attributes))
            log.debug(`${logPrefix} Publish on topic "${prefix}/attributes" message: ${JSON.stringify(attributes)}`)
        }
        // console.log(tag)
    }

    return broadcaster
}

module.exports = broadcasterFactory
