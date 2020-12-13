'use strict'

const log = require(`:lib/log`)
const measures = require(':dict/measures')
const targets = require(':dict/targets')

const serverConfig = require(`#server`)
const hassio = require(`:lib/hassio`)

const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const WebSocket = require('ws')

const app = express()
app.use(compression())
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.set(`view engine`, `pug`)
app.set(`views`, path.join(__dirname, `..`, `views`))

app.use('/assets', express.static(path.join(__dirname, `..`, `assets`)))

let server
let wss

const socketSend = (data) => {
    if (wss) {
        if (wss.clients.size) {
            log.ws(`WebSocket: send data to browser: ${JSON.stringify(data)}`)
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data))
                }
            })
        }
    }
}

module.exports = {
    start: async ({store, config, addon}) => {
        log(`Start ${addon.name} - v${addon.version}`)

        const root = `/`
        const ingress = await hassio.check()

        app.get(`${root}`, (req, res) => {
            res.render(`svelte`, {
                version: process.env.NODE_ENV === `production` ? `.${addon.version}.min` : ``,
                env: process.env.NODE_ENV,
                wires: process.env.WIRES_ENV,
                addon,
                ingress,
            })
        })

        app.post(`${root}target`, async (req, res) => {
            res.json(await store.target(req.body))
        })

        app.post(`${root}target/delete`, async (req, res) => {
            res.json(await store.targetDelete(req.body.id))
        })

        app.post(`${root}config`, async (req, res) => {
            // TODO
            // if (req.body.customMeasures) {
            //     // check if deleted (length decrement)
            // }
            config = await store.config(req.body)
            socketSend({config})
            // TODO
            // if deleted, resend targets
            res.send(`OK`)
            // setTimeout(() => {
            //     socketSend({config})
            //     res.send(`OK`)
            // }, 1500)
        })

        const port = (process.env.SERVER_PORT && process.env.SERVER_PORT !== ``) ? process.env.SERVER_PORT : addon.ingress_port
        server = app.listen(port, () => {
            log(`Start web server on port ${port}`)
        })
        server.on(`error`, (error) => {
            if (error && error.code === `EADDRINUSE`) {
                log.error(`Web server port ${port} already in use: you can't use a same port more than once.`)
            } else {
                log.error(error)
            }
            process.exit(0)
        })
        wss = new WebSocket.Server({ server })
        wss.on(`connection`, (ws) => {
            log.debug(`WebSocket connection`)
            ws.send(JSON.stringify({
                addon,
                config,
                root,
                ingress,
                measures,
                targets,
            }))
            const tags = store.tags()
            for (const tag of tags) {
                socketSend({tag})
            }
            // ws.on('message', function incoming(message) {
            //     console.log('received: %s', message)
            // })
        });
    },
    tag: (tag) => {
        socketSend({tag})
    },
    error: (error) => {
        log.error(`Connection Error with "${error.target ? error.target.name : `unknown`}" target: ${error.error}`)
        // socketSend({error})
    },
    // TODO: sync broadcasters state
    // broadcaster: (state) => {
    //     socketSend({state})
    // },
    stop: async () => {
        return new Promise((resolve, reject) => {
            log.debug(`Stop web server...`)
            wss.close()
            server.close(err => {
                if (err) {
                    console.error(err)
                    reject(err)
                } else {
                    log(`Web server stopped`)
                    resolve()
                }
            })
            setTimeout(() => {
                log.error(`Timeout closing server`)
                process.exit(0)
            }, serverConfig.timeout)
        })
    },
}
