'use strict'

const log = require(`:lib/log`)
const logPrefix = `[HA API]`
const measures = require(`:lib/measures`)
const hassio = require(`:lib/hassio`)

const broadcasterFactory = (target) => {

    const broadcaster = {}

    broadcaster.start = (server) => {
        if (server) {
            broadcaster.server = server
        }
    }

    broadcaster.stop = async () => {}

    broadcaster.send = (tag) => {
        for (const measure of tag.measures) {
            const measureConfig = measures.find(measure.measure)
            const entity_id = `sensor.ruuvitag_${tag.id}_${measureConfig.field}`
            let state = measure.value
            if (measureConfig) {
                try {
                    state = state.toFixed(measureConfig.accuracy)
                } catch(error) {}
            }
            const data = {
                state,
                attributes: {
                    friendly_name: `${measure.label}`,
                    unit_of_measurement: measureConfig && measureConfig.unit ? `${measureConfig.unit}` : ``,
                    device_class: measureConfig && measureConfig.type ? `${measureConfig.type}` : undefined,
                    icon: measureConfig && measureConfig.icon ? `mdi:${measureConfig.icon}` : undefined,
                },
            }
            hassio.state.set(entity_id, data)
            log.debug(`${logPrefix} Set entity "${entity_id}" state "${state}" with attributes: ${JSON.stringify(data.attributes)}`)
        }
    }

    return broadcaster
}

module.exports = broadcasterFactory
