<script>
    // import { dictTargets } from './../store/dict.js';
    import { Container, Row, Col, CustomInput } from 'sveltestrap';
    import TargetTagMeasure from  './TargetTagMeasure.svelte';
    import { dictTargets } from './../store/dict.js';
    export let tag = {};
    export let measurement;
    export let target;
    export let targetTag = {};
    export let fields;
    const targetConfig = $dictTargets.find(t => t.type === target.type);
    let state = `view`; // `view` | `edit`
    $: if (targetTag && !targetTag.name) {
        targetTag.name = `RuuviTag ${tag.id}`;
    }
    $: if (!targetTag.field) {
        targetTag.field = `ruuvitag_${tag.id}`;
    }
    $: if (!measurement) {
        measurement = `default`;
    }
</script>

<div class="small">
    <div class="clearfix">
        <CustomInput
            bind:checked={targetTag.selected}
            type="switch"
            id="tag_{tag.id}"
            name="tag_{tag.id}"
            label="{targetTag.name}"
            class="float-left"
        />
        {#if fields.tag.field}
            <div class="ml-2 float-left font-italic font-weight-lighter">
                {targetTag.field}
            </div>
        {/if}
        {#if targetTag.selected}
            {#if state === `view`}
                <a href="/" on:click|preventDefault={() => state = `edit`}
                 class="ml-2 text-dark">
                    <i class="fas fa-cog fa-sm-"></i>
                </a>
            {/if}
        {/if}
    </div>
    {#if targetTag.selected}
        {#if state === `edit`}
            <div class="my-2">
                <form>
                    <div class="form-row">
                        <div class="col-sm-5">
                            <input type="text" name="name"
                             bind:value="{targetTag.name}"
                             class="form-control form-control-sm mr-2"
                            >
                            <small class="form-text text-muted">
                                {fields.tag.name ? fields.tag.name : `Unused`}
                            </small>
                        </div>
                        {#if fields.tag.field}
                            <div class="col-sm-5">
                                <input type="text" name="field"
                                 bind:value="{targetTag.field}"
                                 class="form-control form-control-sm mr-2"
                                >
                                <small class="form-text text-muted">
                                    {fields.tag.field ? fields.tag.field : `Unused`}
                                </small>
                            </div>
                        {:else}
                            <input type="hidden" name="field" value="{targetTag.field}" >
                        {/if}
                        <div class="col-sm-2 pt-1">
                            <a href="/" on:click|preventDefault={() => state = `view`}
                             class="ml-1 text-dark">
                                <i class="fas fa-check-circle"></i>
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        {/if}
        <div class="my-2">
            Measures
        </div>
        <Container>
            <Row>
                {#each targetTag.measures as measure (measure.measure.field)}
                    <Col xs="12" sm="6">
                        <TargetTagMeasure {measure} {tag} {fields} />
                    </Col>
                {/each}
            </Row>
        </Container>
    {/if}
</div>

<hr>
