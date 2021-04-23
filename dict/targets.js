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
                    field: `Used in topic and payload`,
                    name: `Used in payload`,
                },
                measure: {
                    field: `Used in payload`,
                    label: `Used in payload`,
                },
            },
            measure: {
                tag: {
                    field: `Used in topic`,
                },
                measure: {
                    field: `Used in topic`,
                },
            },
            both: {
                tag: {
                    field: `Used in topic and payload`,
                    name: `Used in payload`,
                },
                measure: {
                    field: `Used in topic and payload`,
                    label: `Used in topic and payload`,
                },
            },
        },
        help: `
            <p><strong>Measure</strong> option send each measure value to <code>[topic]/[ruuvitag.field]/[measure.field]</code> topic.</p>
            <p><strong>Tag</strong> option send to <code>[topic]/[ruuvitag.field]</code> topic a json payload:</p>
            <p><pre>{
    "id": "RuuviTag.id",
    "name": "RuuviTag.name",
    "field": "RuuviTag.field",
    "measures": [
        {
            "label": "measure.label",
            "field": "measure.field",
            "value": "measure.value"
        },
        {...}
    ]
}</pre></p>
        `,
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
                    field: `Used in serie name`,
                },
                measure: {
                    field: `Used in serie name`,
                },
            },
        },
        help: `
            <p>Measures are written in <code>[prefix].[ruuvitag.field].[measure.field]</code> series.</p>
        `,
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
                    field: `InfluxDB measurement field`,
                },
                measure: {
                    field: `InfluxDB fields`,
                },
            },
            measure: {
                tag: {},
                measure: {
                    field: `InfluxDB measurement field`,
                },
            },
            both: {
                tag: {
                    field: `InfluxDB measurement field`,
                },
                measure: {
                    field: `InfluxDB fields and measurement field`,
                },
            },
        },
        help: `
            <p><strong>Measure</strong> write value (as InfluxDB field value) in <code>[measure.field]</code> measurement field with <code>[ruuvitag.id]</code> as tag.</p>
            <p><strong>Tag</strong> option write all values (as InfluxDB fields <code>[measure.field]</code>) in <code>[ruuvitag.field]</code> measurement with <code>[ruuvitag.id]</code> as tag.</p>
        `,
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
                    name: `Devices name`,
                },
                measure: {
                    field: `Measure id`,
                    label: `Used in Entity name`,
                },
            },
        },
        help: `
            <p>Enabled RuuviTags will be present in the Devices list and their measures in Entities (one sensor per measure). All measures will be listed in the MQTT Integration. So RuuviTags can be placed in an Area.</p>
            <p>Device name is the one defined in the web interface.</p>
            <p>Entity is defined with some attributes:</p>
            <ul>
                <li>Name: device name followed by measure name</li>
                <li>RuuviTag: id of the tag</li>
                <li>Measure: name of the measure</li>
                <li>Unit: displayed if measure has an unit</li>
                <li>Icon is automatically set</li>
            </ul>
        `,
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
                    label: `Entity name`,
                },
            },
        },
        help: `
            <p>The measure label will be used as the Entity name (with some attributes: RuuviTag name, RuuviTag ID, Measure and Unit).</p>
        `,
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
