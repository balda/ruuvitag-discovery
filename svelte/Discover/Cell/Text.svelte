<script>
    export let tag = {};
    export let col = {};
    let value = tag[col.field] || tag.last[col.field];
</script>

{value !== undefined && value !== null ? value : `-`}
