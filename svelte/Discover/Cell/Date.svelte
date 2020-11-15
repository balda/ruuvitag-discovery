<script>
    import Tooltip from './../../UI/Tooltip.svelte';
    export let tag = {};
    export let col = {};
    export let source = `last`;
    let value;
    $: {
        if (tag[source]) {
            value = tag[source][col.field];
        }
    }
    $: date = moment(value);
</script>

{#if value}
    <Tooltip tip="{date.format(`YYYY-MM-DD HH:mm:ss`)}" left >
    	{date.format(`HH[h]mm`)}
    </Tooltip>
{:else}
    -
{/if}
