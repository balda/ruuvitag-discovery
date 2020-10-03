<script>
    export let tag = {};
    export let col = {};
    let value = tag[col.field] || tag.last[col.field];
</script>

{#if value !== undefined}
    {(value * (col.scale || 1)).toFixed(col.accuracy || 0)}
{:else}
    -
{/if}
