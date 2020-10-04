<script>
    export let tag = {};
    export let col = {};
    export let source = `last`;
</script>

{#if tag[col.field]}
    {(tag[col.field] * (col.scale || 1)).toFixed(col.accuracy || 0)}
{:else}
    {#if tag[source] && tag[source][col.field] !== undefined}
        {(tag[source][col.field] * (col.scale || 1)).toFixed(col.accuracy || 0)}
    {:else}
        -
    {/if}
{/if}
