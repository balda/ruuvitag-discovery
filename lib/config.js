'use strict'

// const config = async () => {
//     try {
//         // HA config
//         config = require(`/data/options.json`)
//     } catch(e) {}
//     if (!config) {
//         try {
//             config = require(`./data/options.json`)
//         } catch(e) {
//             config = {
//                 broker: {},
//             }
//         }
//     }
// }

const fs = require('fs')
const path = require('path')

let config = {}

try {
    fs.mkdirSync(path.join(__dirname, `..`, `data`))
} catch(e) {
    // console.log(e)
}
try {
    config = JSON.parse(fs.readFileSync(path.join(__dirname, `..`, `data`, `config.json`)))
} catch(e) {
    // console.log(e)
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
        fs.writeFileSync(path.join(__dirname, `..`, `data`, `config.json`), JSON.stringify(config))
    } catch(e) {
        // console.log(e)
    }
}

module.exports = config
