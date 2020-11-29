<script>
    import { dictMeasures } from './../store/dict.js';
    import { Container, Row, Col, CustomInput } from 'sveltestrap';
    import TargetTagMeasure from  './TargetTagMeasure.svelte';
    // import Tooltip from './../UI/Tooltip.svelte';
    export let tag = {};
    export let targetTag = {};
    let state = `view`; // `view` | `edit`
    $: tagMeasures = $dictMeasures.filter(measure => {
        return tag.last[measure.field] !== undefined || tag[measure.field] !== undefined;
    });
    $: if (targetTag && !targetTag.name) {
        targetTag.name = `RuuviTag ${tag.id}`;
    }
    $: if (!targetTag.field) {
        targetTag.field = `ruuvitag_${tag.id}`;
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
        <div class="ml-2 float-left font-italic font-weight-lighter">
            {targetTag.field}
        </div>
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
                <form class="form-inline">
                    <input type="text" name="name"
                     bind:value="{targetTag.name}"
                     class="form-control form-control-sm mr-2"
                    >
                    <input type="text" name="field"
                     bind:value="{targetTag.field}"
                     class="form-control form-control-sm mr-2"
                    >
                    <a href="/" on:click|preventDefault={() => state = `view`}
                     class="ml-2 text-dark">
                        <i class="fas fa-check-circle fa-sm"></i>
                    </a>
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
                        <TargetTagMeasure {measure} {tag} />
                    </Col>
                {/each}
            </Row>
        </Container>
    {/if}
</div>
<!-- <pre class="small">{JSON.stringify(targetTag, null, 2)}</pre> -->

<hr>
