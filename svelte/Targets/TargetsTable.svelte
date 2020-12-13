<script>
    import { api, tags, cols } from './../store/api.js';
    import { targets } from './../store/targets.js';
    import { Button, Table, Row, Col } from 'sveltestrap';
    import Tooltip from './../UI/Tooltip.svelte';
    import TargetStateIcon from './TargetStateIcon.svelte';
    import TargetType from './TargetType.svelte';
	import Cell from './../Discover/Cell.svelte';
    export let edited;
    async function deleteTarget(target) {
        // state = `saving`;
        if (confirm(`Confirm Delete`)) {
            try {
                targets.set(await api.post(`target/delete`, {
                    id: target.id
                }));
            } catch(error) {
                console.log(error);
            }
        }
        // state = `view`;
    };
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
        {#each $targets as target (target.id)}
            <tr>
                <td class="text-left">
                    <TargetStateIcon {target} />
                    <span class="ml-2">
                        {target.name}
                    </span>
                </td>
                <td class="text-left">
                    <TargetType {target} />
                </td>
                <td class="text-left">
                    {target.measurement || `n/a`}
                </td>
                <td class="text-left">
                    {1 * target.interval === 0 ? `live` : target.interval}
                </td>
                <td class="text-left">
                    {#if target.tags}
                        {#each Object.keys(target.tags) as id (id)}
                            <Row class="mb-3">
                                <Col>
                                    <div class="font-weight-bolder mb-1">
                                        {target.tags[id].name}
                                    </div>
                                    <div>
                                        <em>{target.tags[id].field}</em>
                                    </div>
                                </Col>
                                <Col>
                                    <div>
                                        {Object.keys(target.tags[id].measures).length} measure{Object.keys(target.tags[id].measures).length > 1 ? `s` : ``}
                                    </div>
                                    {#each Object.keys(target.tags[id].measures) as measure (measure)}
                                        <div class="pl-1">
                                            - {target.tags[id].measures[measure].label}
                                            (<em>{target.tags[id].measures[measure].field}</em>)
                                            <span class="float-right">
                                                <Cell
                                                 col={$cols.find(col => col.field === measure)}
                                                 tag={$tags.find(tag => tag.id === id)}
                                                 source="last"
                                                 showUnit="true"
                                                />
                                            </span>
                                        </div>
                                    {/each}
                                </Col>
                            </Row>
                        {/each}
                    {:else}
                        <em>none</em>
                    {/if}
                </td>
                <td class="text-center">
                    <a href="/" on:click|preventDefault={e => deleteTarget(target)}
                     class="btn btn-link text-danger btn-sm mr-2">
                        Delete
                    </a>
                    <a href="/" on:click|preventDefault={() => edited = target.id * 1}
                     class="btn btn-light btn-sm">
                        Edit
                    </a>
                </td>
            </tr>
        {/each}
    </tbody>
</Table>
