app.target = {
    getTypeName: (target) => {
        try {
            return (app.config.targets.find(t => {
                return `${target.type}` === `${t.type}`;
            })).label
        } catch(error) {
            console.error(error);
            return `Unknown`;
        }
    },
    getIntervalName: (target) => {
        if (1 * target.interval === 0) {
            return `live`;
        } else {
            return `every ${target.interval} seconds`;
        }
    },
    iconState: (target, classes) => {
        return `
            <span class="jstooltip ${classes ? `${classes}` : ``} ${1 * target.enable ? `text-success` : `text-danger`}"
             title="Target ${1 * target.enable ? `enable` : `disable`}">
                <i class="fas fa-dot-circle fa-sm"></i>
            </span>
        `;
    },
    openModalTag: (target, tag) => {
        const tagConfig = target.tags[tag.id];
        app.modal.show({
            header: `
                RuuviTag
                <span class="font-weight-lighter mx-2">
                    ${tag.id}
                </span>
                |
                ${app.target.iconState(target, `ml-2 mr-1`)}
                Target
                <span class="font-weight-lighter ml-2">
                    ${target.name}
                    <small class="font-weight-lighter font-italic mx-2">
                        ${app.target.getIntervalName(target)}
                    </small>
                </span>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            `,
            body: `
                <div class="container-fluid small">
                <div class="row">
                    <div class="col-md-5">
                        <p><strong>Tag</strong></p>
                        <p class="font-weight-lighter">
                            <strong>Name</strong> ${tagConfig.name}<br>
                            <strong>Field</strong> ${tagConfig.field}<br>
                        </p>
                    </div>
                    <div class="col-md-7">
                        <p><strong>Measures</strong></p>
                        <p class="font-weight-lighter">
                        ${Object.keys(tagConfig.measures).map(measure => {
                            return `
                                <strong>Label</strong> ${tagConfig.measures[measure].label}
                                -
                                <strong>Field</strong> ${tagConfig.measures[measure].field}
                            `;
                        }).join(`<br>`)}
                        </p>
                    </div>
                </div>
            `,
            // <pre>${JSON.stringify(tag, null, 2)}</pre>
            footer: ``,
        });
    },
};
