<script>
	import ColumsSelect from './ColumsSelect.svelte';
    import TagsTable from './TagsTable.svelte';
    export let cols = [];
    export let tags = [];
    export let targets = [];
    // export let ruuvitags = [];
    // export let config = {};
    function columnChange(event) {
        const name = event.detail.name;
        const index = cols.findIndex(c => c.field === name);
        cols[index] = cols[index];
    }
</script>

<strong>Discover</strong>

<ColumsSelect {cols} on:changed={columnChange}/>

<TagsTable {cols} {tags} {targets}/>
