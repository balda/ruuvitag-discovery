'use strict'

const mqtt = require(':lib/mqtt')
const measures = require(':dict/measures')
const measuresIndex = {}
for (const measure of measures) {
    measuresIndex[`${measure.field}`] = measure
}

const broadcasterFactory = (target) => {

    const broadcaster = {}

    broadcaster.stoping = false

    const present = (tag, off) => {
        // console.log(tag)
        const device = {
            ids: `ruuvitag-${tag.id}`,
            mf: `Ruuvi Innovations Ltd`,
            mdl: `RuuviTag`,
            name: `${tag.name}`,
            // sw: `${data.dataFormat}`,
        }
        // console.log(device)
        for (const availableMeasure of measures) {
            let presented = ``
            const topic = `${target.topic}/sensor/${tag.id}/${availableMeasure.field}`
            if (tag.measures[availableMeasure.field] !== undefined) {
                const measure = tag.measures[availableMeasure.field]
                const attributes = {
                    RuuviTag: tag.id,
                    Measure: measure.label,
                }
                // console.log(attributes)
                broadcaster.mqtt.publish(`${topic}/attributes`, JSON.stringify(attributes), {
                    // retain: true,
                })

                if (!off) {
                    const entry = {
                        stat_t: `${topic}/state`,
                        json_attr_t: `${topic}/attributes`,
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
                    presented = JSON.stringify(entry)
                }
                broadcaster.mqtt.publish(`${topic}/attributes`, JSON.stringify(attributes))
            } else {
                broadcaster.mqtt.publish(`${topic}/attributes`, ``)
            }
            // console.log(`present ${topic}/config`)
            // console.log(`${presented}`)
            broadcaster.mqtt.publish(`${topic}/config`, `${presented}`)
            // broadcaster.mqtt.publish(`${topic}/config`, `${presented}`, {
            //     // retain: true,
            // })
        }
    }

    const unpresent = (tag) => {
        present(tag, true)
    }

    mqtt.reset(broadcaster)

    broadcaster.start = (send) => {
        broadcaster.stoping = false
        mqtt.start(broadcaster, target)
        if (!send) {
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

    broadcaster.send = (data) => {
        if (broadcaster.stoping) {
            return
        }
        broadcaster.start(true)
        for (const measure of data.measures) {
            const topic = `${target.topic}/sensor/${data.id}/${measure.measure}/state`
            console.log(`send ${topic} ${measure.value}`)
            broadcaster.mqtt.publish(`${topic}`, `${measure.value}`)
        }
        // console.log(data)
    }

    return broadcaster
}

module.exports = broadcasterFactory
