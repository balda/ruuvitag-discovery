<script>
    // import { createEventDispatcher } from 'svelte';
    import { CustomInput } from 'sveltestrap';
    export let show = false;
    export let field;
    export let label;
    // const dispatch = createEventDispatcher();
    // let showSelectColumns = false;
    // function changeColumn(event) {
    //     dispatch(`changed`, {
    //         col: event.target.name,
    //     });
    // };
    // on:change={changeColumn}
</script>

<CustomInput
    bind:checked={show}
    type="switch"
    bsSize="sm"
    inline=true
    id="show_{field}"
    name="{field}"
    label="{label || field}" />
