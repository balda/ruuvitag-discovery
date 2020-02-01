'use strict'

const net = require(`net`)

const broadcasterFactory = (target) => {
    // console.log({target})

    const broadcaster = {}

    broadcaster.start = () => {}
    broadcaster.stop = async () => {}
    broadcaster.send = (data) => {
        // console.log({data})
        const socket = net.createConnection(target.port, target.host, () => {
            const send = (line) => {
                return new Promise((resolve, reject) => {
                    // console.log(`write in graphite: ${line}`)
                    socket.write(`${line}\n`, () => {
                        resolve()
                    })
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
                console.log(`Graphite send error`)
                console.log(error)
                socket.end()
            })
        })
    }

    return broadcaster
}

module.exports = broadcasterFactory
