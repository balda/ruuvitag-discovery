app.tpl.tagsNotFound = (data) => {
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
            return `${app.tpl.tag(tag, data.tags[tag.id])}`;
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
