'use strict'

const config = require(`#hassio`)
const axios = require(`#axios`)

const hassio = {}

const api = async ({method = `GET`, path, data}) => {
    const options = {
        url: `${config.host}${path}`,
        method,
        headers: {
            'Accept': `application/json`,
            'Content-Type': `application/json;charset=UTF-8`,
            'X-HA-Access': `${config.token}`,
        },
    }
    if (data !== undefined) {
        options.data = data
    }
    console.log(options)
    const response = await axios(options)
    return response
}

hassio.check = async () => {
    console.log(config)
    const roots = [`/`]
    if (config.token !== ``) {
        // Hass.io integration: get ingress port
        try {
            const response = await api({
                path: `addons/self/info`,
            })
            console.log(response)
            // roots.push(response.data.ingress_entry)
        } catch(error) {
            console.log(error)
        }
    }
    return roots
}

module.exports = hassio
