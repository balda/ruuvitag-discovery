<script>
    import { api, cols } from './../store/api.js';
	import { config } from './../store/config.js';
	import { targets } from './../store/targets.js';
    import { FormGroup, CustomInput, Label, Row, Col } from 'sveltestrap';
    let configEdited = JSON.parse(JSON.stringify($config));
    let col_left = 5;
    let col_right = 6;
    let state = `view`; // `view` | `saving`
    let editSampling = false;
    let editBattery = false;
    let saving = ``;
    let stateConfig = `hidden`; // `hidden` | `export` | `export`
    function save(target) {
        return async function() {
            state = `saving`;
            saving = target;
            stateConfig = `hidden`;
            const data = {};
            data[`${target}`] = configEdited[target];
            try {
                await api.post(`config`, data);
                $config[target] = configEdited[target];
            } catch(error) {
                console.log(error);
            }
            state = `view`;
            editSampling = false;
            editBattery = false;
        }
    }
</script>

<Row class="pt-2">
    <Col xs="4">
        <small class="px-2 py-1 bg-light">
            Sampling Configuration
        </small>
        <div class="pl-2">
            {#if editSampling}
                <form id="form-sampling" class="mt-4" disabled>
                    <div class="form-group row">
                        <label class="col-sm-{col_left} col-form-label-sm">
                            History
                        </label>
                        <div class="col-sm-{col_right}">
                            <input type="number" name="history"
                             bind:value="{configEdited.sampling.history}"
                             class="form-control form-control-sm"
                             disabled={state === `saving` ? `disabled` : null}
                            >
                            <small class="form-text text-muted">
                                <em>Max samples in history</em>
                            </small>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-{col_left} col-form-label-sm">
                            Sampling interval
                        </label>
                        <div class="col-sm-{col_right}">
                            <input type="number" name="interval"
                             bind:value="{configEdited.sampling.interval}"
                             class="form-control form-control-sm"
                             disabled={state === `saving` ? `disabled` : null}
                            >
                            <small class="form-text text-muted">
                                <em>Sampling interval (in ms)</em>
                            </small>
                        </div>
                    </div>
                </form>
                {#if state === `saving` && saving === `sampling`}
                    <div>
                        Saving ...
                    </div>
                {:else}
                    <a href="/" on:click|preventDefault={() => {editSampling = false}} class="btn btn-light btn-sm mr-4">
                        Cancel
                    </a>
                    <a href="/" on:click|preventDefault={save(`sampling`)}
                     class="btn btn-light btn-sm {state === `saving` ? `disabled` : null}"
                    >
                        Save
                    </a>
                {/if}
            {:else}
                <div class="small py-1">
                    <div class="mt-2 mb-2">
                        History: {$config.sampling.history}
                        <div class="font-italic font-weight-lighter">
                            Max samples in history
                        </div>
                    </div>
                    <div class="mb-4">
                        Sampling interval: {$config.sampling.interval}
                        <div class="font-italic font-weight-lighter">
                            Sampling interval (in ms)
                        </div>
                    </div>
                </div>
                <div>
                    <a href="/" on:click|preventDefault={() => {editSampling = true}} class="btn btn-light btn-sm">
                        Edit
                    </a>
                </div>
            {/if}
        </div>
    </Col>
    <Col xs="4">
        <small class="px-2 py-1 bg-light">
            Battery Level Configuration
        </small>
        <div class="pl-2">
            {#if editBattery}
                <form id="form-battery" class="mt-4" disabled>
                    <div class="form-group row">
                        <label class="col-sm-{col_left} col-form-label-sm">
                            Min (1%)
                        </label>
                        <div class="col-sm-{col_right}">
                            <input type="number" name="min"
                             bind:value="{configEdited.battery.min}"
                             class="form-control form-control-sm"
                             disabled={state === `saving` ? `disabled` : null}
                            >
                            <small class="form-text text-muted">
                                <em>Min mV for 1% battery level</em>
                            </small>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-{col_left} col-form-label-sm">
                            Max (100%)
                        </label>
                        <div class="col-sm-{col_right}">
                            <input type="number" name="max"
                             bind:value="{configEdited.battery.max}"
                             class="form-control form-control-sm"
                             disabled={state === `saving` ? `disabled` : null}
                            >
                            <small class="form-text text-muted">
                                <em>Max mV for 100% battery level</em>
                            </small>
                        </div>
                    </div>
                </form>
                {#if state === `saving` && saving === `battery`}
                    <div>
                        Saving ...
                    </div>
                {:else}
                    <a href="/" on:click|preventDefault={() => {editBattery = false}} class="btn btn-light btn-sm mr-4">
                        Cancel
                    </a>
                    <a href="/" on:click|preventDefault={save(`battery`)}
                     class="btn btn-light btn-sm {state === `saving` ? `disabled` : null}"
                    >
                        Save
                    </a>
                {/if}
            {:else}
                <div class="small py-1">
                    <div class="mt-2 mb-2">
                        Min (1%): {$config.battery.min}
                        <div class="font-italic font-weight-lighter">
                            Min mV for 1% battery level
                        </div>
                    </div>
                    <div class="mb-4">
                        Max (100%): {$config.battery.max}
                        <div class="font-italic font-weight-lighter">
                            Max mV for 100% battery level
                        </div>
                    </div>
                </div>
                <div>
                    <a href="/" on:click|preventDefault={() => {editBattery = true}} class="btn btn-light btn-sm">
                        Edit
                    </a>
                </div>
            {/if}
        </div>
    </Col>
</Row>
<Row class="border-top pt-3 mt-3">
    <Col xs="8">
        <a href="/" on:click|preventDefault={() => {stateConfig = `export`}}
         class="btn btn-sm mr-2 btn-light btn-sm">
            Export Configuration
        </a>
        <a href="/" on:click|preventDefault={() => {stateConfig = `import`}}
         class="btn btn-sm mr-2 btn-light btn-sm">
            Import Configuration
        </a>
        {#if stateConfig === `import`}
            <a href="/" on:click|preventDefault={() => {stateConfig = `hidden`}}
             class="float-right ml-2 btn btn-sm btn-light btn-sm">
                Save Configuration
            </a>
        {/if}
        {#if stateConfig !== `hidden`}
            <a href="/" on:click|preventDefault={() => {stateConfig = `hidden`}}
             class="float-right ml-2 btn btn-sm btn-light btn-sm">
                Cancel
            </a>
        {/if}
        {#if stateConfig !== `hidden`}
            <div class="mt-3">
                <small><textarea class="form-control form-control-sm" readonly={stateConfig === `export`} rows="16">{JSON.stringify({
                    sampling: $config.sampling,
                    battery: $config.battery,
                    ruuvitags: $config.ruuvitags,
                    targets: $targets,
                    columns: $config.columns,
                }, null, 2)}</textarea></small>
            </div>
        {/if}
    </Col>
</Row>
