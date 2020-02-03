'use strict'

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

const app = express()
app.use(compression())
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.set(`view engine`, `pug`)
app.set(`views`, path.join(__dirname, `..`, `views`))

let server

module.exports = {
    start: async ({store, config, addon}) => {
        console.log(`Start ${addon.name} - v${addon.version}`)

        await hassio.check()

        app.get(`/`, (req, res) => {
            res.render(`index`, {
                addon,
                config,
            })
        })

        // const script = fs.readFileSync(path.join(__dirname, `..`, `js`, `app.js`))
        app.get(`/app.js`, (req, res) => {
            let script = `
            window.app = {
                config: {
                    measures: ${JSON.stringify(measures)},
                    targets: ${JSON.stringify(targets)},
                },
                tags: [],
                targets: [],
            };
            `
            script += fs.readFileSync(path.join(__dirname, `..`, `js`, `app.js`))
            res.set({
                "Content-Type": `application/javascript`,
            })
            res.send(script)
        })

        app.get(`/tags`, (req, res) => {
            res.json(store.tags())
        })

        app.get(`/targets`, (req, res) => {
            res.json(store.targets())
        })

        app.post(`/target`, async (req, res) => {
            res.json(await store.target(req.body))
        })

        app.post(`/target/delete`, async (req, res) => {
            res.json(await store.targetDelete(req.body.id))
        })

        app.post(`/sampling`, async (req, res) => {
            res.json(await store.sampling(req.body))
        })

        server = app.listen(addon.ingress_port, () => {
            console.log(`Start web server on port ${addon.ingress_port}`)
        })
    },
    stop: async () => {
        return new Promise((resolve, reject) => {
            // console.log(`Stop web server...`)
            server.close(err => {
                if (err) {
                    console.error(err)
                    reject(err)
                } else {
                    console.log(`Web server stopped`)
                    resolve()
                }
            })
            setTimeout(() => {
                console.log(`Timeout closing server`)
                process.exit(0)
            }, serverConfig.timeout)
        })
    }
}
