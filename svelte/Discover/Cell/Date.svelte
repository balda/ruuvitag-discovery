<script>
    export let tag = {};
    export let col = {};
    let value = tag[col.field] || tag.last[col.field];
</script>

{moment(value).format(`YYYY-MM-DD HH:mm:ss`)}
