'use strict'

const log = require(`:lib/log`)
const config = require(`#hassio`)
const axios = require(`axios`)

const hassio = {}

const api = async ({method = `GET`, path, data}) => {
    const options = {
        url: `${config.host}${path}`,
        method,
        headers: {
            'Accept': `application/json`,
            'Content-Type': `application/json;charset=UTF-8`,
            'X-HASSIO-KEY': `${config.token}`,
        },
    }
    if (data !== undefined) {
        options.data = data
    }
    const response = await axios(options)
    return response
}

hassio.check = async () => {
    let ingress = `/`
    if (config.token !== ``) {
        // Hass.io integration: get ingress path
        try {
            const response = await api({
                path: `addons/self/info`,
            })
            ingress = response.data.data.ingress_url
        } catch(error) {
            if (error.response) {
                log.error(error.response.status)
                log.error(error.response.data)
            } else if (error.request) {
                log.error(error.request)
            } else {
                log.error(error.message)
            }
        }
    }
    return ingress
}

hassio.state = {
    set: async (entity_id, data) => {
        let response = false
        if (config.token !== ``) {
            try {
                response = await api({
                    method: `POST`,
                    path: `api/states/${entity_id}`,
                    data,
                })
                response = true
            } catch(error) {
                if (error.response) {
                    log.error(error.response.status)
                    log.error(error.response.data)
                } else if (error.request) {
                    log.error(error.request)
                } else {
                    log.error(error.message)
                }
            }
        } else {
            log.error(`[HA API] No api token`)
        }
        return response
    }
}

module.exports = hassio
