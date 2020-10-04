<script>
    export let tag = {};
    export let col = {};
    export let source = `last`;
    $: value = tag[col.field] || tag[source][col.field];
</script>

{value !== undefined && value !== null ? value : `-`}
