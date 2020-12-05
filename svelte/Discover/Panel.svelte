<script>
    import ColumsSelect from './ColumsSelect.svelte';
    import TagsTable from './TagsTable.svelte';
    export let ruuvitags = {};
</script>

<ColumsSelect />

<TagsTable {ruuvitags} />
