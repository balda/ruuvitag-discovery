<script>
    // import { afterUpdate } from 'svelte';
    // import { fade } from 'svelte/transition';
    export let tag = {};
    // let element;
    // afterUpdate(() => {
    //     console.log(`tag updated`);
    //     console.log(tag);
    //     element.style.transition = 'color 1s, background 1s';
    //     element.style.color = '';
    //     element.style.backgroundColor = '';
    // });
</script>

<style>
.updated{
    animation: 1s ease 0s normal forwards 1 fadein;
}
@keyframes fadein{
    0% { opacity:1; }
    66% { opacity:1; }
    100% { opacity:0; }
}
</style>

<div class="updated">
    <i class="fas fa-sync"/>
</div>
