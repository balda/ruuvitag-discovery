<script>
    import { dictTargets } from './../store/dict.js';
    export let target = {};
    $: type = $dictTargets.find(t => {
        return `${target.type}` === `${t.type}`;
    });
    $: title = type ? type.label : ``;
</script>

{title}
