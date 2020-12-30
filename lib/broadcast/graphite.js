'use strict'

const log = require(`:lib/log`)
const logPrefix = `[GRAPHITE]`
const net = require(`net`)
const measures = require(':lib/measures')

const broadcasterFactory = (target) => {
    // console.log({target})

    const broadcaster = {}

    broadcaster.start = (server) => {
        if (server) {
            broadcaster.server = server
        }
    }
    broadcaster.stop = async () => {}
    broadcaster.send = (data) => {
        data.measures = measures.update(data.measures)
        // console.log({data})
        // TODO: handle timeout
        // https://stackoverflow.com/questions/29356800/node-net-socket-connection-timeout
        const socket = net.createConnection(target.port, target.host, () => {
            const send = (line) => {
                return new Promise((resolve, reject) => {
                    socket.write(`${line}\n`, () => {
                        resolve()
                    })
                    log.debug(`${logPrefix} Write in graphite: ${line}`)
                })
            }

            const promises = []
            const time = Math.round(Date.now() / 1000)
            for (const measure of data.measures) {
                promises.push(send(`${target.prefix}.${data.field}.${measure.field} ${measure.value} ${time}`))
            }

            Promise.all(promises).then(() => {
                socket.end()
            }).catch(error => {
                if (broadcaster.server) {
                    broadcaster.server.error({
                        error: error.message,
                        target,
                    })
                }
                socket.end()
            })
        })
        socket.on(`error`, (error) => {
            if (broadcaster.server) {
                broadcaster.server.error({
                    error: error.message,
                    target,
                })
            }
            socket.end()
        })
    }

    return broadcaster
}

module.exports = broadcasterFactory
