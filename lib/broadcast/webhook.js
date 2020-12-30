'use strict'

const measures = require(':lib/measures')

const broadcasterFactory = (target) => {
    // console.log({target})

    const broadcaster = {}

    broadcaster.start = () => {}
    broadcaster.stop = async () => {}
    broadcaster.send = (data) => {
        // console.log({data})
    }

    return broadcaster
}

module.exports = broadcasterFactory
