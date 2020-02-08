app.fieldValue = (field, data) => {
    return data[field] !== undefined ? data[field] : ``;
};

app.tpl.field = {
    text: (field, data) => {
        return `<input type="text" name="${field}" value="${app.fieldValue(field, data)}" class="form-control form-control-sm">`;
    },
    number: (field, data) => {
        return `<input type="number" name="${field}" value="${app.fieldValue(field, data)}" class="form-control form-control-sm">`;
    },
    json: (field, data) => {
        return `<textarea name="${field}" class="form-control form-control-sm">${app.fieldValue(field, data)}</textarea>`;
    },
};
