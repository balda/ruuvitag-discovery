<script>
    import { Table } from 'sveltestrap';
	import ColumsSelect from './ColumsSelect.svelte';
	import CellMeasure from './Cell/Measure.svelte';
	import CellText from './Cell/Text.svelte';
    import CellDate from './Cell/Date.svelte';
    import CellDatabase from './Cell/Database.svelte';
    import CellInfo from './Cell/Info.svelte';
    import Tooltip from './../UI/Tooltip.svelte';
    export let tags = [];
    // export let targets = [];
    export let indexedTags = {};
    // export let ruuvitags = [];
    export let cols = [];
    // export let config = {};
    function columnChange(event) {
        const name = event.detail.name;
        const index = cols.findIndex(c => c.field === name);
        cols[index] = cols[index];
    }
</script>

<strong>Discover</strong>
<ColumsSelect {cols} on:changed={columnChange}/>
<Table class="table-sm font-weight-lighter small" responsive>
    <thead>
        <tr>
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
                {#each cols as col (col.field)}
                    {#if col.show}
                        <td class="{col.class || `text-right`}">
                            {#if col.render === `measure`}
                                <CellMeasure {col} {tag}/>
                            {/if}
                            {#if col.render === `text`}
                                <CellText {col} {tag}/>
                            {/if}
                            {#if col.render === `date`}
                                <CellDate {col} {tag}/>
                            {/if}
                        </td>
                    {/if}
                {/each}
                <td class="text-center">
                    {#if indexedTags[tag.id]}
                        {#each indexedTags[tag.id].targets as target (target.id)}
                            <CellDatabase {target} {tag} />
                        {/each}
                    {/if}
                </td>
                <td class="text-center">
                    <CellInfo {tag} {cols} />
                </td>
            </tr>
        {/each}
    </tbody>
</Table>
