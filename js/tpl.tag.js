app.tpl.tag = (tag, data) => {
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
                        ${app.tagFieldValue({tag, field: `name`, data})}
                    </span>
                    <small class="font-weight-lighter font-italic">
                        -
                        <span class="jstooltip" title="${tag.id}" id="tag-${tag.id}-field-display">
                            ${app.tagFieldValue({tag, field: `field`, data})}
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
                        ${app.tpl.tagField({
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
                        ${app.tpl.tagField({
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
                                        ${app.tagFieldValue({tag, field: `label`, measure, data})}
                                    </span>
                                    <small class="font-weight-lighter font-italic">
                                        -
                                        <span id="tag-${tag.id}-measure-${measure.field}-field-display">
                                            ${app.tagFieldValue({tag, field: `field`, measure, data})} (${measure.label})
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
                                                    ${app.tpl.tagField({
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
                                                    ${app.tpl.tagField({
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
