<script>
    import { Table } from 'sveltestrap';
    import Tooltip from './../UI/Tooltip.svelte';
    // import Cell from './Cell.svelte';
    // import CellDatabase from './Cell/Database.svelte';
    // import CellInfo from './Cell/Info.svelte';
    export let tags = [];
    export let targets = [];
    export let config = [];
</script>

<Table class="table-sm font-weight-lighter small" responsive>
    <thead>
        <tr>
            <th class="text-left">
                Name
            </th>
            <th class="text-left">
                Type
            </th>
            <th class="text-left">
                Measurement
            </th>
            <th class="text-left">
                Interval
            </th>
            <th class="text-left">
                Tags
            </th>
            <th class="text-center">
                Actions
            </th>
        </tr>
    </thead>
    <tbody>
        {#each targets as target (target.id)}
            <tr>
                <td class="text-left">
                    {target.name} ({target.enable})
                </td>
                <td class="text-left">
                    {target.type}
                </td>
                <td class="text-left">
                    {target.measurement}
                </td>
                <td class="text-left">
                    {target.interval}
                </td>
                <td class="text-left">
                    {#if target.tags}
                        {#each Object.keys(target.tags) as id (id)}
                            <div class="mb-2">
                                {target.tags[id].name}
                                (<em>{target.tags[id].field}</em>)
                                <br>
                                {Object.keys(target.tags[id].measures).length} measure(s)
                                <br>
                                {#each Object.keys(target.tags[id].measures) as measure (measure)}
                                    <div>
                                        {target.tags[id].measures[measure].label}
                                        ({target.tags[id].measures[measure].field})
                                    </div>
                                {/each}
                            </div>
                        {/each}
                    {:else}
                        <em>none</em>
                    {/if}
                </td>
                <td class="text-center">
                    Delete | Edit
                </td>
            </tr>
        {/each}
    </tbody>
</Table>

<!-- <pre>{JSON.stringify(targets, null, 2)}</pre> -->
