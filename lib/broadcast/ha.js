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
        tag.measures = measures.update(tag.measures)
        for (const measure of tag.measures) {
            const measureConfig = measures.find(measure.measure)
            const entity_id = `sensor.ruuvitag_${tag.id}_${measureConfig ? measureConfig.field : measure.field}`
            const data = {
                state: measure.value,
                attributes: {
                    friendly_name: `${measure.label}`,
                    unit_of_measurement: measureConfig && measureConfig.unit ? `${measureConfig.unit}` : ``,
                    device_class: measureConfig && measureConfig.type ? `${measureConfig.type}` : undefined,
                    icon: measureConfig && measureConfig.icon ? `mdi:${measureConfig.icon}` : undefined,
                    RuuviTag: tag.name,
                    RuuviTag_ID: tag.id,
                    Measure: measureConfig ? measureConfig.label : measure.label,
                    Unit: measureConfig && measureConfig.unit ? measureConfig.unit : undefined,
                },
            }
            hassio.state.set(entity_id, data)
            log.debug(`${logPrefix} Set entity "${entity_id}" state "${measure.value}" with attributes: ${JSON.stringify(data.attributes)}`)
        }
    }

    return broadcaster
}

module.exports = broadcasterFactory
