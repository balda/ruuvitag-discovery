<script>
    export let tag = {};
    export let col = {};
    export let source = `last`;
    let value = tag[col.field] ? tag[col.field] : (tag[source] ? tag[source][col.field] : undefined);
</script>

{#if value !== undefined}
    {(value * (col.scale || 1)).toFixed(col.accuracy || 0)}
{:else}
    -
{/if}
