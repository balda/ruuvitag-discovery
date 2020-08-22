<script>
    import { Table } from 'sveltestrap';
	import ColumsSelect from './ColumsSelect.svelte';
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
                <th>{col.field}</th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each tags as tag (tag.id)}
            <tr>
                {#each cols as col (col.field)}
                    <td>
                        {tag[col.field] || tag.last[col.field]}
                    </td>
                {/each}
            </tr>
        {/each}
    </tbody>
</Table>
