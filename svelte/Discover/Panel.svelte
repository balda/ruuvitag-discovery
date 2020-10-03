<script>
    import { Table } from 'sveltestrap';
	import ColumsSelect from './ColumsSelect.svelte';
	import CellMeasure from './Cell/Measure.svelte';
	import CellText from './Cell/Text.svelte';
    import CellDate from './Cell/Date.svelte';
    export let tags = [];
    // export let targets = [];
    // export let ruuvitags = [];
    export let cols = [];
    // export let config = {};
</script>

<strong>Discover</strong>
<ColumsSelect {cols}/>
<Table class="table-sm font-weight-lighter small" responsive>
    <thead>
        <tr>
            {#each cols as col (col.field)}
                <th class="{col.class || `text-right`}">
                    {col.label || col.field}
                </th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each tags as tag (tag.id)}
            <tr>
                {#each cols as col (col.field)}
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
                {/each}
            </tr>
        {/each}
    </tbody>
</Table>
