<script>
    // import post from './../store/rest.js';
    import { createEventDispatcher } from 'svelte';
    import { Form, FormGroup, FormText, Input, CustomInput, Label, Button, Table, Row, Col } from 'sveltestrap';
    // import Tooltip from './../UI/Tooltip.svelte';
    import TargetTag from  './TargetTag.svelte';
    export let tags = [];
    export let target = {};
    export let config = {};
    export let measures = [];
    export let edited;
    // $: targetTags = target.tags || [];
    let targetEdited = JSON.parse(JSON.stringify(target));
    targetEdited.enable = 1 * targetEdited.enable;
    targetEdited.tags = targetEdited.tags || [];
    let state = `view`; // `view` | `saving`
    async function save() {
        state = `saving`;
        console.log(targetEdited);
        // saving = target;
        // stateConfig = `hidden`;
        // const data = {};
        // data[`${target}`] = config[target];
        // await post(`${root}config`, data);
        state = `view`;
    }
</script>

<style>
    .targets :global(.custom-control-label) {
        padding-top: 2px;
    }
</style>

<div class="targets">
    <div class="mt-1 pt-2">
        <a href="/" on:click|preventDefault={() => edited = -1}
         class="btn btn-light btn-sm">
            Cancel
        </a>
        <a href="/" on:click|preventDefault={e => save()}
         class="btn btn-light btn-sm">
            Save
        </a>
    </div>

    <Row>
        <Col xs="4" class="mt-3">
            <Form class="small">
                <FormGroup class="row">
                    <Label class="col-sm-4" for="enable">{config.label}</Label>
                    <div class="col-sm-8">
                        <CustomInput
                            bind:checked={targetEdited.enable}
                            type="switch"
                            id="enable"
                            name="enable"
                            label="Enable" />
                    </div>
                </FormGroup>
                <FormGroup class="row">
                    <Label class="col-sm-4" for="name">Name</Label>
                    <div class="col-sm-8">
                        <Input
                            bind:value={targetEdited.name}
                            type="text"
                            size="sm"
                            id="name"
                            name="name"
                            placeholder="Name" />
                    </div>
                </FormGroup>
                <FormGroup class="row">
                    <Label class="col-sm-4" for="interval">Interval</Label>
                    <div class="col-sm-8">
                        <Input
                            bind:value={targetEdited.interval}
                            type="number"
                            size="sm"
                            id="interval"
                            name="interval"
                            placeholder="60" />
                    </div>
                </FormGroup>
                <hr>
                {#each config.config as field}
                    <FormGroup class="row">
                        <Label class="col-sm-4" for="{field.name}">{field.name}</Label>
                        <div class="col-sm-8">
                            <Input
                                bind:value={targetEdited[field.name]}
                                type={field.type || `text`}
                                size="sm"
                                id="{field.name}"
                                name="{field.name}" />
                        </div>
                    </FormGroup>
                {/each}
                <hr>
                {#if config.measurement}
                    <FormGroup class="row">
                        <Label class="col-sm-4" for="measurement">Measurement</Label>
                        <div class="col-sm-8">
                            <CustomInput
                                bind:value={targetEdited.measurement}
                                type="select"
                                class="custom-select-sm"
                                id="measurement"
                                name="measurement"
                            >
                                <option value="tag">Tag</option>
                                <option value="measure">Measure</option>
                                <option value="both">Both</option>
                            </CustomInput>
                        </div>
                    </FormGroup>
                {/if}
            </Form>
            <!-- <pre>{JSON.stringify(target.tags, null, 2)}</pre> -->
        </Col>
        <Col xs="8" class="mt-3">
            <p>Tags</p>
            {#each tags as tag (tag.id)}
                <TargetTag {tag} bind:targetTag={targetEdited.tags[tag.id]} {measures} />
            {/each}
        </Col>
    </Row>
</div>

<!-- <pre>{JSON.stringify(config, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(target.tags, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(targetEdited, null, 2)}</pre> -->
