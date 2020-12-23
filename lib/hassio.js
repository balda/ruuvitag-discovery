'use strict'

const log = require(`:lib/log`)
const config = require(`#hassio`)
const axios = require(`axios`)

const hassio = {}

const api = async ({method = `GET`, path, data, scope = `api`}) => {
    const options = {
        url: `${config.host}${scope}/${path}`,
        method,
        headers: {},
    }
    if (scope === `addons`) {
        options.headers = {
            'Accept': `application/json`,
            'Content-Type': `application/json;charset=UTF-8`,
            'X-HASSIO-KEY': `${config.token}`,
        }
    }
    if (scope === `api`) {
        options.headers = {
            // 'Accept': `application/json`,
            'Content-Type': `application/json`,
            // 'X-HA-Access': `${config.token}`,
            'Authorization': `Bearer ${process.env.SUPERVISOR_TOKEN}`,
        }
    }
    if (data !== undefined) {
        options.data = JSON.stringify(data)
    }
    if (scope === `api`) {
        console.log(options)
    }
    let response = false
    try {
        response = await axios(options)
    } catch(error) {
        options.url = `http://supervisor/core/${scope}/${path}`
        console.log(options)
        // console.log(process.env)
        response = await axios(options)
    }
    // console.log(response)
    return response
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
                    scope: `api`,
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
