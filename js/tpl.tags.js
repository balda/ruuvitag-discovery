app.tpl.tags = (tags) => {
    // console.log(tags);
    app.ui = {};
    app.ui._cols = {
        id: true,
        dataFormat: true,
        rssi: true,
        temperature: true,
        humidity: true,
        pressure: true,
        accelerationX: false,
        accelerationY: false,
        accelerationZ: false,
        battery: true,
        battery_level: true,
        txPower: true,
        movementCounter: true,
        measurementSequenceNumber: true,
        samples: true,
        frequency: true,
        period: true,
        ts: true,
    };
    app.ui.cols = () => {
        return app.cols.filter(col => app.ui._cols[col.field] === true);
    };
    return `
    <div class="my-1">
        <a href="#" class="btn btn-sm ${app.btn.color} refresh-tags">
            <i class="fal fa-sync"></i> Refresh
        </a>
    </div>
    <div class="table-responsive">
        <table class="table table-sm font-weight-lighter">
            <tr>
                ${app.ui.cols().map(col => {
                    return `
                        <td class="${col.class || `text-right`}">
                            <small>${col.title}</small>
                        </td>
                    `;
                }).join(``)}
                <td class="text-center">
                    <small>Targets</small>
                </td>
                <td class="text-center">
                    <small>Infos</small>
                </td>
            </tr>
            ${tags.map(tag => {
                return `
                    <tr>
                        ${app.ui.cols().map(col => {
                            return `
                                <td ${col.td || ``} class="${col.class || `text-right`} font-weight-lighter small">
                                    ${col.render(tag)}
                                </td>
                            `;
                        }).join(``)}
                        <td class="text-center">
                            ${app.tagTargets && app.tagTargets[tag.id] ? `
                                <span class="jstooltip font-weight-lighter" title="${app.tagTargets[tag.id].map(target => {
                                    return `${target.name} (${target.type})`;
                                }).join(`, `)}">
                                    <i class="fal fa-database"></i>
                                    <span class="small">
                                        <span class="badge badge-light">${app.tagTargets[tag.id].length}</span>
                                    </span>
                                </span>
                            ` : ``}
                        </td>
                        <td class="text-center">
                            <a href="#" class="text-dark show-tag-measures" data-id="${tag.id}">
                                <i class="fal fa-info-circle"></i>
                            </a>
                        </td>
                    </tr>
                `;
            }).join(``)}
        </table>
    </div>
    `;
};

$('body').ready(() => {

    const $page = $(`#page`);

    $page.on(`click`, `.show-tag-measures`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        const tag = app.tags.find(t => t.id === id);
        const sources = [`last`, `median`, `first`];
        app.modal.show({
            header: `
                RuuviTag
                <span class="font-weight-lighter">
                    ${tag.id}
                </span>`,
            body: `
                <div class="container-fluid">
                    <div class="row">
                        <div class="col">
                            Measure
                        </div>
                        ${sources.map(source => {
                            return `
                                <div class="col text-right">
                                    ${source}
                                </div>
                            `;
                        }).join(``)}
                    </div>
                    ${Object.keys(tag.last).filter(field => field !== `id`).sort().map(field => {
                        const col = app.cols.find(c => c.field === field);
                        return `
                            <div class="row font-weight-lighter">
                                <div class="col">
                                    ${col ? `${col.title} ${col.unit ? `(${col.unit})` : ``}` : `${field}`}
                                </div>
                                ${sources.map(source => {
                                    return `
                                        <div class="col text-right">
                                            ${col ? col.render(tag, source) : `${tag[source][field]}`}
                                        </div>
                                    `;
                                }).join(``)}
                            </div>
                        `;
                    }).join(``)}
                </div>
            `,
            // <pre>${JSON.stringify(tag, null, 2)}</pre>
            footer: `
                ${app.cols.filter(c => c.global === true).map(col => {
                    return `
                        <span class="mr-4 font-weight-lighter">
                            ${col.title}:
                            ${col.render(tag)}
                        </span>
                    `;
                }).join(``)}
            `,
        });
    });

});
