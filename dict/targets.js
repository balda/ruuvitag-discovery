'use strict'

const targets = [
    {
        type: `mqtt`,
        label: `MQTT`,
        measurement: true,
        config: [
            // {
            //     name: `protocol`,
            // },
            {
                name: `host`,
            },
            {
                name: `port`,
                type: `number`,
            },
            {
                name: `topic`,
            },
            {
                name: `username`,
            },
            {
                name: `password`,
                type: `password`,
            },
        ],
        fields: {
            tag: {
                tag: {
                    field: `whereused`,
                    name: `whereused`,
                },
                measure: {
                    field: `whereused`,
                    label: `whereused`,
                },
            },
            measure: {
                tag: {
                    field: `whereused`,
                },
                measure: {
                    field: `whereused`,
                },
            },
            both: {
                tag: {
                    field: `whereused`,
                    name: `whereused`,
                },
                measure: {
                    field: `whereused`,
                    label: `whereused`,
                },
            },
        },
    },
    {
        type: `graphite`,
        label: `Graphite`,
        config: [
            {
                name: `host`,
            },
            {
                name: `port`,
                type: `number`,
            },
            {
                name: `prefix`,
            },
        ],
        fields: {
            default: {
                tag: {
                    field: `whereused`,
                },
                measure: {
                    field: `whereused`,
                },
            },
        },
    },
    {
        type: `influxdb`,
        label: `InfluxDB`,
        measurement: true,
        config: [
            // {
            //     name: `protocol`,
            // },
            {
                name: `host`,
            },
            {
                name: `port`,
                type: `number`,
            },
            {
                name: `database`,
            },
            {
                name: `username`,
            },
            {
                name: `password`,
                type: `password`,
            },
        ],
        fields: {
            tag: {
                tag: {
                    field: `whereused`,
                },
                measure: {
                    field: `whereused`,
                },
            },
            measure: {
                tag: {},
                measure: {
                    field: `whereused`,
                },
            },
            both: {
                tag: {
                    field: `whereused`,
                },
                measure: {
                    field: `whereused`,
                },
            },
        },
    },
    {
        type: `ha_mqtt`,
        label: `Home Assistant (MQTT)`,
        config: [
            // {
            //     name: `protocol`,
            // },
            {
                name: `host`,
            },
            {
                name: `port`,
                type: `number`,
            },
            {
                name: `topic`,
            },
            {
                name: `username`,
            },
            {
                name: `password`,
                type: `password`,
            },
            // {
            //     name: `expire_after`,
            // },
        ],
        fields: {
            default: {
                tag: {
                    name: `whereused`,
                },
                measure: {
                    field: `whereused`,
                    label: `whereused`,
                },
            },
        },
    },
    {
        type: `ha`,
        label: `Home Assistant (API)`,
        config: [
        ],
        fields: {
            default: {
                tag: {},
                measure: {
                    label: `whereused`,
                },
            },
        },
    },
    // {
    //     type: `webhook`,
    //     label: `Webhook`,
    //     config: [
    //         {
    //             name: `url`,
    //         },
    //         {
    //             name: `headers`,
    //             type: `json`,
    //         },
    //     ],
    // },
]

module.exports = targets
