app.tpl.target = (data) => {
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
        <div class="mt-1 pt-2 border-top">
            <a href="#" class="btn ${app.btn.color} close-edit-target">
                Cancel
            </a>
            <a href="#" class="btn ${app.btn.color} save-target">
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
                            ${app.tpl.field.text(`name`, data)}
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-${col_left} col-form-label-sm">
                            Interval
                        </label>
                        <div class="col-sm-${col_right}">
                            ${app.tpl.field.number(`interval`, data)}
                        </div>
                    </div>
                    ${target.config.map(config => {
                        return `
                        <div class="form-group row">
                            <label class="col-sm-${col_left} col-form-label-sm">
                                ${config.label || config.name}
                            </label>
                            <div class="col-sm-${col_right}">
                                ${app.tpl.field[config.type || `text`](config.name, data)}
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
                ${app.tpl.tagsNotFound(data)}
            </div>
        </div>
    `;
    // <pre>${JSON.stringify(target.config, null, 2)}</pre>
    // <pre>${JSON.stringify(data.tags, null, 2)}</pre>
};
