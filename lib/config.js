'use strict'

const fs = require('fs')
const path = require('path')
const logs = require(`#logs`)

let config = {}
let configFile

if (process.env.RUUVI_DISCOVERY_ENV === `homeassistant`) {
    configFile = `/data/config.json`
} else {
    try {
        fs.mkdirSync(path.join(__dirname, `..`, `data`))
    } catch(error) {}
    configFile = path.join(__dirname, `..`, `data`, `config.json`)
}

try {
    config = JSON.parse(fs.readFileSync(configFile))
} catch(error) {
    // console.log(error)
}

const validate = () => {
    if (config.sampling === undefined) {
        config.sampling = {}
    }
    if (config.sampling.history === undefined) {
        config.sampling.history = 100
    }
    if (config.sampling.interval === undefined) {
        config.sampling.interval = 10000
    }
    if (config.battery === undefined) {
        config.battery = {}
    }
    if (config.battery.min === undefined) {
        config.battery.min = 2500
    }
    if (config.battery.max === undefined) {
        config.battery.max = 3000
    }
    if (config.ruuvitags === undefined) {
        config.ruuvitags = {}
    }
    if (config.columns === undefined) {
        config.columns = {
            name: true,
            dataFormat: true,
            rssi: true,
            temperature: true,
            humidity: true,
            pressure: true,
            battery: true,
            battery_level: true,
            txPower: true,
            movementCounter: true,
            measurementSequenceNumber: true,
            samples: true,
            frequency: true,
            period: true,
            ts: true,
        }
    }
    if (config.customMeasures === undefined) {
        config.customMeasures = []
    }
    if (config.targets === undefined) {
        config.targets = []
    }
    config.targets = config.targets.map((target, index) => {
        target.id = index * 1
        target.tags = target.tags || {}
        for (const tagId in target.tags) {
            if (!target.tags[tagId].id) {
                target.tags[tagId].id = tagId
            }
            // TODO:
            // remove custom measures if columns doesnt exist anymore
            // for (const measure in measures) {
            //     //
            // }
        }
        return target
    })
    if (config.log === undefined) {
        config.log = {}
    }
    for (const level in logs) {
        if (config.log[level] === undefined) {
            config.log[level] = logs[level]
        }
    }
}
validate()

config.backup = () => {
    try {
        validate()
        fs.writeFileSync(configFile, JSON.stringify(config))
    } catch(error) {
        console.log(error)
    }
}

module.exports = config
