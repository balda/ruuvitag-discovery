app.tpl.tags = (tags) => {
    // console.log(tags);
    const now = Date.now();
    return `
    <div class="my-1">
        <a href="#" class="btn btn-sm ${app.btn.color} refresh-tags">
            <i class="fal fa-sync"></i> Refresh
        </a>
    </div>
    <table class="table table-sm font-weight-lighter">
        <tr>
            ${app.cols.map(col => {
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
                    ${app.cols.map(col => {
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
};
