<script>
    import { api, tags } from './../store/api.js';
    import { targets } from './../store/targets.js';
    import { dictTargets, dictMeasures } from './../store/dict.js';
    import { createEventDispatcher } from 'svelte';
    import { Form, FormGroup, FormText, Input, CustomInput, Label, Button, Table, Row, Col } from 'sveltestrap';
    import TargetTag from  './TargetTag.svelte';
    export let edited;
    const cancel = () => {
        edited = -1;
    };
    const target = typeof edited === `string` ? {
        type: edited,
        enable: 0,
        name: ``,
        interval: 60,
    } : $targets[edited];
    const config = $dictTargets.find(t => t.type === target.type);
    if (!target.id && config.measurement) {
        target.measurement = `tag`;
    }
    let targetEdited = JSON.parse(JSON.stringify(target));
    targetEdited.enable = 1 * targetEdited.enable;
    targetEdited.tags = {};
    for (const tag of $tags) {
        const selected = target.tags && !!target.tags[tag.id];
        const tagEdited = selected ? target.tags[tag.id] : {
            id: null,
        };
        targetEdited.tags[tag.id] = {
            ...tagEdited,
            selected,
            // TODO: add filter
            // $: tagMeasures = measures.filter(measure => {
            //     return tag.last[measure.field] !== undefined || tag[measure.field] !== undefined;
            // });
            measures: $dictMeasures.map(measure => {
                return {
                    measure,
                    selected: selected && tagEdited.measures[measure.field] !== undefined,
                    field: selected && tagEdited.measures[measure.field] ? tagEdited.measures[measure.field].field : measure.field,
                    label: selected && tagEdited.measures[measure.field] ? tagEdited.measures[measure.field].label : measure.label,
                };
            }),
        };
    }
    let state = `view`; // `view` | `saving`
    async function save() {
        state = `saving`;
        const data = JSON.parse(JSON.stringify(targetEdited));
        data.tags = {};
        for (const id in targetEdited.tags) {
            if (targetEdited.tags[id].selected) {
                data.tags[id] = JSON.parse(JSON.stringify(targetEdited.tags[id]));
                data.tags[id].measures = {};
                for (const measure of targetEdited.tags[id].measures) {
                    if (measure.selected) {
                        data.tags[id].measures[measure.measure.field] = {
                            label: measure.label,
                            field: measure.field,
                        };
                    }
                }
            }
        }
        try {
            targets.set(await api.post(`target`, data));
        } catch(error) {
            console.log(error);
        }
        state = `view`;
        edited = -1;
    }
</script>

<style>
    .targets :global(.custom-control-label) {
        padding-top: 2px;
    }
</style>

<div class="targets">
    <div class="mt-1 pt-2">
        <a href="/" on:click|preventDefault={cancel}
         class="btn btn-light btn-sm">
            Cancel
        </a>
        <a href="/" on:click|preventDefault={e => save()}
         class="btn btn-light btn-sm">
            Save
        </a>
        <a href="/" on:click|preventDefault={e => console.log(targetEdited)}
         class="btn btn-link btn-sm text-muted float-right">
            log
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
        </Col>
        <Col xs="8" class="mt-3">
            <p>Tags</p>
            {#each $tags as tag (tag.id)}
                <TargetTag {tag} bind:targetTag={targetEdited.tags[tag.id]} />
            {/each}
        </Col>
    </Row>
</div>
