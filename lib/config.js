'use strict'

const fs = require('fs')
const path = require('path')

let config = {}
let configFile

if (process.env.RUUVI_DISCOVERY_ENV === `homeassistant`) {
    console.log(`Read Home Assistant config`)
    configFile = `/data/options.json`
} else {
    try {
        fs.mkdirSync(path.join(__dirname, `..`, `data`))
    } catch(error) {}
    console.log(`Read local config`)
    configFile = path.join(__dirname, `..`, `data`, `config.json`)
}

try {
    config = JSON.parse(fs.readFileSync(configFile))
} catch(error) {
    console.log(`Error reading config file`)
    console.log(error)
}

if (config.sampling === undefined) {
    config.sampling = {}
}
if (config.sampling.history === undefined) {
    config.sampling.history = 100
}
if (config.sampling.interval === undefined) {
    config.sampling.interval = 10000
}
if (config.targets === undefined) {
    config.targets = []
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

config.backup = () => {
    try {
        fs.writeFileSync(configFile, JSON.stringify(config))
    } catch(error) {
        console.log(`Error writing config file`)
        console.log(error)
    }
}

module.exports = config
