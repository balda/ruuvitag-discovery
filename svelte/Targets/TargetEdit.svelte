<script>
    import { createEventDispatcher } from 'svelte';
    import { Form, FormGroup, FormText, Input, CustomInput, Label, Button, Table, Row, Col } from 'sveltestrap';
    // import Tooltip from './../UI/Tooltip.svelte';
    import TargetTag from  './TargetTag.svelte';
    export let tags = [];
    export let target = {};
    export let config = {};
    const dispatch = createEventDispatcher();
    function cancelEdit() {
        dispatch(`cancelEdit`);
    };
    let enable = 1 * target.enable;
</script>

<div class="mt-1 pt-2">
    <a href="/" on:click|preventDefault={cancelEdit}
     class="btn btn-light btn-sm">
        Cancel
    </a>
    <a href="/" on:click|preventDefault={cancelEdit}
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
                        bind:checked={enable}
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
                        bind:value={target.name}
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
                        bind:value={target.interval}
                        type="number"
                        size="sm"
                        id="interval"
                        name="interval"
                        placeholder="60" />
                </div>
            </FormGroup>
            {#each config.config as field}
                <FormGroup class="row">
                    <Label class="col-sm-4" for="{field.name}">{field.name}</Label>
                    <div class="col-sm-8">
                        <Input
                            bind:value={target[field.name]}
                            type={field.type || `text`}
                            size="sm"
                            id="{field.name}"
                            name="{field.name}" />
                    </div>
                </FormGroup>
            {/each}
            {#if config.measurement}
                <FormGroup class="row">
                    <Label class="col-sm-4" for="measurement">Measurement</Label>
                    <div class="col-sm-8">
                        <CustomInput
                            bind:value={target.measurement}
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
        <pre>{JSON.stringify(tags, null, 2)}</pre>
        {#if target.tags}
            {#each Object.keys(target.tags) as id (id)}
                <TargetTag tag={target.tags[id]} />
            {/each}
        {/if}
    </Col>
</Row>

<!-- <pre>{JSON.stringify(config, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(target.tags, null, 2)}</pre> -->
