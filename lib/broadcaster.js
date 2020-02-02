'use strict'

const targets = {}
targets.mqtt = require(':lib/broadcast/mqtt')
targets.graphite = require(':lib/broadcast/graphite')
targets.influxdb = require(':lib/broadcast/influxdb')
targets.webhook = require(':lib/broadcast/webhook')
targets.ha_mqtt = require(':lib/broadcast/ha_mqtt')

const broadcasters = {}

const factory = (target) => {
    if (broadcasters[`${target.id}`] === undefined) {
        broadcasters[`${target.id}`] = targets[target.type](target)
    }
    return broadcasters[`${target.id}`]
}

factory.reset = async (target) => {
    if (broadcasters[`${target.id}`] !== undefined) {
        // console.log(`reset target`)
        await broadcasters[`${target.id}`].stop()
        delete broadcasters[`${target.id}`]
        return true
    }
    // console.log(`no target to reset`)
    return false
}

module.exports = factory
