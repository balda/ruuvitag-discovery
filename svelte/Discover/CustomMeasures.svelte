<script>
    import { api, cols } from './../store/api.js';
	import { config } from './../store/config.js';
    import { targets } from './../store/targets.js';
    import { parse } from 'mathjs';
    import {
        Table,
        Button,
        Alert,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader
    } from 'sveltestrap';
    import Tooltip from './../UI/Tooltip.svelte';
    import { FormGroup, CustomInput, Label, Row, Col } from 'sveltestrap';
    let open = false;
    let col_left = 3;
    let col_right = 8;
    let state = `view`; // `view` | `saving`
    let edited = null;
    let deleteErrorAlert = false;
    let deleteErrorMessage = ``;
    function deleteErrorClose() {
        deleteErrorAlert = false;
        deleteErrorMessage = ``;
    };
    const toggle = () => {
        open = !open;
        deleteErrorClose();
    };
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
            validate: [`required`, `mathValid`, `mathVars`],
            error: [`Math expression is required`, `Math expression is invalid`, `Unknown variable(s)`],
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
    function colIndex() {
        return $cols.length - 1 - $config.customMeasures.length + edited;
    };
    $: colsArray = $cols.map(col => col.field)
    const validator = {
        required: (value) => {
            return {
                valid: value !== undefined && value !== ``,
            };
        },
        integer: (value) => {
            return {
                valid: `${value}` === `${1 * value}` && Number.isInteger(1 * value) && parseInt(value, 10) >= 0,
            };
        },
        measureNotExists: (value) => {
            const index = colsArray.indexOf(value);
            if (edited === -1) {
                return {
                    valid: index === -1,
                };
            } else {
                return {
                    valid: index === -1 || index === colIndex(),
                };
            }
        },
        mathValid: (value) => {
            try {
                const exp = parse(value);
                return {
                    valid: true,
                };
            } catch(error) {
                return {
                    valid: false,
                };
            }
        },
        mathVars: (value) => {
            try {
                const variables = [];
                parse(value).traverse(function (node, path, parent) {
                    if (node.type === `SymbolNode`) {
                        variables.push(node.name);
                    }
                });
                const notExists = variables.filter(v => colsArray.indexOf(v) === -1);
                return {
                    valid: notExists.length === 0,
                    error: notExists.length === 0 ? false : `Unknown measure${notExists.length > 1 ? `s` : ``}: ${notExists.join(`, `)}`,
                };
            } catch(error) {
                return {
                    valid: false,
                };
            }
        },
    };
    function validate() {
        let valid = true;
        errors = {};
        for (const field of fields) {
            if (field.validate) {
                let fieldValid = true;
                for (let index = 0 ; index < field.validate.length ; index++ ) {
                    if (fieldValid) {
                        const check = validator[field.validate[index]](customMeasureEdited[field.field]);
                        if (!check.valid) {
                           valid = false;
                           fieldValid = false;
                           errors[field.field] = check.error || field.error[index];
                        }
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
        deleteErrorClose();
        errors = {};
        edited = -1;
    };
    function edit(id) {
        deleteErrorClose();
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
                const index = colIndex();
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
    function usedInTargets(customMeasure) {
        const usedIn = [];
        for (const target of $targets) {
            for (const tag of Object.values(target.tags)) {
                for (const measure in tag.measures) {
                    if (customMeasure.field === measure) {
                        usedIn.push({
                            target: target.name,
                            tag: tag.name
                        });
                    }
                }
            }
        }
        return usedIn;
    };
    async function del(customMeasure) {
        // state = `saving`;
        deleteErrorMessage = ``;
        const usedIn = usedInTargets(customMeasure);
        if (usedIn.length) {
            deleteErrorMessage = `
                <div class="font-weight-bolder">
                    Can't delete custom measure: already used in following targets:
                </div>
                <div class="mt-1">
                    ${usedIn.map(useMeasure => {
                        return `
                            <i class="fas fa-database"></i>
                            ${useMeasure.target} (in ${useMeasure.tag})
                        `;
                    }).join(`</div><div>`)}
                </div>
            `;
            deleteErrorAlert = true;
        } else {
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
                                        {#if field.field === `field`}
                                            {#if usedInTargets(customMeasureEdited).length > 0}
                                                <input type="text" name="{field.field}"
                                                 bind:value="{customMeasureEdited[field.field]}"
                                                 class="form-control form-control-sm {errors[field.field] ? `is-invalid` : ``}"
                                                 disabled=disabled
                                                >
                                                <div class="ml-1 mt-1 font-weight-lighter font-italic">
                                                    Can't rename, used in following targets:
                                                </div>
                                                <div class="ml-1 mt-1 font-weight-lighter">
                                                    {@html usedInTargets(customMeasureEdited).map(useMeasure => {
                                                        return `
                                                            <i class="fas fa-database"></i>
                                                            ${useMeasure.target} (in ${useMeasure.tag})
                                                        `;
                                                    }).join(`</div><div>`)}
                                                </div>
                                            {:else}
                                                <input type="text" name="{field.field}"
                                                 bind:value="{customMeasureEdited[field.field]}"
                                                 class="form-control form-control-sm {errors[field.field] ? `is-invalid` : ``}"
                                                 disabled={state === `saving` ? `disabled` : null}
                                                >
                                            {/if}
                                        {:else if field.type === `number`}
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
                <Alert color="danger" isOpen={deleteErrorAlert} toggle={() => deleteErrorClose()}>
                    {@html deleteErrorMessage}
                </Alert>
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
