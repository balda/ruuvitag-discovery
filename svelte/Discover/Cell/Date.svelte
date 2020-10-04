<script>
    import Tooltip from './../../UI/Tooltip.svelte';
    export let tag = {};
    export let col = {};
    export let source = `last`;
    $: value = tag[source][col.field];
    $: date = moment(value);
</script>

<Tooltip tip="{date.format(`YYYY-MM-DD HH:mm:ss`)}" left >
	{date.format(`HH[h]mm`)}
</Tooltip>
