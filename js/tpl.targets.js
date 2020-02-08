app.tpl.targets = (targets) => {
    // const now = Date.now();
    return `
        <div class="my-1">
            <div class="dropdown">
                <button class="btn ${app.btn.color} dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
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
        <div id="edit-panel-target"></div>
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
                            <a href="#" class="btn ${app.btn.delete} delete-target mr-2" data-id="${target.id}">
                                Delete
                            </a>
                            <a href="#" class="btn ${app.btn.color} edit-target" data-id="${target.id}">
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
