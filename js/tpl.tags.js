app.ui = {};
app.ui.col = {};

app.ui.col.open = false;
app.ui.col.data = {
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
app.ui.col.enabled = (field) => {
    return app.ui.col.data[field] === true;
};
app.ui.col.change = (field, status) => {
    app.ui.col.data[field] = status;
};
app.ui.col.list = () => {
    return app.cols.filter(col => {
        return app.ui.col.enabled(col.field) === true;
    });
};

app.tpl.tags = () => {
    return `
    <div class="my-1">
        <a href="#" class="btn btn-sm ${app.btn.color} refresh-tags">
            <i class="fal fa-sync"></i> Refresh
        </a>
        <a href="#" class="ml-2 btn btn-sm ${app.btn.color} toggle-tags-cols">
            <i class="fal fa-columns"></i> Select Columns
        </a>
    </div>
    <div class="row py-2 mt-1 border-top" id="tags-cols" ${app.ui.col.open ? `` : `style="display: none;"`}>
        ${app.cols.map(col => {
            return `
            <div class="col-sm-6 col-md-4 col-lg-3 col-xl-2">
                <div class="custom-control custom-switch font-weight-lighter small">
                    <input type="checkbox" ${app.ui.col.enabled(col.field) ? `checked` : ``}
                     class="show-tags-col custom-control-input"
                     data-field="${col.field}"
                     id="col-${col.field}"
                    >
                    <label class="custom-control-label" style="padding-top: 2px;" for="col-${col.field}">
                        ${col.title}
                    </label>
                </div>
            </div>
            `;
        }).join(``)}
    </div>
    <div class="table-responsive">
        <table class="table table-sm font-weight-lighter">
            <tr>
                ${app.ui.col.list().map(col => {
                    return `
                        <td class="${col.class || `text-right`} ${col.unit ? `jstooltip` : ``}" ${col.unit ? `title="${col.unit}"` : ``}>
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
            ${app.tags.map(tag => {
                return `
                    <tr>
                        ${app.ui.col.list().map(col => {
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

    $page.on(`change`, `.show-tags-col`, (e) => {
        const $element = $(e.currentTarget);
        const field = $element.data(`field`);
        app.ui.col.change(field, $element[0].checked);
        app.showTags();
    });

    $page.on(`click`, `.toggle-tags-cols`, (e) => {
        e.preventDefault();
        // e.stopPropagation();
        app.ui.col.open = !app.ui.col.open;
        $(`#tags-cols`).toggle();
    });


});
