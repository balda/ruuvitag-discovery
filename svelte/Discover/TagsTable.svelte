<script>
    import { targets } from './../store/targets.js';
    import { Table } from 'sveltestrap';
    import Tooltip from './../UI/Tooltip.svelte';
    // import CellUpdated from './Cell/Updated.svelte';
    import Cell from './Cell.svelte';
    import CellDatabase from './Cell/Database.svelte';
    import CellInfo from './Cell/Info.svelte';
    export let cols = [];
    export let tags = [];
    export let ruuvitags = {};
    $: {
        tags = tags;
    }
</script>

<Table class="table-sm font-weight-lighter small" responsive>
    <thead>
        <tr>
            <!-- <th></th> -->
            {#each cols as col (col.field)}
                {#if col.show}
                    <th class="{col.class || `text-right`}">
                        {#if col.unit}
                            <Tooltip tip="{col.unit}" bottom >
                            	{col.label}
                            </Tooltip>
                        {:else}
                            {col.label}
                        {/if}
                    </th>
                {/if}
            {/each}
            <th class="text-center">
                Targets
            </th>
            <th class="text-center">
                Infos
            </th>
        </tr>
    </thead>
    <tbody>
        {#each tags as tag (tag.id)}
            <tr>
                <!-- <td>
                    <div>
                        <CellUpdated {tag}/>
                    </div>
                </td> -->
                {#each cols as col (col.field)}
                    {#if col.show}
                        <td class="{col.class || `text-right`}">
                            <Cell {col} {tag}/>
                        </td>
                    {/if}
                {/each}
                <td class="text-center">
                    {#each $targets as target (target.id)}
                        {#if target.tags && target.tags[tag.id]}
                            <CellDatabase {target} {tag} />
                        {/if}
                    {/each}
                </td>
                <td class="text-center">
                    <CellInfo {tag} {cols} />
                </td>
            </tr>
        {/each}
    </tbody>
</Table>
<!-- <pre>{JSON.stringify($targets, null, 2)}</pre> -->
