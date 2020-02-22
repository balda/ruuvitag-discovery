app.formats = {
    sub: (data) => {
        return `
            <span class="jstooltip" title="${data}">
                ${data.substring(0,4)}
            </span>
        `;
    },
};

app.cols = [
    {
        title: `ID`,
        field: `id`,
        class: `text-left`,
        render: (tag, field = `last`) => {
            const data = tag[field].id;
            return `
                <span class="jstooltip" title="${data}">
                    ${data.substring(0,4)}
                </span>
            `;
        },
    }, {
        title: `Data Format`,
        field: `dataFormat`,
    }, {
        field: `rssi`,
    }, {
        field: `temperature`,
    }, {
        field: `humidity`,
    }, {
        field: `pressure`,
    }, {
        field: `accelerationX`,
    }, {
        field: `accelerationY`,
    }, {
        field: `accelerationZ`,
    }, {
        field: `battery`,
    }, {
        field: `battery_level`,
    }, {
        field: `txPower`,
    }, {
        title: `Movement #`,
        field: `movementCounter`,
    }, {
        title: `Measurement #`,
        field: `measurementSequenceNumber`,
    }, {
        title: `Samples`,
        field: `samples`,
        global: true,
        render: (tag) => {
            return `
                ${tag.samples ? Math.round(tag.samples) : `-`}
            `;
        },
    }, {
        title: `Freq / min`,
        field: `frequency`,
        global: true,
        render: (tag) => {;
            return `
                <span class="jstooltip" title="${tag.frequency}">
                    ${tag.frequency ? tag.frequency.toFixed(1) : `N/A`}
                </span>
            `;
        },
    }, {
        title: `Period (sec)`,
        field: `period`,
        global: true,
        render: (tag) => {
            return `
                <span class="jstooltip" title="${tag.period}">
                    ${tag.period ? tag.period.toFixed(0) : `N/A`}
                </span>
            `;
        },
    }, {
        title: `Last seen (sec)`,
        field: `ts`,
        render: (tag, field = `last`) => {
            const data = tag[field].ts;
            const m = moment(data);
            return `
                <span class="jstooltip" title="${m.format(`YYYY-MM-DD HH:mm:ss`)}<br><em>${m.fromNow()}</em>">
                    ${((Date.now() - data) / 1000).toFixed(0)}
                </span>
            `;
        },
    }
];

app.cols.forEach((col, i) => {
    const measure = app.config.measures.find(m => m.field === col.field);
    if (measure) {
        for (const key in measure) {
            if (col[key] === undefined) {
                app.cols[i][key] = measure[key];
            }
        }
        if (col.title === undefined) {
            col.title = col.label;
        }
    }
    if (col.render === undefined) {
        app.cols[i].render = (tag, field = `last`) => {
            const data = tag[field][col.field];
            let render = data;
            if (data) {
                if (col.accuracy !== undefined) {
                    render = data.toFixed(col.accuracy);
                }
            } else {
                render = `-`;
            }
            return `
                ${render !== `-` && `${data}` !== `${render}` ? `
                    <span class="jstooltip" title="${data}">
                        ${render}
                    </span>
                ` : `
                    ${render}
                `}
            `;
        };
    }
});
