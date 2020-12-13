<script>
    import { cols } from './../store/api.js';
	import { config } from './../store/config.js';
    import {
        Button,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader
    } from 'sveltestrap';
    import Tooltip from './../UI/Tooltip.svelte';
    import { FormGroup, CustomInput, Label, Row, Col } from 'sveltestrap';
    let open = false;
    const toggle = () => (open = !open);
    let col_left = 3;
    let col_right = 8;
    let state = `view`; // `view` | `saving`
    let newCustomColumn = {};
    // $: syncColumns($cols);
    // border rounded bg-light mt-1 pr-2 pl-5 pt-1 pb-2
    const fields = [
        {
            field: `label`,
            label: `Label`,
            help: `Label title`,
        },
        {
            field: `field`,
            label: `Field`,
            help: `Field name`,
        },
        {
            field: `unit`,
            label: `Unit`,
            help: `Unit`,
        },
        {
            field: `accuracy`,
            label: `Accuracy`,
            help: `Accuracy`,
        },
        {
            field: `math`,
            label: `Math`,
            help: `Math Expression`,
        },
    ];
</script>

<Tooltip tip="Custom Columns" bottom >
    <a on:click|preventDefault={toggle} href="/" class="pt-1 pb-1 mt-1 btn btn-light border">
        <i class="fas fa-plus"></i> <small>Custom Columns</small>
    </a>
</Tooltip>
<Modal isOpen={open} {toggle} size="lg">
    <ModalHeader {toggle}>
        Custom Columns
    </ModalHeader>
    <ModalBody>
        <div class="container-fluid">
            <div>
                <pre>{JSON.stringify($config.customColums, null, 2)}</pre>
            </div>
            <div>
                <form id="form-custom-column" class="mt-4" disabled>
                    {#each fields as field}
                        <div class="form-group row">
                            <label class="col-sm-{col_left} col-form-label-sm">
                                {field.label}
                            </label>
                            <div class="col-sm-{col_right}">
                                <input type="text" name="{field.field}"
                                 bind:value="{newCustomColumn[field.field]}"
                                 class="form-control form-control-sm"
                                 disabled={state === `saving` ? `disabled` : null}
                                >
                                <small class="form-text text-muted">
                                    <em>{field.help}</em>
                                </small>
                            </div>
                        </div>
                    {/each}
                </form>
            </div>
        </div>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" outline size="sm" on:click={toggle}>close</Button>
    </ModalFooter>
</Modal>
