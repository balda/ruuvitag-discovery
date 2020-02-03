// console.log(`OK`);
$('body').ready(() => {

    const root = $(`base`).attr(`href`);

    const btn = {
        color: `btn-light btn-sm`,
        delete: `btn-link text-danger btn-sm`,
    };

    app.config.attributes = [{
        field: `id`,
        label: `RuuviTag ID`,
    }, {
        field: `dataFormat`,
        label: `Data Format`,
        measure: `last`,
    }, {
        field: `rssi`,
        label: `RSSI`,
        measure: `last`,
    }, {
        field: `ts`,
        label: `Last Seen`,
        measure: `last`,
    }, {
        field: `frequency`,
        label: `Frequency`,
        toFixed: 1,
    }, {
        field: `period`,
        label: `Period`,
        toFixed: 0,
    }];

    const $page = $(`#page`);
    const $header = $(`#header`);
    const $content = $(`#content`);
    const $tags = $(`#tags`);
    const $targets = $(`#targets`);
    const $config = $(`#config`);

    const showPanel = (target) => {
        $(`.panel-display`).hide();
        $(`#${target}`).show();
    };

    $page.on(`click`, `.panel-view`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        $element.tooltip('hide');
        showPanel($element.data(`target`));
    });

    const cols = [
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
                return Math.round(data);
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

    const tpl = {};

    tpl.tags = (tags) => {
        // console.log(tags);
        const now = Date.now();
        return `
        <div class="my-1">
            <a href="#" class="btn btn-sm ${btn.color} refresh-tags">
                <i class="fal fa-sync"></i> Refresh
            </a>
        </div>
        <table class="table table-sm font-weight-lighter">
            <tr>
                ${cols.map(col => {
                    return `
                        <td>
                            <small>${col.title}</small>
                        </td>
                    `;
                }).join(``)}
                <td>
                    <small>Samples</small>
                </td>
                <td>
                    <small>Freq / min</small>
                </td>
                <td>
                    <small>Period (sec)</small>
                </td>
                <td>
                    <small>Last seen (sec)</small>
                </td>
                <td class="text-center">
                    <small>Targets</small>
                </td>
            </tr>
            ${tags.map(tag => {
                const ts = new Date(tag.last.ts);
                const mediants = tag.median ? (new Date(tag.median.ts)) : null;
                const firstts = tag.first ? (new Date(tag.first.ts)) : null;
                return `
                    <tr>
                        ${cols.map(col => {
                            return `
                                <td>
                                    <small class="font-weight-lighter">
                                        ${col.format ? col.format(tag, `last`, col.field) : tag.last[col.field]}
                                    </small>
                                    ${tag.median ? `
                                        <br>
                                        <small class="font-weight-lighter">
                                            <em>${col.format ? col.format(tag, `median`, col.field) : tag.median[col.field]}<em>
                                        </small>
                                    ` : ``}
                                    ${tag.first ? `
                                        <br>
                                        <small class="font-weight-lighter">
                                            <em>${col.format ? col.format(tag, `first`, col.field) : tag.first[col.field]}<em>
                                        </small>
                                    ` : ``}
                                </td>
                            `;
                        }).join(``)}
                        <td>
                            <small class="font-weight-lighter">
                                ${tag.samples}
                            </small>
                        </td>
                        <td>
                            <small class="font-weight-lighter jstooltip" title="${tag.frequency}">
                                ${tag.frequency ? tag.frequency.toFixed(1) : `N/A`}
                            </small>
                        </td>
                        <td>
                            <small class="font-weight-lighter jstooltip" title="${tag.period}">
                                ${tag.period ? tag.period.toFixed(0) : `N/A`}
                            </small>
                        </td>
                        <td>
                            <small class="font-weight-lighter jstooltip" title="${ts.getHours()}h${ts.getMinutes()}'${ts.getSeconds()}">
                                ${((now - tag.last.ts) / 1000).toFixed(0)}
                            </small>
                            ${mediants ? `
                                <br>
                                <small class="font-weight-lighter jstooltip" title="${mediants.getHours()}h${mediants.getMinutes()}'${mediants.getSeconds()}">
                                    <em>${moment(mediants).fromNow(true)}</em>
                                </small>
                            ` : ``}
                            ${firstts ? `
                                <br>
                                <small class="font-weight-lighter jstooltip" title="${firstts.getHours()}h${firstts.getMinutes()}'${firstts.getSeconds()}">
                                    <em>${moment(firstts).fromNow(true)}</em>
                                </small>
                            ` : ``}
                        </td>
                        <td class="text-center">
                            <small class="font-weight-lighter">
                            ${app.tagTargets && app.tagTargets[tag.id] ? `
                                <span class="jstooltip" title="${app.tagTargets[tag.id].map(target => {
                                    return `${target.name} (${target.type})`;
                                }).join(`, `)}">
                                    <i class="fal fa-database"></i>
                                    <span class="badge badge-light">${app.tagTargets[tag.id].length}</span>
                                <span>
                            ` : `-`}
                            </small>
                        </td>
                    </tr>
                `;
            }).join(``)}
        </table>
        `;
    }

    tpl.targets = (targets) => {
        // const now = Date.now();
        return `
            <div class="mt-4">
                <div class="dropdown">
                    <button class="btn ${btn.color} dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-plus"></i> Target
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                        ${app.config.targets.map(target => {
                            return `
                                <a class="dropdown-item add-target" data-type="${target.type}" href="#">${target.label}</a>
                            `;
                        }).join(``)}
                    </div>
                </div>
            </div>
            <div id="edit-panel-target" class="my-4"></div>
            <div id="table-tags">
            ${targets.length ? `
                <table class="table table-sm font-weight-lighter">
                    <tr>
                        <td>
                            <small>Name</small>
                        </td>
                        <td>
                            <small>Type</small>
                        </td>
                        <td>
                            <small>Measurement</small>
                        </td>
                        <td>
                            <small>Interval</small>
                        </td>
                        <td>
                            <small>Tags</small>
                        </td>
                        <td class="text-center">
                            <small>Actions</small>
                        </td>
                    </tr>
                    ${targets.map(target => {
                        return `
                        <tr>
                            <td>
                                <span class="jstooltip mr-1 ${1 * target.enable ? `text-success` : `text-danger`}" title="${1 * target.enable ? `enable` : `disable`}">
                                    <i class="fas fa-scrubber fa-sm"></i>
                                </span>
                                ${target.name}
                            </td>
                            <td>
                                <small class="font-weight-lighter">
                                    ${(app.config.targets.find(t => {
                                        return `${target.type}` === `${t.type}`;
                                    })).label}
                                </small>
                            </td>
                            <td>
                                <small class="font-weight-lighter">
                                    ${target.measurement || `n/a`}
                                </small>
                            </td>
                            <td>
                                <small class="font-weight-lighter">
                                    ${1 * target.interval === 0 ? `live` : target.interval}
                                </small>
                            </td>
                            <td>
                                ${target.tags ? Object.keys(target.tags).map(id => {
                                    const tag = target.tags[id];
                                    const measures = Object.keys(tag.measures).length;
                                    const title = Object.keys(tag.measures).map(measure => {
                                        return `${tag.measures[measure].label} (${tag.measures[measure].field})`;
                                    }).join(`, `)
                                    return `
                                    <small class="font-weight-lighter ml-4 mr-4 jstooltip float-right" title="${title}">
                                        ${measures} measure${measures > 1 ? `s` : ``}
                                    </small>
                                    <div class="mb-1">
                                        <small>
                                            ${tag.name}
                                        </small>
                                        <small class="font-weight-lighter">
                                            <br><em>${tag.field}</em>
                                        </small>
                                    </div>
                                    `;
                                }).join(``) : `-`}
                            </td>
                            <td class="text-center">
                                <a href="#" class="btn ${btn.delete} delete-target mr-2" data-id="${target.id}">
                                    Delete
                                </a>
                                <a href="#" class="btn ${btn.color} edit-target" data-id="${target.id}">
                                    Edit
                                </a>
                                <div style="display: none;">
                                    <pre>${JSON.stringify(target, null, 2)}</pre>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join(``)}
                </table>
            ` : ``}
            </div>
        `;
    };

    const fieldValue = (field, data) => {
        return data[field] !== undefined ? data[field] : ``;
    };

    tpl.field = {
        text: (field, data) => {
            return `<input type="text" name="${field}" value="${fieldValue(field, data)}" class="form-control form-control-sm">`;
        },
        number: (field, data) => {
            return `<input type="number" name="${field}" value="${fieldValue(field, data)}" class="form-control form-control-sm">`;
        },
        json: (field, data) => {
            return `<textarea name="${field}" class="form-control form-control-sm">${fieldValue(field, data)}</textarea>`;
        },
    };

    tpl.target = (data) => {
        const target = app.config.targets.find(target => {
            return target.type === data.type;
        });
        if (data.enable === undefined || data.enable === ``) {
            data.enable = 0
        }
        if (data.interval === undefined || data.interval === ``) {
            data.interval = 60
        }
        if (data.tags === undefined) {
            data.tags = {};
        }
        const col_left = 4;
        const col_right = (12 - col_left);
        return `
            <div class="mt-2">
                <a href="#" class="btn ${btn.color} close-edit-target">
                    Cancel
                </a>
                <a href="#" class="btn ${btn.color} save-target">
                    Save
                </a>
            </div>
            <div class="row mt-4">
                <div class="col-4">
                    <form id="form-target">
                        <input type="hidden" name="type" value="${data.type}">
                        ${data.id !== undefined ? `
                            <input type="hidden" name="id" value="${data.id}">
                        ` : ``}
                        <div class="form-group row">
                            <label class="col-sm-${col_left}">
                                ${target.label}
                            </label>
                            <div class="col-sm-${col_right}">
                                <div class="custom-control custom-radio custom-control-inline">
                                    <input type="radio" name="enable" id="target-enable-1" class="custom-control-input" value="1" ${`${data.enable}` === `1` ? `checked` : ``}>
                                    <label class="custom-control-label" for="target-enable-1">Enable</label>
                                </div>
                                <div class="custom-control custom-radio custom-control-inline">
                                    <input type="radio" name="enable" id="target-enable-2" class="custom-control-input" value="0" ${`${data.enable}` === `0` ? `checked` : ``}>
                                    <label class="custom-control-label" for="target-enable-2">Disable</label>
                                </div>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-${col_left} col-form-label-sm">
                                Name
                            </label>
                            <div class="col-sm-${col_right}">
                                ${tpl.field.text(`name`, data)}
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-${col_left} col-form-label-sm">
                                Interval
                            </label>
                            <div class="col-sm-${col_right}">
                                ${tpl.field.number(`interval`, data)}
                            </div>
                        </div>
                        ${target.config.map(config => {
                            return `
                            <div class="form-group row">
                                <label class="col-sm-${col_left} col-form-label-sm">
                                    ${config.label || config.name}
                                </label>
                                <div class="col-sm-${col_right}">
                                    ${tpl.field[config.type || `text`](config.name, data)}
                                </div>
                            </div>
                            `;
                        }).join(``)}
                        ${target.measurement ? `
                            <div class="form-group row">
                                <label class="col-sm-${col_left} col-form-label-sm">
                                    measurement
                                </label>
                                <div class="col-sm-${col_right}">
                                    <select name="measurement" class="custom-select custom-select-sm">
                                        <option value="tag" ${data.measurement === `tag` ? `selected` : ``}>Tag</option>
                                        <option value="measure" ${data.measurement === `measure` ? `selected` : ``}>Measure</option>
                                        <option value="both" ${data.measurement === `both` ? `selected` : ``}>Both</option>
                                    </select>
                                </div>
                            </div>
                        ` : ``}
                    </form>
                </div>
                <div class="col-8">
                    ${tpl.tagsNotFound(data)}
                </div>
            </div>
        `;
        // <pre>${JSON.stringify(target.config, null, 2)}</pre>
        // <pre>${JSON.stringify(data.tags, null, 2)}</pre>
    };

    tpl.tagsNotFound = (data) => {
        // not found saved tags
        const tagsNotFound = {};
        for (const tagId in data.tags) {
            tagsNotFound[`${tagId}`] = data.tags[tagId];
        }
        for (const tagFound of app.tags) {
            if (tagsNotFound[`${tagFound.id}`]) {
                delete tagsNotFound[`${tagFound.id}`];
            }
        }
        return `
            <p>Tags</p>
            ${app.tags.map(tag => {
                return `${tpl.tag(tag, data.tags[tag.id])}`;
            }).join(``)}
            ${Object.keys(tagsNotFound).length ? `
            <div class="mb-2 font-weight-lighter font-italic">
                Tags saved but not found
            </div>
            ${Object.keys(tagsNotFound).map(tag => {
                return `
                    <div class="mb-1" id="tag-notfound-${tag}">
                        <a href="#" class="remove-tag-notfound mr-2 text-dark" data-id="${tag}"><i class="fas fa-trash fa-sm"></i></a>
                        ${tagsNotFound[tag].name}
                        <small class="font-weight-lighter font-italic">
                            - ${tagsNotFound[tag].field}
                            <br>
                            ${tag}
                            <br>
                            ${Object.keys(tagsNotFound[tag].measures).map(measure => {
                                return `
                                    ${tagsNotFound[tag].measures[measure].label}
                                    <small class="font-weight-lighter font-italic">
                                        (${tagsNotFound[tag].measures[measure].field})
                                    </small>
                                `
                            }).join(`, `)}
                        </small>
                    </div>
                `;
            }).join(``)}
            ` : ``}
            <textarea id="tags-notfound" style="display:none;">${JSON.stringify(tagsNotFound)}</textarea>
        `;
    };

    const tagFieldValue = ({tag, field, measure, data}) => {
        let value = ``;
        if (data) {
            if (measure) {
                if (data.measures && data.measures[measure.field] && data.measures[measure.field][field] !== undefined) {
                    value = data.measures[measure.field][field];
                }
            } else {
                if (data[field] !== undefined) {
                    value = data[field];
                }
            }
        }
        if (value === ``) {
            // defaults
            if (measure) {
                if (measure && measure[field] && measure[field] !== undefined) {
                    value = measure[field];
                }
            } else {
                if (tag[field] !== undefined) {
                    value = tag[field];
                }
            }
        }
        return value;
    };

    tpl.tagField = ({tag, field, measure, data}) => {
        // console.log({
        //     tag,
        //     field,
        //     data,
        //     measure,
        // });
        let name = `field-tag-${tag.id}`;
        let classes = `tag-field`;
        if (measure) {
            name += `-measure-${measure.field}`;
            classes += `-measure`;
        }
        name += `-field-${field}`;
        const value = tagFieldValue({tag, field, measure, data});
        return `<input type="text" value="${value}" id="${name}" name="${name}"
         data-id="${tag.id}" data-field="${field}" ${measure ? `data-measure="${measure.field}"` : ``}
         class="form-control form-control-sm ${classes}">`;
    };

    tpl.tag = (tag, data) => {
        tag.name = tag.name || `RuuviTag ${tag.id}`;
        tag.field = tag.field || `ruuvitag_${tag.id}`;
        const col_left = 2;
        const col_right = (12 - col_left);
        // console.log(data);
        return `
        <div id="panel-tag-${tag.id}">
            <div class="custom-control custom-switch">
                <input type="checkbox" ${data ? `checked`: ``} class="custom-control-input enable-tag"
                 data-id="${tag.id}" id="enable-tag-${tag.id}">
                <label class="custom-control-label" for="enable-tag-${tag.id}">
                    <span id="show-tag-${tag.id}">
                        <span class="jstooltip" title="${tag.id}" id="tag-${tag.id}-name-display">
                            ${tagFieldValue({tag, field: `name`, data})}
                        </span>
                        <small class="font-weight-lighter font-italic">
                            -
                            <span class="jstooltip" title="${tag.id}" id="tag-${tag.id}-field-display">
                                ${tagFieldValue({tag, field: `field`, data})}
                            </span>
                            <a href="#" class="open-edit-tag ml-2 text-dark" data-id="${tag.id}">
                                <i class="fas fa-cog"></i>
                            </a>
                        </small>
                    </span>
                </label>
            </div>
            <div class="row" id="config-tag-${tag.id}" style="display: none;">
                <div class="col-5">
                    <div class="form-group row">
                        <label class="col-sm-${col_left} col-form-label-sm">
                            Name
                        </label>
                        <div class="col-sm-${col_right}">
                            ${tpl.tagField({
                                tag,
                                field: `name`,
                                data: data,
                            })}
                        </div>
                    </div>
                </div>
                <div class="col-5">
                    <div class="form-group row">
                        <label class="col-sm-${col_left} col-form-label-sm">
                            Field
                        </label>
                        <div class="col-sm-${col_right}">
                            ${tpl.tagField({
                                tag,
                                field: `field`,
                                data: data,
                            })}
                        </div>
                    </div>
                </div>
                <div class="col-2">
                    <a href="#" class="close-edit-tag text-dark ml-2" data-id="${tag.id}">
                        <i class="fas fa-check-circle"></i>
                    </a>
                </div>
            </div>
            <form id="form-tag-${tag.id}" class="pt-2" ${data ? ``: `style="display: none;`}">
                <div class="">
                    Measures
                </div>
                ${app.config.measures.map(measure => {
                    let last = `-`;
                    if (tag[measure.field]) {
                        last = tag[measure.field];
                    } else if (tag.last) {
                        last = tag.last[measure.field];
                    }
                    if (last && measure.toFixed !== undefined) {
                        last = last.toFixed(measure.toFixed);
                    }
                    return `
                    <div class="row" id="panel-tag-${tag.id}-measure-${measure.field}">
                        <div class="col-8">
                            <div class="custom-control custom-switch">
                                <input type="checkbox" ${data && data.measures && data.measures[measure.field] ? `checked`: ``}
                                 class="custom-control-input enable-tag-measure"
                                 data-id="${tag.id}" data-measure="${measure.field}" id="enable-tag-${tag.id}-measure-${measure.field}">
                                <label class="custom-control-label" for="enable-tag-${tag.id}-measure-${measure.field}">
                                    <span id="show-tag-${tag.id}-measure-${measure.field}">
                                        <span id="tag-${tag.id}-measure-${measure.field}-label-display">
                                            ${tagFieldValue({tag, field: `label`, measure, data})}
                                        </span>
                                        <small class="font-weight-lighter font-italic">
                                            -
                                            <span id="tag-${tag.id}-measure-${measure.field}-field-display">
                                                ${tagFieldValue({tag, field: `field`, measure, data})} (${measure.label})
                                            </span>
                                            <a href="#" class="open-edit-tag-measure ml-2 text-dark" data-id="${tag.id}" data-measure="${measure.field}">
                                                <i class="fas fa-cog"></i>
                                            </a>
                                        </small>
                                    </span>
                                    <span id="config-tag-${tag.id}-measure-${measure.field}" style="display: none;">
                                        <div class="row">
                                            <div class="col-5">
                                                <div class="form-group row">
                                                    <label class="col-sm-${col_left} col-form-label-sm">
                                                        Name
                                                    </label>
                                                    <div class="col-sm-${col_right}">
                                                        ${tpl.tagField({
                                                            tag,
                                                            field: `label`,
                                                            measure,
                                                            data: data,
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-5">
                                                <div class="form-group row">
                                                    <label class="col-sm-${col_left} col-form-label-sm">
                                                        Field
                                                    </label>
                                                    <div class="col-sm-${col_right}">
                                                        ${tpl.tagField({
                                                            tag,
                                                            field: `field`,
                                                            measure,
                                                            data: data,
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-2">
                                                <a href="#" class="close-edit-tag-measure text-dark ml-2" data-id="${tag.id}" data-measure="${measure.field}">
                                                    <i class="fas fa-check-circle"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div class="col-3 text-right">
                            ${last} ${measure.unit ? `${measure.unit}` : ``}
                        </div>
                    </div>
                    `;
                }).join(``)}
            </form>
        </div>
        <hr>
        `;
        // <pre>${JSON.stringify(tag, null, 2)}</pre>
    };

    $page.on(`click`, `.open-edit-tag-measure`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        const measure = $element.data(`measure`);
        $(`#show-tag-${id}-measure-${measure}`).hide();
        $(`#config-tag-${id}-measure-${measure}`).show();
    });

    $page.on(`click`, `.close-edit-tag-measure`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        const measure = $element.data(`measure`);
        const name = $(`#field-tag-${id}-measure-${measure}-field-label`).val();
        const field = $(`#field-tag-${id}-measure-${measure}-field-field`).val();
        $(`#tag-${id}-measure-${measure}-label-display`).html(name);
        $(`#tag-${id}-measure-${measure}-field-display`).html(field);
        $(`#config-tag-${id}-measure-${measure}`).hide();
        $(`#show-tag-${id}-measure-${measure}`).show();
    });

    $page.on(`click`, `.open-edit-tag`, (e) => {
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        $(`#config-tag-${id}`).show();
    });

    $page.on(`click`, `.close-edit-tag`, (e) => {
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        const name = $(`#field-tag-${id}-field-name`).val();
        const field = $(`#field-tag-${id}-field-field`).val();
        $(`#tag-${id}-name-display`).html(name);
        $(`#tag-${id}-field-display`).html(field);
        $(`#config-tag-${id}`).hide();
    });

    $page.on(`change`, `.enable-tag`, (e) => {
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        const enable = $element[0].checked;
        if (enable) {
            $(`#form-tag-${id}`).show();
        } else {
            $(`#form-tag-${id}`).hide();
        }
    });

    $page.on(`click`, `.add-target`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        $(`#edit-panel-target`).html(tpl.target($element.data()));
    });

    $page.on(`click`, `.edit-target`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        const target = app.targets.find(target => {
            return `${target.id}` === `${id}`;
        });
        $(`#table-tags`).hide();
        $(`#edit-panel-target`).html(tpl.target(target));
    });

    $page.on(`click`, `.close-edit-target`, (e) => {
        e.preventDefault();
        $(`#table-tags`).show();
        $(`#edit-panel-target`).html(``);
    });

    $page.on(`click`, `.save-target`, (e) => {
        e.preventDefault();
        const tags = {};
        $(`.enable-tag`).each((i, element) => {
            if (element.checked === true) {
                const id = $(element).data(`id`);
                tags[`${id}`] = {
                    id,
                    measures: {},
                };
                $(`#panel-tag-${id}`).find(`.tag-field`).each((i, input) => {
                    const $input = $(input);
                    const data = $input.data();
                    tags[`${id}`][`${data.field}`] = $input.val();
                });
                $(`#panel-tag-${id}`).find(`.enable-tag-measure`).each((i, checkbox) => {
                    if (checkbox.checked === true) {
                        const measure = $(checkbox).data(`measure`);
                        tags[`${id}`].measures[`${measure}`] = {};
                        $(`#panel-tag-${id}-measure-${measure}`).find(`.tag-field-measure`).each((i, input) => {
                            const $input = $(input);
                            const data = $input.data();
                            tags[`${id}`].measures[`${measure}`][`${data.field}`] = $input.val();
                        });
                    }
                });
            }
        });
        const target = {};
        const form = $(`#form-target`).serializeArray();
        for (const { name, value } of form) {
            target[name] = value;
        }
        let tagsNotFound = {};
        try {
            tagsNotFound = JSON.parse($(`#tags-notfound`).val());
        } catch(e) {}
        for (const tagId in tagsNotFound) {
            tags[tagId] = tagsNotFound[tagId];
        }
        target.tags = tags;
        $.post(`${root}target`, target, (targets) => {
            tagTargets(targets);
            showTargets();
        });
    });

    $page.on(`click`, `.remove-tag-notfound`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        const $tagsNotFound = $(`#tags-notfound`);
        let tagsNotFound = {};
        try {
            tagsNotFound = JSON.parse($tagsNotFound.val());
        } catch(e) {}
        try {
            delete tagsNotFound[id];
        } catch(e) {}
        $tagsNotFound.val(JSON.stringify(tagsNotFound));
        $(`#tag-notfound-${id}`).remove();
    });

    $page.on(`click`, `.delete-target`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        if (confirm(`Delete target "${app.targets[1 * id].name}"?`)) {
            $.post(`${root}target/delete`, { id }, (targets) => {
                tagTargets(targets);
                showTargets();
            });
        };
    });

    const showTargets = () => {
        $targets.html(tpl.targets(app.targets));
        $targets.find(`.jstooltip`).tooltip({});
    };

    const tagTargets = (targets) => {
        app.targets = targets;
        app.tagTargets = {};
        for (const target of app.targets) {
            if (target.tags) {
                for (const tagId in target.tags) {
                    if (app.tagTargets[tagId] === undefined) {
                        app.tagTargets[tagId] = []
                    }
                    app.tagTargets[tagId].push(target)
                }
            }
        }
    };
    const refreshTargets = () => {
        $.get(`${root}targets`, (targets) => {
            tagTargets(targets);
            showTargets();
        });
    }

    const refreshTags = () => {
        $.get(`${root}tags`, (tags) => {
            // console.log(tags);
            app.tags = tags.map(tag => {
                tag.id = tag.id || (tag.last ? tag.last.id : null);
                return tag;
            });
            const now = Date.now();
            $tags.html(tpl.tags(tags));
            $tags.find(`.jstooltip`).tooltip({});
        });
    }

    $page.on(`click`, `.refresh-tags`, (e) => {
        e.preventDefault();
        refreshTags();
    });

    tpl.sampling = (data) => {
        const col_left = 6;
        const col_right = 6;
        return `
            <em>Sampling configuration</em>
            <div class="row mt-4">
                <div class="col-8">
                    <form id="form-sampling">
                        <div class="form-group row">
                            <label class="col-sm-${col_left} col-form-label-sm">
                                History
                            </label>
                            <div class="col-sm-${col_right}">
                                ${tpl.field.number(`history`, data)}
                                <small id="passwordHelpBlock" class="form-text text-muted">
                                    <em>Max samples in history</em>
                                </small>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-${col_left} col-form-label-sm">
                                Interval
                            </label>
                            <div class="col-sm-${col_right}">
                                ${tpl.field.number(`interval`, data)}
                                <small id="passwordHelpBlock" class="form-text text-muted">
                                    <em>Sampling interval (in ms)</em>
                                </small>
                            </div>
                        </div>
                    </form>
                    <a href="#" class="btn ${btn.color} save-sampling">
                        Save
                    </a>
                </div>
            </div>
        `;
    };

    $page.on(`click`, `.save-sampling`, (e) => {
        e.preventDefault();
        $.post(`${root}sampling`, $(`#form-sampling`).serialize(), (result) => {
            showConfig();
        });
    });

    const showConfig = () => {
        const data = JSON.parse($(`#sampling-json`).val());
        $config.html(tpl.sampling(data));
        $config.find(`.jstooltip`).tooltip({});
    };

    refreshTags();
    refreshTargets();
    showConfig();

    // setInterval(refreshTags, 3000);

    $header.find(`.jstooltip`).tooltip({});

});
