<script>
    import { targets } from './../store/targets.js';
    import { dictTargets } from './../store/dict.js';
    import TargetsTable from './TargetsTable.svelte';
    import TargetEdit from  './TargetEdit.svelte';
    export let tags = [];
    let edited = -1;
</script>

{#if edited === -1}
    <div class="mt-1 mb-2 pt-2">
        {#each $dictTargets as target}
            <a class="btn btn-light btn-sm" href="/" on:click|preventDefault={() => edited = target.type}>
                <i class="fas fa-plus"></i>
                {target.label}
            </a>
        {/each}
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
