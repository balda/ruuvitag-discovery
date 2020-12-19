<script>
    import { api, cols } from './../store/api.js';
	import { config } from './../store/config.js';
    import {
        Table,
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
    let edited = null;
    const fields = [
        {
            field: `label`,
            label: `Label`,
            validate: [`required`],
            error: [`Label is required`],
            // help: `Label title`,
        },
        {
            field: `field`,
            label: `Field name`,
            validate: [`required`, `measureNotExists`],
            error: [`Field name is required`, `This field name already exists`],
            // help: `Field name`,
        },
        {
            field: `unit`,
            label: `Unit`,
            // help: `Unit`,
        },
        {
            field: `accuracy`,
            label: `Accuracy`,
            type: `number`,
            validate: [`integer`],
            error: [`Accuracy must be an integer`],
            help: `Number of decimal`,
        },
        {
            field: `math`,
            label: `Math expression`,
            validate: [`required`],
            error: [`Math expression is required`],
            help: `See <a href="https://mathjs.org/" target="_blank">mathjs.org</a> for syntax.`,
        },
    ];
    let errors = {};
    let customMeasureEdited = {};
    $: if (edited === -1) {
        for (const field of fields) {
            customMeasureEdited[field.field] = field.type === `number` ? 0 : ``;
        }
    }
    const validator = {
        required: (value) => {
            return value !== undefined && value !== ``;
        },
        integer: (value) => {
            return value !== undefined && value !== null && !isNaN(value) && Number.isInteger(value) && value >= 0;
        },
        measureNotExists: (value) => {
            return $cols.map(col => col.field).indexOf(value) === -1;
        },
    };
    function validate() {
        let valid = true;
        errors = {};
        for (const field of fields) {
            if (field.validate) {
                for (let index = 0 ; index < field.validate.length ; index++ ) {
                    if (!validator[field.validate[index]](customMeasureEdited[field.field])) {
                       valid = false;
                       errors[field.field] = field.error[index];
                    }
                }
            }
        }
        return valid;
    };
    function cancel() {
        errors = {};
        edited = null;
    };
    function add() {
        errors = {};
        edited = -1;
    };
    function edit(id) {
        errors = {};
        customMeasureEdited = JSON.parse(JSON.stringify($config.customMeasures.find(customMeasure => 1 * customMeasure.id === 1 * id)));
        edited = id;
    };
    async function save() {
        if (!validate()) {
            return;
        }
        state = `saving`;
        const data = {
            customMeasures: JSON.parse(JSON.stringify($config.customMeasures)),
        };
        if (edited === -1) {
            customMeasureEdited.id = data.customMeasures.length;
            data.customMeasures.push(customMeasureEdited);
        } else {
            data.customMeasures[edited] = customMeasureEdited;
        }
        try {
            await api.post(`config`, data);
            $config.customMeasures = data.customMeasures;
            if (edited === -1) {
                $cols.splice(-1, 0, customMeasureEdited);
                $cols = $cols;
            } else {
                const index = $cols.length - 1 - $config.customMeasures.length + edited;
                for (const field in $cols[index]) {
                    $cols[index][field] = customMeasureEdited[field];
                }
            }
        } catch(error) {
            console.log(error);
        }
        state = `view`;
        edited = null;
    };
    async function del(customMeasure) {
        // state = `saving`;
        if (confirm(`Confirm Delete`)) {
            try {
                const data = {
                    customMeasures: JSON.parse(JSON.stringify($config.customMeasures)),
                };
                data.customMeasures.splice(customMeasure.id, 1);
                await api.post(`config`, data);
                $config.customMeasures = data.customMeasures;
            } catch(error) {
                console.log(error);
            }
        }
        // state = `view`;
    };
    const examples = [
        {
            "label": "Fahrenheit",
            "field": "fahrenheit",
            "math": "(temperature * 9/5) + 32",
            "unit": "°F",
            "accuracy": "2",
        },
        {
            "label": "Kelvin",
            "field": "kelvin",
            "math": "temperature + 273.15",
            "unit": "K",
            "accuracy": "2",
        },
    ];
</script>

<Tooltip tip="Custom Measures" bottom >
    <a on:click|preventDefault={toggle} href="/" class="pt-1 pb-1 mt-1 btn btn-light border">
        <small>Custom Measures</small>
    </a>
</Tooltip>
<Modal isOpen={open} {toggle} size="lg">
    <ModalHeader {toggle}>
        Custom Measures
    </ModalHeader>
    <ModalBody>
        <div class="container-fluid">
            {#if edited !== null}
                <div>
                    <a class="btn btn-light btn-sm mr-2" href="/" on:click|preventDefault={() => cancel()}>
                        Cancel
                    </a>
                    <a class="btn btn-light btn-sm mr-2" href="/" on:click|preventDefault={() => save()}>
                        Save
                    </a>
                </div>
                <div class="row">
                    <div class="col{edited === -1 ? `-8` : ``}">
                        <form id="form-custom-column" class="mt-4">
                            {#each fields as field}
                                <div class="form-group row">
                                    <label class="col-sm-{col_left} col-form-label-sm">
                                        {field.label}
                                        {#if field.help}
                                            <small class="form-text text-muted">
                                                <em>{@html field.help}</em>
                                            </small>
                                        {/if}
                                    </label>
                                    <div class="col-sm-{col_right}">
                                        {#if field.type === `number`}
                                            <input type="number" name="{field.field}"
                                             bind:value="{customMeasureEdited[field.field]}"
                                             class="form-control form-control-sm {errors[field.field] ? `is-invalid` : ``}"
                                             disabled={state === `saving` ? `disabled` : null}
                                            >
                                        {:else if field.field === `math`}
                                            <textarea rows="4"
                                             bind:value="{customMeasureEdited[field.field]}"
                                             class="form-control form-control-sm {errors[field.field] ? `is-invalid` : ``}"
                                             disabled={state === `saving` ? `disabled` : null}
                                            ></textarea>
                                        {:else}
                                            <input type="text" name="{field.field}"
                                             bind:value="{customMeasureEdited[field.field]}"
                                             class="form-control form-control-sm {errors[field.field] ? `is-invalid` : ``}"
                                             disabled={state === `saving` ? `disabled` : null}
                                            >
                                        {/if}
                                        {#if errors[field.field]}
                                            <div class="invalid-feedback">{errors[field.field]}</div>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </form>
                    </div>
                    {#if edited === -1}
                        <div class="col-4">
                            <div class="font-weight-bold">Examples</div>
                            <div class="font-italic">click on the links below to fill some common measures</div>
                            {#each examples as example}
                                <div class="mt-2">
                                    <i class="fas fa-flask"></i>
                                    <a href="/" class="ml-1"
                                     on:click|preventDefault={() => customMeasureEdited = JSON.parse(JSON.stringify(example))}>
                                        {example.label}
                                    </a>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {:else}
                <div>
                    <a class="btn btn-light btn-sm mr-2" href="/" on:click|preventDefault={() => add()}>
                        <i class="fas fa-plus"></i>
                        New Measure
                    </a>
                </div>
                <Table class="mt-2 table-sm font-weight-lighter" responsive>
                    <thead>
                        <tr>
                            {#each fields as field}
                                <th>{field.label}</th>
                            {/each}
                            <th class="text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $config.customMeasures as customMeasure (customMeasure.id)}
                            <tr>
                                {#each fields as field}
                                    <td class="align-middle">
                                        {customMeasure[field.field]}
                                    </td>
                                {/each}
                                <td class="text-center">
                                    <a href="/" on:click|preventDefault={() => del(customMeasure)}
                                     class="btn btn-link text-danger btn-sm mr-2">
                                        Delete
                                    </a>
                                    <a href="/" on:click|preventDefault={() => edit(customMeasure.id * 1)}
                                     class="btn btn-light btn-sm">
                                        Edit
                                    </a>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </Table>
            {/if}
        </div>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" outline size="sm" on:click={toggle}>close</Button>
    </ModalFooter>
</Modal>
