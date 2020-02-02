'use strict'

require(`wires`)

const config = require(':lib/config')
const addon = require(`./config.json`)

const ruuvitag = require('node-ruuvitag')
const calc = require(':utils/calc')
const broadcaster = require(':lib/broadcaster')
const broadcasterInterval = {}

const tags = {}
const history = {}
let processStopped = false

const broadcast = ({target, tag, field = `last`}) => {
    // process stopped
    if (processStopped) {
        return
    }
    // target disabled
    if (1 * target.enable === 0) {
        return
    }
    // tag not in config
    if (target.tags && target.tags[tag.id] === undefined) {
        return
    }
    // if no sampling, always get `last`
    if (1 * config.sampling.interval === 0) {
        field = `last`
    }
    // no tag data (ex: still not agg)
    if (!tag[`${field}`]) {
        return
    }
    const tagField = tag[`${field}`]
    // data older than interval (if not live)
    if (1 * target.interval > 0 && Date.now() - tagField.ts > 1000 * target.interval) {
        return
    }
    const tagConfig = target.tags[tag.id]
    const data = {
        id: tag.id,
        name: tagConfig.name,
        field: tagConfig.field,
        measures: Object.keys(tagField).filter(measure => {
            return tagConfig.measures[measure] !== undefined
        }).map(measure => {
            return {
                label: tagConfig.measures[measure].label,
                field: tagConfig.measures[measure].field,
                value: tagField[measure],
                measure,
            }
        }).concat(Object.keys(tag).filter(measure => {
            return tagConfig.measures[measure] !== undefined && tag[measure] !== Infinity
        }).map(measure => {
            return {
                label: tagConfig.measures[measure].label,
                field: tagConfig.measures[measure].field,
                value: tag[measure],
                measure,
            }
        }))
    }
    // console.log({target, data})
    broadcaster(target).send(data)
}

ruuvitag.on('found', tag => {
    if (!tags[tag.id]) {
        tags[tag.id] = null
        history[tag.id] = []
    }
    console.log(`Discover RuuviTag ${tag.id}`)
    // console.log(`(address "${tag.address}", addressType "${tag.addressType}", connectable "${tag.connectable}")`)
    // console.log(tag)
    tag.on('updated', data => {
        if (tags[tag.id] === null) {
            tags[tag.id] = {
                last: null,
                first: null,
                samples: 0,
                median: null,
            }
        }
        data.ts = Date.now()
        calc(data)
        data.id = tag.id
        tags[tag.id].id = tag.id
        tags[tag.id].last = data
        history[tag.id].push(data)
        const del = history[tag.id].length - config.sampling.history
        if (del > 0) {
            history[tag.id].splice(0, del)
        }
        calcFrequency(tag.id)
        for (const target of config.targets) {
            if (target.tags && target.tags[tag.id] !== undefined && 1 * target.interval === 0) {
                broadcast({target, tag: tags[tag.id], field: `last`})
            }
        }
        // console.log(`Got data from RuuviTag ${tag.id}`);
        // console.log(JSON.stringify(data, null, 2))
    })
})

const calcFrequency = (id) => {
    const now = Date.now()
    const ms = now - history[id][0].ts
    const sec = ms / 1000
    const minutes = sec / 60
    tags[id].frequency = history[id].length / minutes
    tags[id].period = sec / history[id].length
}

const up = (a, b) => (a - b)

const sampleAggregation = () => {
    const now = Date.now()
    for (const id in history) {
        calcFrequency(id)
        if (history[id].length) {
            const _measures = {}
            for (const measure in history[id][0]) {
                if (measure !== `id` && measure !== `ts`) {
                    _measures[measure] = []
                }
            }
            for (const sample of history[id]) {
                if (now - sample.ts < config.sampling.interval) {
                    for (const measure in _measures) {
                        _measures[measure].push(sample[measure])
                    }
                }
            }
            const median = {
                has: false,
                measures: {},
            }
            for (const measure in _measures) {
                if (_measures[measure].length) {
                    median.has = true
                    _measures[measure] = _measures[measure].sort(up)
                    let index = null
                    if (_measures[measure].length % 2 === 1) {
                        index = Math.floor(_measures[measure].length / 2)
                        median.measures[measure] = _measures[measure][index]
                    } else {
                        index = _measures[measure].length / 2
                        median.measures[measure] = (_measures[measure][index] + _measures[measure][index - 1]) / 2
                    }
                }
            }
            if (median.has) {
                median.measures.ts = now
                tags[id].median = median.measures
            }
        }
    }
}

let samplingInterval = null
const handleSampling = () => {
    if (1 * config.sampling.interval > 0) {
        console.log(`Start measures sampling every ${config.sampling.interval / 1000} seconds`)
        samplingInterval = setInterval(() => {
            sampleAggregation()
        }, config.sampling.interval)
    } else if (samplingInterval) {
        console.log(`Stop measures sampling`)
        clearInterval(samplingInterval)
        samplingInterval = null
    }
}

const clearTargetInterval = (target) => {
    // console.log(`clear "${target.name}" broadcast interval`)
    if (broadcasterInterval[`${target.id}`] !== undefined) {
        clearInterval(broadcasterInterval[`${target.id}`].id)
        broadcasterInterval[`${target.id}`] = undefined
    }
}

const activateTargetInterval = (target) => {
    broadcasterInterval[`${target.id}`] = {
        interval: `${target.interval}`,
        id: setInterval(() => {
            // console.log(`broadcast to "${target.name}"`)
            for (const tag in tags) {
                if (target.tags && target.tags[tag] !== undefined) {
                    broadcast({target, tag: tags[tag], field: `median`})
                }
            }
        }, 1000 * target.interval),
    }
}

const handleTarget = async (target) => {
    if (1 * target.enable === 0) {
        clearTargetInterval(target)
        await broadcaster.reset(target)
    } else {
        await broadcaster.reset(target)
        broadcaster(target).start()
        if (1 * target.interval === 0) {
            clearTargetInterval(target)
        } else {
            if (broadcasterInterval[`${target.id}`] === undefined) {
                activateTargetInterval(target)
            } else if (broadcasterInterval[`${target.id}`].interval !== `${target.interval}`) {
                clearTargetInterval(target)
                activateTargetInterval(target)
            }
        }
    }
}

const store = {
    tags: () => {
        return Object.keys(tags).map(id => {
            if (tags[id]) {
                tags[id].first = history[id][0]
                tags[id].samples = history[id].length
            }
            return tags[id]
        }).filter(tag => !!tag)
    },
    targets: () => {
        return config.targets
    },
    target: async (data) => {
        if (data.id === undefined) {
            data.id = config.targets.length
            config.targets.push(data)
        } else {
            const targetIndex = config.targets.findIndex(target => {
                return `${target.id}` === `${data.id}`
            })
            config.targets[targetIndex] = data
        }
        config.backup()
        await handleTarget(data)
        return config.targets
    },
    targetDelete: async (id) => {
        const targetIndex = config.targets.findIndex(target => {
            return `${target.id}` === `${id}`
        })
        if (targetIndex !== -1) {
            config.targets[targetIndex].enable = 0
            await handleTarget(config.targets[targetIndex])
            config.targets.splice(targetIndex, 1)
            config.backup()
            return config.targets
        }
    },
    sampling: async (sampling) => {
        config.sampling = sampling
        config.backup()
        handleSampling()
    },
}

const server = require(':lib/server')

const end = async (signal) => {
    console.log({
        timestamp: (new Date()).toISOString(),
        object: 'stop',
        signal: `${signal}`,
    })
    processStopped = true
    // stop broadcasters
    // console.log(`Stop broadcasting...`)
    for (const target of config.targets) {
        try {
            // console.log(`Clear interval...`)
            clearTargetInterval(target)
            // console.log(`Stop broadcaster...`)
            await broadcaster(target).stop()
        } catch(err) {
            console.error(err)
        }
    }
    // close web server
    // console.log(`Close server...`)
    try {
        await server.stop()
    } catch(err) {
        console.error(err)
        process.exit(1)
    }
    // console.log(`process.exit(0)`)
    process.exit(0)
}

const run = async () => {
    server.start({store, config, addon})

    handleSampling()

    for (const target of config.targets) {
        await handleTarget(target)
    }

    for (const signal of [`SIGHUP`, `SIGINT`, `SIGTERM`]) {
        process.on(signal, () => end(signal))
    }
}

run()
