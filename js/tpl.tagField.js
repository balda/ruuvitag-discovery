app.tagFieldValue = ({tag, field, measure, data}) => {
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

app.tpl.tagField = ({tag, field, measure, data}) => {
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
    const value = app.tagFieldValue({tag, field, measure, data});
    return `<input type="text" value="${value}" id="${name}" name="${name}"
     data-id="${tag.id}" data-field="${field}" ${measure ? `data-measure="${measure.field}"` : ``}
     class="form-control form-control-sm ${classes}">`;
};
