<script>
    import { CustomInput } from 'sveltestrap';
	import Cell from './../Discover/Cell.svelte';
    export let measure = {};
    export let tag = {};
    export let fields;
    let state = `view`; // `view` | `edit`
</script>

<div>
    <div class="clearfix">
        <div class="float-right">
            <Cell col={measure.measure} {tag} source="last" showUnit="true" />
        </div>
        <CustomInput
            bind:checked={measure.selected}
            type="switch"
            id="tag_{tag.id}_measure_{measure.field}"
            name="tag_{tag.id}_measure_{measure.field}"
            label="{measure.label}"
            class="float-left"
        />
        {#if fields.measure.field}
            <div class="ml-2 float-left font-italic font-weight-lighter">
                {measure.field}
            </div>
        {/if}
        {#if measure.selected}
            {#if state === `view`}
                <a href="/" on:click|preventDefault={() => state = `edit`}
                 class="ml-2 text-dark">
                    <i class="fas fa-cog fa-sm-"></i>
                </a>
            {/if}
        {/if}
    </div>
    {#if measure.selected}
        {#if state === `edit`}
            <div class="my-2">
                <form>
                    <div class="form-row">
                        <div class="col-sm-5">
                            <input type="text" name="label"
                             bind:value="{measure.label}"
                             class="form-control form-control-sm mr-2"
                            >
                            <small class="form-text text-muted">
                                {fields.measure.label ? fields.measure.label : `Unused`}
                            </small>
                        </div>
                        {#if fields.measure.field}
                            <div class="col-sm-5">
                                <input type="text" name="field"
                                 bind:value="{measure.field}"
                                 class="form-control form-control-sm mr-2"
                                >
                                <small class="form-text text-muted">
                                    {fields.measure.field ? fields.measure.field : `Unused`}
                                </small>
                            </div>
                        {:else}
                            <input type="hidden" name="field" value="{measure.field}" >
                        {/if}
                        <div class="col-sm-2 pt-1">
                            <a href="/" on:click|preventDefault={() => state = `view`}
                             class="ml-1 text-dark">
                                <i class="fas fa-check-circle"></i>
                            </a>
                    </div>
                </form>
            </div>
        {/if}
    {/if}
</div>
