<script>
    import { tags, cols } from './../store/api.js';
    import { targets } from './../store/targets.js';
    import { Table } from 'sveltestrap';
    import Tooltip from './../UI/Tooltip.svelte';
    import Cell from './Cell.svelte';
    import CellDatabase from './Cell/Database.svelte';
    import CellInfo from './Cell/Info.svelte';
    export let ruuvitags = {};
</script>

<Table class="table-sm font-weight-lighter small" responsive>
    <thead>
        <tr>
            {#each $cols as col (col.field)}
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
        {#each $tags as tag (tag.id)}
            <tr>
                {#each $cols as col (col.field)}
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
                    <CellInfo {tag} />
                </td>
            </tr>
        {/each}
    </tbody>
</Table>
