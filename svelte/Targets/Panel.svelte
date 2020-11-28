<script>
    import { targets } from './../store/targets.js';
    import { dictTargets } from './../store/dict.js';
    import TargetsTable from './TargetsTable.svelte';
    import TargetEdit from  './TargetEdit.svelte';
    export let tags = [];
    let edited = -1;
</script>

{#if edited === -1}
    <div>
    </div>
    <TargetsTable
     bind:edited={edited}
    />
{:else}
    <TargetEdit
     {tags}
     bind:edited={edited}
    />
{/if}

<!-- <pre>{JSON.stringify($targets, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(config, null, 2)}</pre> -->
