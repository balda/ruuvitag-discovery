<script>
    import TargetsTable from './TargetsTable.svelte';
    // export let tags = [];
    export let targets = [];
    export let config = [];
</script>

<TargetsTable {targets} {config} />
<!-- <pre>{JSON.stringify(targets, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(config, null, 2)}</pre> -->
