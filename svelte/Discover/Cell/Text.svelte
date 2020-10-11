<script>
    export let tag = {};
    export let col = {};
    export let source = `last`;
    let value = null;
    $: {
        if (tag[col.field]) {
            value = tag[col.field];
        } else if (tag[source]) {
            value = tag[source][col.field];
        }
    }
</script>

{value !== undefined && value !== null ? value : `-`}
