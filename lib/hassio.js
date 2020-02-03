'use strict'

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
                console.log(error.response.status)
                console.log(error.response.data)
            } else if (error.request) {
                console.log(error.request)
            } else {
                console.log(error.message)
            }
        }
    }
    return ingress
}

module.exports = hassio
