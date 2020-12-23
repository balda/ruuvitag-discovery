'use strict'

const log = require(`:lib/log`)
const config = require(`#hassio`)
const axios = require(`axios`)

const hassio = {}

const api = async ({method = `GET`, path, data, scope = `core/api`}) => {
    const options = {
        url: `${config.host}${scope}/${path}`,
        method,
        headers: {
            'Content-Type': `application/json`,
            'Authorization': `Bearer ${config.token}`,
        },
    }
    if (data !== undefined) {
        options.data = JSON.stringify(data)
    }
    return await axios(options)
}

hassio.check = async () => {
    let ingress = `/`
    if (config.token !== ``) {
        // Hass.io integration: get ingress path
        try {
            const response = await api({
                scope: `addons`,
                path: `self/info`,
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
                await api({
                    method: `POST`,
                    path: `states/${entity_id}`,
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
