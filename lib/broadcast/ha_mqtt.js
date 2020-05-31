'use strict'

const mqtt = require(':lib/mqtt')
const presentInterval = require(`#ha_mqtt.present`)
const measures = require(':dict/measures')
const measuresIndex = {}
for (const measure of measures) {
    measuresIndex[`${measure.field}`] = measure
}

const broadcasterFactory = (target) => {

    const broadcaster = {}

    broadcaster.stoping = false
    broadcaster.presented = Date.now()

    const topic = (tag, measure) => {
        return `${target.topic}/sensor/${tag.id}/${measure}`
    }

    const cleanup = (prefix) => {
        broadcaster.mqtt.publish(`${prefix}/state`, ``)
        broadcaster.mqtt.publish(`${prefix}/attributes`, ``)
        broadcaster.mqtt.publish(`${prefix}/config`, ``)
    }

    const present = (tag) => {
        if (!tag) {
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
        for (const availableMeasure of measures) {
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
                // console.log(entry)
                broadcaster.mqtt.publish(`${prefix}/config`, JSON.stringify(entry))
                // broadcaster.mqtt.publish(`${prefix}/attributes`, JSON.stringify(attributes))
            } else {
                cleanup(prefix)
            }
        }
    }

    const unpresent = (tag) => {
        for (const availableMeasure of measures) {
            const prefix = topic(tag, availableMeasure.field)
            cleanup(prefix)
        }
    }

    mqtt.reset(broadcaster)

    broadcaster.start = () => {
        broadcaster.stoping = false
        const state = mqtt.start(broadcaster, target)
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
        if (Date.now() - broadcaster.presented > presentInterval) {
            broadcaster.presented = Date.now()
            present(target.tags[tag.id])
        }
        for (const measure of tag.measures) {
            const prefix = topic(tag, measure.measure)
            // console.log(`send ${prefix}/state ${measure.value}`)
            broadcaster.mqtt.publish(`${prefix}/state`, `${measure.value.toFixed(measuresIndex[`${measure.field}`].accuracy)}`)
            const attributes = {
                RuuviTag: tag.id,
                Measure: measure.label,
            }
            if (measuresIndex[`${measure.measure}`].unit) {
                attributes.Unit = measuresIndex[`${measure.measure}`].unit
            }
            broadcaster.mqtt.publish(`${prefix}/attributes`, JSON.stringify(attributes))
        }
        // console.log(tag)
    }

    return broadcaster
}

module.exports = broadcasterFactory
