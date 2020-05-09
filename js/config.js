app.tpl.config = ({sampling, battery}) => {
    const col_left = 5;
    const col_right = 6;
    return `
        <div class="row">
            <div class="col-4">
                <small class="px-2 py-1 bg-light">
                    Sampling Configuration
                </small>
                <form id="form-sampling" class="mt-4">
                    <div class="form-group row">
                        <label class="col-sm-${col_left} col-form-label-sm">
                            History
                        </label>
                        <div class="col-sm-${col_right}">
                            ${app.tpl.field.number(`history`, sampling)}
                            <small id="passwordHelpBlock" class="form-text text-muted">
                                <em>Max samples in history</em>
                            </small>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-${col_left} col-form-label-sm">
                            Sampling interval
                        </label>
                        <div class="col-sm-${col_right}">
                            ${app.tpl.field.number(`interval`, sampling)}
                            <small id="passwordHelpBlock" class="form-text text-muted">
                                <em>Sampling interval (in ms)</em>
                            </small>
                        </div>
                    </div>
                </form>
                <a href="#" class="btn ${app.btn.color} save-sampling">
                    Save
                </a>
            </div>
            <div class="col-4">
                <small class="px-2 py-1 bg-light">
                    Battery Level Configuration
                </small>
                <form id="form-battery" class="mt-4">
                    <div class="form-group row">
                        <label class="col-sm-${col_left} col-form-label-sm">
                            Min (1%)
                            <small class="form-text text-muted">
                                <em>
                                    <span class="font-weight-lighter">default 2500mV</span>
                                </em>
                            </small>
                        </label>
                        <div class="col-sm-${col_right}">
                            ${app.tpl.field.number(`min`, battery)}
                            <small class="form-text text-muted">
                                <em>
                                    Min mV for 1% battery level
                                </em>
                            </small>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-${col_left} col-form-label-sm">
                            Max (100%)
                            <small class="form-text text-muted">
                                <em>
                                    <span class="font-weight-lighter">default 3000mV</span>
                                </em>
                            </small>
                        </label>
                        <div class="col-sm-${col_right}">
                            ${app.tpl.field.number(`max`, battery)}
                            <small class="form-text text-muted">
                                <em>
                                    Max mV for 100% battery level
                                </em>
                            </small>
                        </div>
                    </div>
                </form>
                <a href="#" class="btn ${app.btn.color} save-battery">
                    Save
                </a>
            </div>
        </div>
        <div class="row border-top pt-3 mt-3">
            <div class="col-8">
                <a href="#" class="btn btn-sm mr-2 ${app.btn.color} export-import-config" data-action="export">
                    Export Configuration
                </a>
                <a href="#" class="btn btn-sm mr-2 ${app.btn.color} export-import-config" data-action="import">
                    Import Configuration
                </a>
                <a href="#" class="float-right ml-2 btn btn-sm ${app.btn.color} save-config" style="display:none;">
                    Save Configuration
                </a>
                <a href="#" class="float-right ml-2 btn btn-sm ${app.btn.color} cancel-config" style="display:none;">
                    Cancel
                </a>
                <div id="export-import-config" class="mt-3"></div>
            </div>
        </div>
    `;
};

$('body').ready(() => {
    const root = $(`base`).attr(`href`);
    const $page = $(`#page`);
    const $config = $(`#config`);
    app.sampling = JSON.parse($(`#sampling-json`).val());
    app.battery = JSON.parse($(`#battery-json`).val());

    app.showConfig = () => {
        $config.html(app.tpl.config({
            sampling: app.sampling,
            battery: app.battery,
        }));
        $(`.save-config`).hide();
        $config.find(`.jstooltip`).tooltip({});
    };

    $page.on(`click`, `.export-import-config`, (e) => {
        e.preventDefault();
        const action = $(e.currentTarget).data(`action`);
        const textarea = action === `import` ? `` : `readonly`;
        $(`#export-import-config`).html(`
            <small><textarea id="json-config" class="form-control form-control-sm" rows="16" ${textarea}>${JSON.stringify({
                sampling: app.sampling,
                battery: app.battery,
                ruuvitags: app.ruuvitags,
                targets: app.targets,
            }, null, 2)}</textarea></small>
        `);
        if (action === `import`) {
            $(`.save-config`).show();
        } else {
            $(`.save-config`).hide();
        }
        $(`.cancel-config`).show();
    });

    $page.on(`click`, `.save-sampling`, (e) => {
        e.preventDefault();
        $.post(`${root}config`, {
            sampling: app.serializeForm($(`#form-sampling`)),
        }, (result) => {
            app.sampling = result.sampling;
            $(`#sampling-json`).val(JSON.stringify(app.sampling));
            app.showConfig();
        });
    });

    $page.on(`click`, `.save-battery`, (e) => {
        e.preventDefault();
        $.post(`${root}config`, {
            battery: app.serializeForm($(`#form-battery`)),
        }, (result) => {
            app.battery = result.battery;
            $(`#battery-json`).val(JSON.stringify(app.battery));
            app.showConfig();
        });
    });

    $page.on(`click`, `.save-config`, (e) => {
        e.preventDefault();
        const data = JSON.parse($(`#json-config`).val());
        $.post(`${root}config`, data, (result) => {
            app.sampling = result.sampling;
            app.battery = result.battery;
            app.ruuvitags = result.ruuvitags;
            app.targets = result.targets;
            $(`#sampling-json`).val(JSON.stringify(app.sampling));
            $(`#battery-json`).val(JSON.stringify(app.battery));
            $(`#json-config`).val(JSON.stringify(result));
            app.showConfig();
        });
    });

    $page.on(`click`, `.cancel-config`, (e) => {
        e.preventDefault();
        $(`.save-config`).hide();
        $(`.cancel-config`).hide();
        $(`#export-import-config`).html(``);
    });

    app.showConfig();

});
