<script>
    export let target = {};
    export let config = [];
    $: type = config.find(t => {
        return `${target.type}` === `${t.type}`;
    });
    $: title = type ? type.label : ``;
</script>

{title}
