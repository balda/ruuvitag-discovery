<script>
    import { cols, syncColumns } from './../store/api.js';
    import { FormGroup, CustomInput, Label, Row, Col } from 'sveltestrap';
    import CustomColums from './CustomColums.svelte';
    let showSelectColumns = false;
    $: syncColumns($cols);
</script>

<style>
    .select-columns :global(.custom-control-label) {
        padding-top: 2px;
    }
</style>

<Row class="mt-2 mb-2 small">
    <Col>
        <div class="float-left select-columns">
            <CustomInput
                bind:checked={showSelectColumns}
                type="switch"
                bsSize="sm"
                inline=true
                class="bg-light mt-1 pr-2 pl-5 pt-1 pb-2 border rounded"
                id="selectColumns"
                name="selectColumns"
                label="Select Columns" />
        </div>
        <div class="float-left">
            <CustomColums />
        </div>
    </Col>
</Row>
<div class="select-columns">
    {#if showSelectColumns}
        <Row>
            {#each $cols as col (col.field)}
                <Col sm="6" md="4" lg="3" xl="2" class="font-weight-lighter small">
                    <CustomInput
                        bind:checked={col.show}
                        type="switch"
                        bsSize="sm"
                        inline=true
                        id="show_{col.field}"
                        name="{col.field}"
                        label="{col.label || col.field}" />
                </Col>
            {/each}
        </Row>
    {/if}
</div>
