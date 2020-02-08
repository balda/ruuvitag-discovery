app.tpl.config = ({sampling, battery}) => {
    const col_left = 5;
    const col_right = 6;
    return `
        <div class="row">
            <div class="col-4">
                <small>Sampling configuration</small>
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
                <small>Battery level configuration</small>
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
    `;
};
