<script>
	// import ColumsSelect from './ColumsSelect.svelte';
    import TargetsTable from './TargetsTable.svelte';
    export let tags = [];
    export let targets = [];
    export let config = [];
    // function columnChange(event) {
    //     const name = event.detail.name;
    //     const index = cols.findIndex(c => c.field === name);
    //     cols[index] = cols[index];
    // }
</script>

<TargetsTable {tags} {targets} {config}/>
<!-- <pre>{JSON.stringify(targets, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(config, null, 2)}</pre> -->
