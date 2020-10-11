<script>
    // import { createEventDispatcher } from 'svelte';
    // import { Form, FormGroup, FormText, Input, CustomInput, Label, Button, Table, Row, Col } from 'sveltestrap';
    import { Container, Row, Col, CustomInput } from 'sveltestrap';
    import TargetTagMeasure from  './TargetTagMeasure.svelte';
    // import Tooltip from './../UI/Tooltip.svelte';
    export let tag = {};
    export let target = {};
    export let measures = [];
    let selected;
    if (target.id) {
        selected = true;
    }
    $: tagMeasures = measures.filter(measure => {
        return tag.last[measure.field] !== undefined || tag[measure.field] !== undefined;
    });
    // $: selected = !!target;
    // export let config = {};
    // const dispatch = createEventDispatcher();
    // function cancelEdit() {
    //     dispatch(`cancelEdit`);
    // };
    // let enable = 1 * target.enable;
</script>

<div class="small">
    <CustomInput
        bind:checked={selected}
        type="switch"
        id="tag_{tag.id}"
        name="tag_{tag.id}"
        label="{tag.id}" />
    {#if selected}
        <div>
            Measures
        </div>
        <Container>
            <Row>
                {#each tagMeasures as measure (measure.field)}
                    <Col xs="12" sm="6">
                        <TargetTagMeasure {measure} {tag} {target} />
                    </Col>
                {/each}
            </Row>
        </Container>
    {/if}
</div>
<!-- <pre>{JSON.stringify(tag, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(target, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(measures, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(tagMeasures, null, 2)}</pre> -->

<hr>
