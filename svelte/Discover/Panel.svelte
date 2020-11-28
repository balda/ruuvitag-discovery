<script>
    import ColumsSelect from './ColumsSelect.svelte';
    import TagsTable from './TagsTable.svelte';
    export let cols = [];
    export let tags = [];
    export let ruuvitags = {};
</script>

<ColumsSelect bind:cols={cols} />

<TagsTable {cols} {tags} {ruuvitags} />
