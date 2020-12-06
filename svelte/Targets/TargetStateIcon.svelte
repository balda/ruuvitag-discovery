<script>
    import Tooltip from './../UI/Tooltip.svelte';
    export let target = {};
    $: title = `Target ${1 * target.enable ? `enable` : `disable`}`;
    $: color = 1 * target.enable ? `text-success` : `text-muted`;
</script>

<Tooltip tip="{title}" right >
    <span class="{color}">
        <i class="fas fa-dot-circle fa-sm"></i>
    </span>
</Tooltip>
