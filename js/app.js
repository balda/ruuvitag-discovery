// console.log(`OK`);
$('body').ready(() => {

    const root = $(`base`).attr(`href`);
    const $page = $(`#page`);
    app.ruuvitags = JSON.parse($(`#ruuvitags-json`).val());

    app.serializeForm = ($form) => {
        const form = {};
        for (const param of $form.serializeArray()) {
            form[param.name] = param.value;
        }
        return form;
    };

    const $header = $(`#header`);
    const $content = $(`#content`);
    const $tags = $(`#tags`);
    const $targets = $(`#targets`);

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
        $(`#table-tags`).hide();
        $(`#edit-panel-target`).html(app.tpl.target($element.data()));
    });

    $page.on(`click`, `.edit-target`, (e) => {
        e.preventDefault();
        const $element = $(e.currentTarget);
        const id = $element.data(`id`);
        const target = app.targets.find(target => {
            return `${target.id}` === `${id}`;
        });
        $(`#table-tags`).hide();
        $(`#edit-panel-target`).html(app.tpl.target(target));
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

    app.showTags = () => {
        $tags.html(app.tpl.tags());
        $tags.find(`.jstooltip`).tooltip({
            html: true,
        });
    };

    const showTargets = () => {
        $targets.html(app.tpl.targets(app.targets));
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

    $page.on(`click`, `.refresh-tags`, (e) => {
        e.preventDefault();
        refreshTags();
    });

    const refreshTargets = () => {
        return $.get(`${root}targets`, (targets) => {
            tagTargets(targets);
            showTargets();
        });
    }

    const refreshTags = () => {
        return $.get(`${root}tags`, (tags) => {
            // console.log(tags);
            app.tags = tags.map(tag => {
                tag.id = tag.id || (tag.last ? tag.last.id : null);
                return tag;
            });
            app.showTags();
        });
    }

    // refreshTags();
    refreshTargets().then(() => {
        refreshTags();
    });

    // setInterval(refreshTags, 3000);

    $header.find(`.jstooltip`).tooltip({});

    // app.config.attributes = [
    //     {
    //         field: `id`,
    //         label: `RuuviTag ID`,
    //     }, {
    //         field: `dataFormat`,
    //         label: `Data Format`,
    //         measure: `last`,
    //     }, {
    //         field: `rssi`,
    //         label: `RSSI`,
    //         measure: `last`,
    //     }, {
    //         field: `ts`,
    //         label: `Last Seen`,
    //         measure: `last`,
    //     }, {
    //         field: `frequency`,
    //         label: `Frequency`,
    //         toFixed: 1,
    //     }, {
    //         field: `period`,
    //         label: `Period`,
    //         toFixed: 0,
    //     }
    // ];

});
