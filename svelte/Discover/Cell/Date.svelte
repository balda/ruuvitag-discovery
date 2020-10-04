<script>
    import Tooltip from './../../UI/Tooltip.svelte';
    export let tag = {};
    export let col = {};
    let value = tag[col.field] || tag.last[col.field];
    let date = moment(value);
</script>

<Tooltip tip="{date.format(`YYYY-MM-DD HH:mm:ss`)}" left >
	<!-- {date.format(`HH:mm:ss`)} -->
    {Math.round((Date.now() - tag.last[col.field]) / 1000)}
</Tooltip>
