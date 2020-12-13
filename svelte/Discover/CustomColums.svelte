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
            type: `number`,
            help: `Accuracy`,
        },
        {
            field: `math`,
            label: `Math Expression`,
            help: `See <a href="https://mathjs.org/" target="_blank">mathjs.org</a> for syntax.`,
        },
    ];
    let columnEdited = {};
    $: if (edited === -1) {
        for (const field of fields) {
            columnEdited[field.field] = field.type === `number` ? 0 : ``;
        }
    }
    function edit(id) {
        columnEdited = JSON.parse(JSON.stringify($config.customColums.find(customColum => 1 * customColum.id === 1 * id)));
        edited = id;
    };
    async function save() {
        state = `saving`;
        const data = {
            customColums: JSON.parse(JSON.stringify($config.customColums)),
        };
        if (edited === -1) {
            columnEdited.id = data.customColums.length;
            data.customColums.push(columnEdited);
        } else {
            data.customColums[edited] = columnEdited;
        }
        try {
            await api.post(`config`, data);
            $config.customColums = data.customColums;
            if (edited === -1) {
                $cols.splice(-1, 0, columnEdited);
                $cols = $cols;
            } else {
                const index = $cols.length - 1 - $config.customColums.length + edited;
                for (const field in $cols[index]) {
                    $cols[index][field] = columnEdited[field];
                }
            }
        } catch(error) {
            console.log(error);
        }
        state = `view`;
        edited = null;
    };
    async function deleteCustomColums(customColum) {
        // state = `saving`;
        if (confirm(`Confirm Delete`)) {
            try {
                const data = {
                    customColums: JSON.parse(JSON.stringify($config.customColums)),
                };
                data.customColums.splice(customColum.id, 1);
                await api.post(`config`, data);
                $config.customColums = data.customColums;
            } catch(error) {
                console.log(error);
            }
        }
        // state = `view`;
    };
</script>

<Tooltip tip="Custom Columns" bottom >
    <a on:click|preventDefault={toggle} href="/" class="pt-1 pb-1 mt-1 btn btn-light border">
        <small>Custom Columns</small>
    </a>
</Tooltip>
<Modal isOpen={open} {toggle} size="lg">
    <ModalHeader {toggle}>
        Custom Columns
    </ModalHeader>
    <ModalBody>
        <div class="container-fluid">
            {#if edited !== null}
                <div>
                    <form id="form-custom-column" class="mt-4" disabled>
                        {#each fields as field}
                            <div class="form-group row">
                                <label class="col-sm-{col_left} col-form-label-sm">
                                    {field.label}
                                </label>
                                <div class="col-sm-{col_right}">
                                    {#if field.type === `number`}
                                        <input type="number" name="{field.field}"
                                         bind:value="{columnEdited[field.field]}"
                                         class="form-control form-control-sm"
                                         disabled={state === `saving` ? `disabled` : null}
                                        >
                                    {:else}
                                        <input type="text" name="{field.field}"
                                         bind:value="{columnEdited[field.field]}"
                                         class="form-control form-control-sm"
                                         disabled={state === `saving` ? `disabled` : null}
                                        >
                                    {/if}
                                    <small class="form-text text-muted">
                                        <em>{@html field.help}</em>
                                    </small>
                                </div>
                            </div>
                        {/each}
                    </form>
                </div>
                <div>
                    <a class="btn btn-light btn-sm mr-2" href="/" on:click|preventDefault={() => edited = null}>
                        Cancel
                    </a>
                    <a class="btn btn-light btn-sm mr-2" href="/" on:click|preventDefault={() => save()}>
                        Save
                    </a>
                </div>
            {:else}
                <div>
                    <a class="btn btn-light btn-sm mr-2" href="/" on:click|preventDefault={() => edited = -1}>
                        <i class="fas fa-plus"></i>
                        New Custom
                    </a>
                </div>
                <Table class="mt-2 table-sm font-weight-lighter" responsive>
                    <thead>
                        <tr>
                            {#each fields as field}
                                <th>
                                    {field.label}
                                </th>
                            {/each}
                            <th class="text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $config.customColums as customColum (customColum.id)}
                            <tr>
                                {#each fields as field}
                                    <td class="align-middle">
                                        {customColum[field.field]}
                                    </td>
                                {/each}
                                <td class="text-center">
                                    <a href="/" on:click|preventDefault={() => deleteCustomColums(customColum)}
                                     class="btn btn-link text-danger btn-sm mr-2">
                                        Delete
                                    </a>
                                    <a href="/" on:click|preventDefault={() => edit(customColum.id * 1)}
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
