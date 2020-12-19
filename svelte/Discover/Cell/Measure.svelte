<script>
    export let tag = {};
    export let col = {};
    export let source = `last`;
    export let showUnit = false;
</script>

{#if tag}
    {#if tag[col.field]}
        {(tag[col.field] * (col.scale || 1)).toFixed(col.accuracy || 0)}
    {:else}
        {#if tag[source] && tag[source][col.field] !== undefined}
            {(tag[source][col.field] * (col.scale || 1)).toFixed(col.accuracy || 0)}
            {#if showUnit && col.unit && col.unit !== `count`}
                {col.unit}
            {/if}
        {:else}
            -
        {/if}
    {/if}
{/if}
