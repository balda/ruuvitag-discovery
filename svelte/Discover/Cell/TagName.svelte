<script>
    import { api } from './../../store/api.js';
    import { config } from './../../store/config.js';
    import {
        Button,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        InputGroup,
        InputGroupAddon,
        InputGroupText,
    } from 'sveltestrap';
    import Tooltip from './../../UI/Tooltip.svelte';
    export let tag = {};
    let state = `view`; // `view` | `saving`
    let open = false;
    let tagName = ``;
    if (tag.id && $config.ruuvitags[tag.id]) {
        tagName = $config.ruuvitags[tag.id];
    }
    let value = `${tagName}`;
    const toggle = () => {
        open = !open;
        if (!open) {
            value = `${tagName}`;
        }
    };
    async function save() {
        state = `saving`;
        try {
            const ruuvitags = JSON.parse(JSON.stringify($config.ruuvitags));
            if (value === ``) {
                delete ruuvitags[tag.id];
            } else {
                ruuvitags[tag.id] = value;
            }
            await api.post(`config`, {
                ruuvitags,
            });
            $config.ruuvitags = ruuvitags;
        } catch(error) {
            console.log(error);
        }
        state = `view`;
        open = false;
    }
</script>

<a on:click|preventDefault={toggle} href="/" class="mr-1 fa-sm text-primary">
    <i class="fas fa-edit"></i>
</a>
<Tooltip tip="{tag.id}" >
    {tagName !== `` ? tagName : tag.id.substring(0,4)}
</Tooltip>
<Modal isOpen={open} {toggle} size="lg">
    <ModalHeader {toggle}>
        Rename RuuviTag
        <span class="font-weight-lighter mx-2">
            {tag.id}
        </span>
    </ModalHeader>
    <ModalBody>
        <div class="container-fluid small">
            <label>Name</label>
            <InputGroup size="sm">
                <input type="text"
                 bind:value
                 name="ruuvitag-name"
                 placeholder="{tag.id.substring(0,4)}"
                 disabled={state === `saving` ? `disabled` : null}
                 class="form-control form-control-sm">
                <InputGroupAddon addonType="append">
                    <InputGroupText>
                        <a on:click|preventDefault={() => {value = ``}} href="/" class="text-dark">
                            <i class="fas fa-times"></i>
                        </a>
                    </InputGroupText>
                </InputGroupAddon>
            </InputGroup>
        </div>
    </ModalBody>
    <ModalFooter>
        <Button class="btn btn-light btn-sm mr-4" on:click={toggle}>Cancel</Button>
        <a href="/" on:click|preventDefault={save} class="btn btn-light btn-sm mr-3 {state === `saving` ? `disabled` : null}">
            Save
        </a>
    </ModalFooter>
</Modal>
