<script>
    import TargetsTable from './TargetsTable.svelte';
    import TargetEdit from  './TargetEdit.svelte';
    export let tags = [];
    export let targets = [];
    export let config = [];
    export let measures = [];
    let edited = -1;
</script>

{#if edited === -1}
    <TargetsTable
     {targets}
     {config}
     bind:edited={edited}
    />
{:else}
    <TargetEdit
     target={targets[edited]}
     {tags}
     {measures}
     config={config.find(t => t.type === targets[edited].type)}
     bind:edited={edited}
    />
{/if}

<!-- <pre>{JSON.stringify(measures, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(targets, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(config, null, 2)}</pre> -->
