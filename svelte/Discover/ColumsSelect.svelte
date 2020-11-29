<script>
    import { FormGroup, CustomInput, Label, Row, Col } from 'sveltestrap';
    export let cols = [];
    let showSelectColumns = false;
</script>

<style>
    .select-columns :global(.custom-control-label) {
        padding-top: 2px;
    }
</style>

<CustomInput
    bind:checked={showSelectColumns}
    type="switch"
    id="selectColumns"
    name="selectColumns"
    label="Select Columns" />

<div class="select-columns">
    {#if showSelectColumns}
        <Row>
            {#each cols as col (col.field)}
                <Col sm="6" md="4" lg="3" xl="2" class="font-weight-lighter small parent">
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
