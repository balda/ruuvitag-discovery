app.cols = [
    {
        title: `ID`,
        field: `id`,
        format: (tag, source, field) => {
            if (source !== `last`) {
                return `${source}`;
            }
            const data = tag[source][field];
            return `
                <span class="jstooltip" title="${data}">
                    ${data.substring(0,4)}
                </span>
            `;
        },
    }, {
        title: `Format`,
        field: `dataFormat`,
        format: (tag, source, field) => {
            if (source !== `last`) {
                return ``;
            }
            const data = tag[source][field];
            return data;
        },
    }, {
        title: `RSSI`,
        field: `rssi`,
        format: (tag, source, field) => {
            const data = tag[source][field];
            return Math.round(data);
        },
    }, {
        title: `Temperature`,
        field: `temperature`,
        format: (tag, source, field) => {
            const data = tag[source][field];
            return data.toFixed(2);
        },
    }, {
        title: `Humidity`,
        field: `humidity`,
        format: (tag, source, field) => {
            const data = tag[source][field];
            return data.toFixed(1);
        },
    }, {
        title: `Pressure`,
        field: `pressure`,
        format: (tag, source, field) => {
            const data = tag[source][field];
            return Math.round(data);
        },
    // }, {
    //     title: `Acceleration X`,
    //     field: `accelerationX`,
    // }, {
    //     title: `Acceleration Y`,
    //     field: `accelerationY`,
    // }, {
    //     title: `Acceleration Z`,
    //     field: `accelerationZ`,
    }, {
        title: `Battery`,
        field: `battery`,
        format: (tag, source, field) => {
            const data = tag[source][field];
            return `
                ${Math.round(data)}
                <small class="ml-1 font-weight-lighter">
                    (${Math.round(tag[source].battery_level)}%)
                </small>
            `;
        },
    }, {
        title: `Tx Power`,
        field: `txPower`,
        format: (tag, source, field) => {
            const data = tag[source][field];
            return data ? Math.round(data) : `-`;
        },
    }, {
        title: `Movement #`,
        field: `movementCounter`,
        format: (tag, source, field) => {
            const data = tag[source][field];
            return data ? Math.round(data) : `-`;
        },
    }, {
        title: `Measurement #`,
        field: `measurementSequenceNumber`,
        format: (tag, source, field) => {
            const data = tag[source][field];
            return data ? Math.round(data) : `-`;
        },
    }
];
