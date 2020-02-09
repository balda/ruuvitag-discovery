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

const script = () => {
    let content = `
    window.app = {
        config: {
            measures: ${JSON.stringify(measures)},
            targets: ${JSON.stringify(targets)},
        },
        tags: [],
        targets: [],
        tpl: {},
        btn: {
            color: "btn-light btn-sm",
            delete: "btn-link text-danger btn-sm",
        },
    };
    `
    for (const file of [
        `app`,
        `cols`,
        `tpl.field`,
        `tpl.tagField`,
        `tpl.tags`,
        `tpl.targets`,
        `tpl.target`,
        `tpl.tagsNotFound`,
        `tpl.tag`,
        `config`,
    ]) {
        content += fs.readFileSync(path.join(__dirname, `..`, `js`, `${file}.js`))
    }
    return content
}

module.exports = {
    start: async ({store, config, addon}) => {
        console.log(`Start ${addon.name} - v${addon.version}`)

        const root = `/`
        const ingress = await hassio.check()

        app.get(`${root}`, (req, res) => {
            res.render(`index`, {
                addon,
                config,
                root,
                ingress,
            })
        })

        app.get(`${root}app.js`, (req, res) => {
            res.set({
                "Content-Type": `application/javascript`,
            })
            res.send(script())
        })

        app.get(`${root}tags`, (req, res) => {
            res.json(store.tags())
        })

        app.get(`${root}targets`, (req, res) => {
            res.json(store.targets())
        })

        app.post(`${root}target`, async (req, res) => {
            res.json(await store.target(req.body))
        })

        app.post(`${root}target/delete`, async (req, res) => {
            res.json(await store.targetDelete(req.body.id))
        })

        app.post(`${root}config`, async (req, res) => {
            res.json(await store.config(req.body))
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
