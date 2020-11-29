<script>
    import { CustomInput } from 'sveltestrap';
	import Cell from './../Discover/Cell.svelte';
    export let measure = {};
    export let tag = {};
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
        <div class="ml-2 float-left font-italic font-weight-lighter">
            {measure.field}
        </div>
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
                <form class="form-inline">
                    <input type="text" name="label"
                     bind:value="{measure.label}"
                     class="form-control form-control-sm mr-2"
                    >
                    <input type="text" name="field"
                     bind:value="{measure.field}"
                     class="form-control form-control-sm mr-2"
                    >
                    <a href="/" on:click|preventDefault={() => state = `view`}
                     class="ml-2 text-dark">
                        <i class="fas fa-check-circle fa-sm"></i>
                    </a>
                </form>
            </div>
        {/if}
    {/if}
</div>
