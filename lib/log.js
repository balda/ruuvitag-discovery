`use strict`

const config = require(`:lib/config`)
const logs = require(`#logs`)

const log = (msg, level = `info`) => {
    if (!config.log[level]) {
        return
    }
    let prefix = ``
    if (config.log.timestamp) {
        prefix += `[${(new Date()).toISOString()}] `
    }
    if (level !== `info`) {
        prefix += `[${level.toUpperCase()}] `
    }
    console.log(`${prefix}${msg}`)
}

for (const level in logs) {
    log[level] = (msg) => {
        log(msg, level)
    }
}

module.exports = log
