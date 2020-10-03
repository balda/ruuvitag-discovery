var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_options(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            option.selected = ~value.indexOf(option.__value);
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function isObject(value) {
      const type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    function getColumnSizeClass(isXs, colWidth, colSize) {
      if (colSize === true || colSize === '') {
        return isXs ? 'col' : `col-${colWidth}`;
      } else if (colSize === 'auto') {
        return isXs ? 'col-auto' : `col-${colWidth}-auto`;
      }

      return isXs ? `col-${colSize}` : `col-${colWidth}-${colSize}`;
    }

    function toClassName(value) {
      let result = '';

      if (typeof value === 'string' || typeof value === 'number') {
        result += value;
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result = value.map(toClassName).filter(Boolean).join(' ');
        } else {
          for (let key in value) {
            if (value[key]) {
              result && (result += ' ');
              result += key;
            }
          }
        }
      }

      return result;
    }

    function classnames(...args) {
      return args.map(toClassName).filter(Boolean).join(' ');
    }

    /* node_modules/sveltestrap/src/Col.svelte generated by Svelte v3.29.0 */
    const file = "node_modules/sveltestrap/src/Col.svelte";

    function create_fragment(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	let div_levels = [
    		/*$$restProps*/ ctx[1],
    		{
    			class: div_class_value = /*colClasses*/ ctx[0].join(" ")
    		}
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file, 58, 0, 1388);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				{ class: div_class_value }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","xs","sm","md","lg","xl"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Col", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { xs = undefined } = $$props;
    	let { sm = undefined } = $$props;
    	let { md = undefined } = $$props;
    	let { lg = undefined } = $$props;
    	let { xl = undefined } = $$props;
    	const colClasses = [];
    	const lookup = { xs, sm, md, lg, xl };

    	Object.keys(lookup).forEach(colWidth => {
    		const columnProp = lookup[colWidth];

    		if (!columnProp && columnProp !== "") {
    			return; //no value for this width
    		}

    		const isXs = colWidth === "xs";

    		if (isObject(columnProp)) {
    			const colSizeInterfix = isXs ? "-" : `-${colWidth}-`;
    			const colClass = getColumnSizeClass(isXs, colWidth, columnProp.size);

    			if (columnProp.size || columnProp.size === "") {
    				colClasses.push(colClass);
    			}

    			if (columnProp.push) {
    				colClasses.push(`push${colSizeInterfix}${columnProp.push}`);
    			}

    			if (columnProp.pull) {
    				colClasses.push(`pull${colSizeInterfix}${columnProp.pull}`);
    			}

    			if (columnProp.offset) {
    				colClasses.push(`offset${colSizeInterfix}${columnProp.offset}`);
    			}
    		} else {
    			colClasses.push(getColumnSizeClass(isXs, colWidth, columnProp));
    		}
    	});

    	if (!colClasses.length) {
    		colClasses.push("col");
    	}

    	if (className) {
    		colClasses.push(className);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("xs" in $$new_props) $$invalidate(3, xs = $$new_props.xs);
    		if ("sm" in $$new_props) $$invalidate(4, sm = $$new_props.sm);
    		if ("md" in $$new_props) $$invalidate(5, md = $$new_props.md);
    		if ("lg" in $$new_props) $$invalidate(6, lg = $$new_props.lg);
    		if ("xl" in $$new_props) $$invalidate(7, xl = $$new_props.xl);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getColumnSizeClass,
    		isObject,
    		className,
    		xs,
    		sm,
    		md,
    		lg,
    		xl,
    		colClasses,
    		lookup
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("xs" in $$props) $$invalidate(3, xs = $$new_props.xs);
    		if ("sm" in $$props) $$invalidate(4, sm = $$new_props.sm);
    		if ("md" in $$props) $$invalidate(5, md = $$new_props.md);
    		if ("lg" in $$props) $$invalidate(6, lg = $$new_props.lg);
    		if ("xl" in $$props) $$invalidate(7, xl = $$new_props.xl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [colClasses, $$restProps, className, xs, sm, md, lg, xl, $$scope, slots];
    }

    class Col extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			class: 2,
    			xs: 3,
    			sm: 4,
    			md: 5,
    			lg: 6,
    			xl: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Col",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get class() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xs() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xs(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get md() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set md(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xl() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xl(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Container.svelte generated by Svelte v3.29.0 */
    const file$1 = "node_modules/sveltestrap/src/Container.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$1, 10, 0, 220);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","fluid"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Container", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { fluid = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("fluid" in $$new_props) $$invalidate(3, fluid = $$new_props.fluid);
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, fluid, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("fluid" in $$props) $$invalidate(3, fluid = $$new_props.fluid);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	let classes;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, fluid*/ 12) {
    			 $$invalidate(0, classes = classnames(className, fluid ? "container-fluid" : "container"));
    		}
    	};

    	return [classes, $$restProps, className, fluid, $$scope, slots];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { class: 2, fluid: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get class() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fluid() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fluid(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/CustomInput.svelte generated by Svelte v3.29.0 */
    const file$2 = "node_modules/sveltestrap/src/CustomInput.svelte";

    // (116:0) {:else}
    function create_else_block(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[14],
    		{ type: /*type*/ ctx[4] },
    		{ id: /*id*/ ctx[3] },
    		{ class: /*combinedClasses*/ ctx[9] },
    		{ name: /*name*/ ctx[2] },
    		{ disabled: /*disabled*/ ctx[6] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$2, 116, 2, 2501);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_4*/ ctx[39], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_4*/ ctx[40], false, false, false),
    					listen_dev(input, "change", /*change_handler_4*/ ctx[41], false, false, false),
    					listen_dev(input, "input", /*input_handler_4*/ ctx[42], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 16384 && /*$$restProps*/ ctx[14],
    				dirty[0] & /*type*/ 16 && { type: /*type*/ ctx[4] },
    				dirty[0] & /*id*/ 8 && { id: /*id*/ ctx[3] },
    				dirty[0] & /*combinedClasses*/ 512 && { class: /*combinedClasses*/ ctx[9] },
    				dirty[0] & /*name*/ 4 && { name: /*name*/ ctx[2] },
    				dirty[0] & /*disabled*/ 64 && { disabled: /*disabled*/ ctx[6] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(116:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (99:27) 
    function create_if_block_3(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label_1;
    	let t1;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[14],
    		{ id: /*id*/ ctx[3] },
    		{ type: "radio" },
    		{ class: /*customControlClasses*/ ctx[12] },
    		{ name: /*name*/ ctx[2] },
    		{ disabled: /*disabled*/ ctx[6] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const default_slot_template = /*#slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label_1 = element("label");
    			t1 = text(/*label*/ ctx[5]);
    			t2 = space();
    			if (default_slot) default_slot.c();
    			set_attributes(input, input_data);
    			add_location(input, file$2, 100, 4, 2186);
    			attr_dev(label_1, "class", "custom-control-label");
    			attr_dev(label_1, "for", /*labelHtmlFor*/ ctx[13]);
    			add_location(label_1, file$2, 112, 4, 2398);
    			attr_dev(div, "class", /*wrapperClasses*/ ctx[11]);
    			add_location(div, file$2, 99, 2, 2153);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label_1);
    			append_dev(label_1, t1);
    			append_dev(div, t2);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_3*/ ctx[35], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_3*/ ctx[36], false, false, false),
    					listen_dev(input, "change", /*change_handler_3*/ ctx[37], false, false, false),
    					listen_dev(input, "input", /*input_handler_3*/ ctx[38], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 16384 && /*$$restProps*/ ctx[14],
    				(!current || dirty[0] & /*id*/ 8) && { id: /*id*/ ctx[3] },
    				{ type: "radio" },
    				(!current || dirty[0] & /*customControlClasses*/ 4096) && { class: /*customControlClasses*/ ctx[12] },
    				(!current || dirty[0] & /*name*/ 4) && { name: /*name*/ ctx[2] },
    				(!current || dirty[0] & /*disabled*/ 64) && { disabled: /*disabled*/ ctx[6] },
    				(!current || dirty[0] & /*placeholder*/ 128) && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (!current || dirty[0] & /*label*/ 32) set_data_dev(t1, /*label*/ ctx[5]);

    			if (!current || dirty[0] & /*labelHtmlFor*/ 8192) {
    				attr_dev(label_1, "for", /*labelHtmlFor*/ ctx[13]);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 2097152) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[21], dirty, null, null);
    				}
    			}

    			if (!current || dirty[0] & /*wrapperClasses*/ 2048) {
    				attr_dev(div, "class", /*wrapperClasses*/ ctx[11]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(99:27) ",
    		ctx
    	});

    	return block;
    }

    // (81:51) 
    function create_if_block_2(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label_1;
    	let t1;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[14],
    		{ id: /*id*/ ctx[3] },
    		{ type: "checkbox" },
    		{ class: /*customControlClasses*/ ctx[12] },
    		{ name: /*name*/ ctx[2] },
    		{ disabled: /*disabled*/ ctx[6] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const default_slot_template = /*#slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label_1 = element("label");
    			t1 = text(/*label*/ ctx[5]);
    			t2 = space();
    			if (default_slot) default_slot.c();
    			set_attributes(input, input_data);
    			add_location(input, file$2, 82, 4, 1796);
    			attr_dev(label_1, "class", "custom-control-label");
    			attr_dev(label_1, "for", /*labelHtmlFor*/ ctx[13]);
    			add_location(label_1, file$2, 95, 4, 2030);
    			attr_dev(div, "class", /*wrapperClasses*/ ctx[11]);
    			add_location(div, file$2, 81, 2, 1763);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			input.checked = /*checked*/ ctx[0];
    			append_dev(div, t0);
    			append_dev(div, label_1);
    			append_dev(label_1, t1);
    			append_dev(div, t2);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[44]),
    					listen_dev(input, "blur", /*blur_handler_2*/ ctx[31], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_2*/ ctx[32], false, false, false),
    					listen_dev(input, "change", /*change_handler_2*/ ctx[33], false, false, false),
    					listen_dev(input, "input", /*input_handler_2*/ ctx[34], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 16384 && /*$$restProps*/ ctx[14],
    				(!current || dirty[0] & /*id*/ 8) && { id: /*id*/ ctx[3] },
    				{ type: "checkbox" },
    				(!current || dirty[0] & /*customControlClasses*/ 4096) && { class: /*customControlClasses*/ ctx[12] },
    				(!current || dirty[0] & /*name*/ 4) && { name: /*name*/ ctx[2] },
    				(!current || dirty[0] & /*disabled*/ 64) && { disabled: /*disabled*/ ctx[6] },
    				(!current || dirty[0] & /*placeholder*/ 128) && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}

    			if (!current || dirty[0] & /*label*/ 32) set_data_dev(t1, /*label*/ ctx[5]);

    			if (!current || dirty[0] & /*labelHtmlFor*/ 8192) {
    				attr_dev(label_1, "for", /*labelHtmlFor*/ ctx[13]);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 2097152) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[21], dirty, null, null);
    				}
    			}

    			if (!current || dirty[0] & /*wrapperClasses*/ 2048) {
    				attr_dev(div, "class", /*wrapperClasses*/ ctx[11]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(81:51) ",
    		ctx
    	});

    	return block;
    }

    // (63:26) 
    function create_if_block_1(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label_1;
    	let t1_value = (/*label*/ ctx[5] || "Choose file") + "";
    	let t1;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[14],
    		{ id: /*id*/ ctx[3] },
    		{ type: "file" },
    		{ class: /*fileClasses*/ ctx[10] },
    		{ name: /*name*/ ctx[2] },
    		{ disabled: /*disabled*/ ctx[6] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label_1 = element("label");
    			t1 = text(t1_value);
    			set_attributes(input, input_data);
    			add_location(input, file$2, 64, 4, 1401);
    			attr_dev(label_1, "class", "custom-file-label");
    			attr_dev(label_1, "for", /*labelHtmlFor*/ ctx[13]);
    			add_location(label_1, file$2, 76, 4, 1603);
    			attr_dev(div, "class", /*customClass*/ ctx[8]);
    			add_location(div, file$2, 63, 2, 1371);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label_1);
    			append_dev(label_1, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_1*/ ctx[27], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_1*/ ctx[28], false, false, false),
    					listen_dev(input, "change", /*change_handler_1*/ ctx[29], false, false, false),
    					listen_dev(input, "input", /*input_handler_1*/ ctx[30], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 16384 && /*$$restProps*/ ctx[14],
    				dirty[0] & /*id*/ 8 && { id: /*id*/ ctx[3] },
    				{ type: "file" },
    				dirty[0] & /*fileClasses*/ 1024 && { class: /*fileClasses*/ ctx[10] },
    				dirty[0] & /*name*/ 4 && { name: /*name*/ ctx[2] },
    				dirty[0] & /*disabled*/ 64 && { disabled: /*disabled*/ ctx[6] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*label*/ 32 && t1_value !== (t1_value = (/*label*/ ctx[5] || "Choose file") + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*labelHtmlFor*/ 8192) {
    				attr_dev(label_1, "for", /*labelHtmlFor*/ ctx[13]);
    			}

    			if (dirty[0] & /*customClass*/ 256) {
    				attr_dev(div, "class", /*customClass*/ ctx[8]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(63:26) ",
    		ctx
    	});

    	return block;
    }

    // (48:0) {#if type === 'select'}
    function create_if_block(ctx) {
    	let select;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);

    	let select_levels = [
    		/*$$restProps*/ ctx[14],
    		{ id: /*id*/ ctx[3] },
    		{ class: /*combinedClasses*/ ctx[9] },
    		{ name: /*name*/ ctx[2] },
    		{ disabled: /*disabled*/ ctx[6] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let select_data = {};

    	for (let i = 0; i < select_levels.length; i += 1) {
    		select_data = assign(select_data, select_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			if (default_slot) default_slot.c();
    			set_attributes(select, select_data);
    			if (/*value*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[43].call(select));
    			add_location(select, file$2, 48, 2, 1139);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			if (select_data.multiple) select_options(select, select_data.value);
    			select_option(select, /*value*/ ctx[1]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "blur", /*blur_handler*/ ctx[23], false, false, false),
    					listen_dev(select, "focus", /*focus_handler*/ ctx[24], false, false, false),
    					listen_dev(select, "change", /*change_handler*/ ctx[25], false, false, false),
    					listen_dev(select, "input", /*input_handler*/ ctx[26], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[43])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 2097152) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[21], dirty, null, null);
    				}
    			}

    			set_attributes(select, select_data = get_spread_update(select_levels, [
    				dirty[0] & /*$$restProps*/ 16384 && /*$$restProps*/ ctx[14],
    				(!current || dirty[0] & /*id*/ 8) && { id: /*id*/ ctx[3] },
    				(!current || dirty[0] & /*combinedClasses*/ 512) && { class: /*combinedClasses*/ ctx[9] },
    				(!current || dirty[0] & /*name*/ 4) && { name: /*name*/ ctx[2] },
    				(!current || dirty[0] & /*disabled*/ 64) && { disabled: /*disabled*/ ctx[6] },
    				(!current || dirty[0] & /*placeholder*/ 128) && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*$$restProps, id, combinedClasses, name, disabled, placeholder*/ 17100 && select_data.multiple) select_options(select, select_data.value);

    			if (dirty[0] & /*value*/ 2) {
    				select_option(select, /*value*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(48:0) {#if type === 'select'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[4] === "select") return 0;
    		if (/*type*/ ctx[4] === "file") return 1;
    		if (/*type*/ ctx[4] === "switch" || /*type*/ ctx[4] === "checkbox") return 2;
    		if (/*type*/ ctx[4] === "radio") return 3;
    		return 4;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"class","name","id","type","label","checked","disabled","inline","valid","value","invalid","bsSize","placeholder","for"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CustomInput", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { name = "" } = $$props;
    	let { id = undefined } = $$props;
    	let { type = null } = $$props;
    	let { label = "" } = $$props;
    	let { checked = false } = $$props;
    	let { disabled = false } = $$props;
    	let { inline = false } = $$props;
    	let { valid = false } = $$props;
    	let { value = "" } = $$props;
    	let { invalid = false } = $$props;
    	let { bsSize = "" } = $$props;
    	let { placeholder = "" } = $$props;
    	let { for: htmlFor = "" } = $$props;

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_1(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_2(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_2(event) {
    		bubble($$self, event);
    	}

    	function change_handler_2(event) {
    		bubble($$self, event);
    	}

    	function input_handler_2(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_3(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_3(event) {
    		bubble($$self, event);
    	}

    	function change_handler_3(event) {
    		bubble($$self, event);
    	}

    	function input_handler_3(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_4(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_4(event) {
    		bubble($$self, event);
    	}

    	function change_handler_4(event) {
    		bubble($$self, event);
    	}

    	function input_handler_4(event) {
    		bubble($$self, event);
    	}

    	function select_change_handler() {
    		value = select_value(this);
    		$$invalidate(1, value);
    	}

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(14, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(15, className = $$new_props.class);
    		if ("name" in $$new_props) $$invalidate(2, name = $$new_props.name);
    		if ("id" in $$new_props) $$invalidate(3, id = $$new_props.id);
    		if ("type" in $$new_props) $$invalidate(4, type = $$new_props.type);
    		if ("label" in $$new_props) $$invalidate(5, label = $$new_props.label);
    		if ("checked" in $$new_props) $$invalidate(0, checked = $$new_props.checked);
    		if ("disabled" in $$new_props) $$invalidate(6, disabled = $$new_props.disabled);
    		if ("inline" in $$new_props) $$invalidate(16, inline = $$new_props.inline);
    		if ("valid" in $$new_props) $$invalidate(17, valid = $$new_props.valid);
    		if ("value" in $$new_props) $$invalidate(1, value = $$new_props.value);
    		if ("invalid" in $$new_props) $$invalidate(18, invalid = $$new_props.invalid);
    		if ("bsSize" in $$new_props) $$invalidate(19, bsSize = $$new_props.bsSize);
    		if ("placeholder" in $$new_props) $$invalidate(7, placeholder = $$new_props.placeholder);
    		if ("for" in $$new_props) $$invalidate(20, htmlFor = $$new_props.for);
    		if ("$$scope" in $$new_props) $$invalidate(21, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		name,
    		id,
    		type,
    		label,
    		checked,
    		disabled,
    		inline,
    		valid,
    		value,
    		invalid,
    		bsSize,
    		placeholder,
    		htmlFor,
    		customClass,
    		validationClassNames,
    		combinedClasses,
    		fileClasses,
    		wrapperClasses,
    		customControlClasses,
    		labelHtmlFor
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(15, className = $$new_props.className);
    		if ("name" in $$props) $$invalidate(2, name = $$new_props.name);
    		if ("id" in $$props) $$invalidate(3, id = $$new_props.id);
    		if ("type" in $$props) $$invalidate(4, type = $$new_props.type);
    		if ("label" in $$props) $$invalidate(5, label = $$new_props.label);
    		if ("checked" in $$props) $$invalidate(0, checked = $$new_props.checked);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$new_props.disabled);
    		if ("inline" in $$props) $$invalidate(16, inline = $$new_props.inline);
    		if ("valid" in $$props) $$invalidate(17, valid = $$new_props.valid);
    		if ("value" in $$props) $$invalidate(1, value = $$new_props.value);
    		if ("invalid" in $$props) $$invalidate(18, invalid = $$new_props.invalid);
    		if ("bsSize" in $$props) $$invalidate(19, bsSize = $$new_props.bsSize);
    		if ("placeholder" in $$props) $$invalidate(7, placeholder = $$new_props.placeholder);
    		if ("htmlFor" in $$props) $$invalidate(20, htmlFor = $$new_props.htmlFor);
    		if ("customClass" in $$props) $$invalidate(8, customClass = $$new_props.customClass);
    		if ("validationClassNames" in $$props) $$invalidate(45, validationClassNames = $$new_props.validationClassNames);
    		if ("combinedClasses" in $$props) $$invalidate(9, combinedClasses = $$new_props.combinedClasses);
    		if ("fileClasses" in $$props) $$invalidate(10, fileClasses = $$new_props.fileClasses);
    		if ("wrapperClasses" in $$props) $$invalidate(11, wrapperClasses = $$new_props.wrapperClasses);
    		if ("customControlClasses" in $$props) $$invalidate(12, customControlClasses = $$new_props.customControlClasses);
    		if ("labelHtmlFor" in $$props) $$invalidate(13, labelHtmlFor = $$new_props.labelHtmlFor);
    	};

    	let customClass;
    	let validationClassNames;
    	let combinedClasses;
    	let fileClasses;
    	let wrapperClasses;
    	let customControlClasses;
    	let labelHtmlFor;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*className, type, bsSize*/ 557072) {
    			 $$invalidate(8, customClass = classnames(className, `custom-${type}`, bsSize ? `custom-${type}-${bsSize}` : false));
    		}

    		if ($$self.$$.dirty[0] & /*invalid, valid*/ 393216) {
    			 $$invalidate(45, validationClassNames = classnames(invalid && "is-invalid", valid && "is-valid"));
    		}

    		if ($$self.$$.dirty[0] & /*customClass*/ 256 | $$self.$$.dirty[1] & /*validationClassNames*/ 16384) {
    			 $$invalidate(9, combinedClasses = classnames(customClass, validationClassNames));
    		}

    		if ($$self.$$.dirty[1] & /*validationClassNames*/ 16384) {
    			 $$invalidate(10, fileClasses = classnames(validationClassNames, "custom-file-input"));
    		}

    		if ($$self.$$.dirty[0] & /*customClass, inline*/ 65792) {
    			 $$invalidate(11, wrapperClasses = classnames(customClass, "custom-control", { "custom-control-inline": inline }));
    		}

    		if ($$self.$$.dirty[1] & /*validationClassNames*/ 16384) {
    			 $$invalidate(12, customControlClasses = classnames(validationClassNames, "custom-control-input"));
    		}

    		if ($$self.$$.dirty[0] & /*htmlFor, id*/ 1048584) {
    			 $$invalidate(13, labelHtmlFor = htmlFor || id);
    		}
    	};

    	return [
    		checked,
    		value,
    		name,
    		id,
    		type,
    		label,
    		disabled,
    		placeholder,
    		customClass,
    		combinedClasses,
    		fileClasses,
    		wrapperClasses,
    		customControlClasses,
    		labelHtmlFor,
    		$$restProps,
    		className,
    		inline,
    		valid,
    		invalid,
    		bsSize,
    		htmlFor,
    		$$scope,
    		slots,
    		blur_handler,
    		focus_handler,
    		change_handler,
    		input_handler,
    		blur_handler_1,
    		focus_handler_1,
    		change_handler_1,
    		input_handler_1,
    		blur_handler_2,
    		focus_handler_2,
    		change_handler_2,
    		input_handler_2,
    		blur_handler_3,
    		focus_handler_3,
    		change_handler_3,
    		input_handler_3,
    		blur_handler_4,
    		focus_handler_4,
    		change_handler_4,
    		input_handler_4,
    		select_change_handler,
    		input_change_handler
    	];
    }

    class CustomInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				class: 15,
    				name: 2,
    				id: 3,
    				type: 4,
    				label: 5,
    				checked: 0,
    				disabled: 6,
    				inline: 16,
    				valid: 17,
    				value: 1,
    				invalid: 18,
    				bsSize: 19,
    				placeholder: 7,
    				for: 20
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CustomInput",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get class() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inline() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inline(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valid() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valid(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bsSize() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bsSize(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get for() {
    		throw new Error("<CustomInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set for(value) {
    		throw new Error("<CustomInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/FormGroup.svelte generated by Svelte v3.29.0 */
    const file$3 = "node_modules/sveltestrap/src/FormGroup.svelte";

    // (25:0) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
    	let div_levels = [/*$$restProps*/ ctx[2], { class: /*classes*/ ctx[1] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$3, 25, 2, 574);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(25:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if tag === 'fieldset'}
    function create_if_block$1(ctx) {
    	let fieldset;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
    	let fieldset_levels = [/*$$restProps*/ ctx[2], { class: /*classes*/ ctx[1] }];
    	let fieldset_data = {};

    	for (let i = 0; i < fieldset_levels.length; i += 1) {
    		fieldset_data = assign(fieldset_data, fieldset_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			if (default_slot) default_slot.c();
    			set_attributes(fieldset, fieldset_data);
    			add_location(fieldset, file$3, 21, 2, 493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);

    			if (default_slot) {
    				default_slot.m(fieldset, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(fieldset, fieldset_data = get_spread_update(fieldset_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(21:0) {#if tag === 'fieldset'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tag*/ ctx[0] === "fieldset") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","row","check","inline","disabled","tag"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FormGroup", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { row = false } = $$props;
    	let { check = false } = $$props;
    	let { inline = false } = $$props;
    	let { disabled = false } = $$props;
    	let { tag = null } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ("row" in $$new_props) $$invalidate(4, row = $$new_props.row);
    		if ("check" in $$new_props) $$invalidate(5, check = $$new_props.check);
    		if ("inline" in $$new_props) $$invalidate(6, inline = $$new_props.inline);
    		if ("disabled" in $$new_props) $$invalidate(7, disabled = $$new_props.disabled);
    		if ("tag" in $$new_props) $$invalidate(0, tag = $$new_props.tag);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		row,
    		check,
    		inline,
    		disabled,
    		tag,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
    		if ("row" in $$props) $$invalidate(4, row = $$new_props.row);
    		if ("check" in $$props) $$invalidate(5, check = $$new_props.check);
    		if ("inline" in $$props) $$invalidate(6, inline = $$new_props.inline);
    		if ("disabled" in $$props) $$invalidate(7, disabled = $$new_props.disabled);
    		if ("tag" in $$props) $$invalidate(0, tag = $$new_props.tag);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	let classes;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, row, check, inline, disabled*/ 248) {
    			 $$invalidate(1, classes = classnames(className, row ? "row" : false, check ? "form-check" : "form-group", check && inline ? "form-check-inline" : false, check && disabled ? "disabled" : false));
    		}
    	};

    	return [
    		tag,
    		classes,
    		$$restProps,
    		className,
    		row,
    		check,
    		inline,
    		disabled,
    		$$scope,
    		slots
    	];
    }

    class FormGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			class: 3,
    			row: 4,
    			check: 5,
    			inline: 6,
    			disabled: 7,
    			tag: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormGroup",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get class() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get row() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get check() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set check(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inline() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inline(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tag() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Label.svelte generated by Svelte v3.29.0 */
    const file$4 = "node_modules/sveltestrap/src/Label.svelte";

    function create_fragment$4(ctx) {
    	let label;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

    	let label_levels = [
    		/*$$restProps*/ ctx[2],
    		{ class: /*classes*/ ctx[1] },
    		{ for: /*fore*/ ctx[0] }
    	];

    	let label_data = {};

    	for (let i = 0; i < label_levels.length; i += 1) {
    		label_data = assign(label_data, label_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			if (default_slot) default_slot.c();
    			set_attributes(label, label_data);
    			add_location(label, file$4, 69, 0, 1625);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);

    			if (default_slot) {
    				default_slot.m(label, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8192) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[13], dirty, null, null);
    				}
    			}

    			set_attributes(label, label_data = get_spread_update(label_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] },
    				(!current || dirty & /*fore*/ 1) && { for: /*fore*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","hidden","check","size","for","xs","sm","md","lg","xl","widths"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Label", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { hidden = false } = $$props;
    	let { check = false } = $$props;
    	let { size = "" } = $$props;
    	let { for: fore = null } = $$props;
    	let { xs = "" } = $$props;
    	let { sm = "" } = $$props;
    	let { md = "" } = $$props;
    	let { lg = "" } = $$props;
    	let { xl = "" } = $$props;
    	const colWidths = { xs, sm, md, lg, xl };
    	let { widths = Object.keys(colWidths) } = $$props;
    	const colClasses = [];

    	widths.forEach(colWidth => {
    		let columnProp = $$props[colWidth];

    		if (!columnProp && columnProp !== "") {
    			return;
    		}

    		const isXs = colWidth === "xs";
    		let colClass;

    		if (isObject(columnProp)) {
    			const colSizeInterfix = isXs ? "-" : `-${colWidth}-`;
    			colClass = getColumnSizeClass(isXs, colWidth, columnProp.size);

    			colClasses.push(classnames({
    				[colClass]: columnProp.size || columnProp.size === "",
    				[`order${colSizeInterfix}${columnProp.order}`]: columnProp.order || columnProp.order === 0,
    				[`offset${colSizeInterfix}${columnProp.offset}`]: columnProp.offset || columnProp.offset === 0
    			}));
    		} else {
    			colClass = getColumnSizeClass(isXs, colWidth, columnProp);
    			colClasses.push(colClass);
    		}
    	});

    	$$self.$$set = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ("hidden" in $$new_props) $$invalidate(4, hidden = $$new_props.hidden);
    		if ("check" in $$new_props) $$invalidate(5, check = $$new_props.check);
    		if ("size" in $$new_props) $$invalidate(6, size = $$new_props.size);
    		if ("for" in $$new_props) $$invalidate(0, fore = $$new_props.for);
    		if ("xs" in $$new_props) $$invalidate(7, xs = $$new_props.xs);
    		if ("sm" in $$new_props) $$invalidate(8, sm = $$new_props.sm);
    		if ("md" in $$new_props) $$invalidate(9, md = $$new_props.md);
    		if ("lg" in $$new_props) $$invalidate(10, lg = $$new_props.lg);
    		if ("xl" in $$new_props) $$invalidate(11, xl = $$new_props.xl);
    		if ("widths" in $$new_props) $$invalidate(12, widths = $$new_props.widths);
    		if ("$$scope" in $$new_props) $$invalidate(13, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		getColumnSizeClass,
    		isObject,
    		className,
    		hidden,
    		check,
    		size,
    		fore,
    		xs,
    		sm,
    		md,
    		lg,
    		xl,
    		colWidths,
    		widths,
    		colClasses,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
    		if ("hidden" in $$props) $$invalidate(4, hidden = $$new_props.hidden);
    		if ("check" in $$props) $$invalidate(5, check = $$new_props.check);
    		if ("size" in $$props) $$invalidate(6, size = $$new_props.size);
    		if ("fore" in $$props) $$invalidate(0, fore = $$new_props.fore);
    		if ("xs" in $$props) $$invalidate(7, xs = $$new_props.xs);
    		if ("sm" in $$props) $$invalidate(8, sm = $$new_props.sm);
    		if ("md" in $$props) $$invalidate(9, md = $$new_props.md);
    		if ("lg" in $$props) $$invalidate(10, lg = $$new_props.lg);
    		if ("xl" in $$props) $$invalidate(11, xl = $$new_props.xl);
    		if ("widths" in $$props) $$invalidate(12, widths = $$new_props.widths);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	let classes;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, hidden, check, size*/ 120) {
    			 $$invalidate(1, classes = classnames(className, hidden ? "sr-only" : false, check ? "form-check-label" : false, size ? `col-form-label-${size}` : false, colClasses, colClasses.length ? "col-form-label" : false));
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		fore,
    		classes,
    		$$restProps,
    		className,
    		hidden,
    		check,
    		size,
    		xs,
    		sm,
    		md,
    		lg,
    		xl,
    		widths,
    		$$scope,
    		slots
    	];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			class: 3,
    			hidden: 4,
    			check: 5,
    			size: 6,
    			for: 0,
    			xs: 7,
    			sm: 8,
    			md: 9,
    			lg: 10,
    			xl: 11,
    			widths: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get class() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get check() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set check(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get for() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set for(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xs() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xs(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get md() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set md(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xl() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xl(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get widths() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set widths(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Row.svelte generated by Svelte v3.29.0 */
    const file$5 = "node_modules/sveltestrap/src/Row.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$5, 15, 0, 286);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","noGutters","form"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Row", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { noGutters = false } = $$props;
    	let { form = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("noGutters" in $$new_props) $$invalidate(3, noGutters = $$new_props.noGutters);
    		if ("form" in $$new_props) $$invalidate(4, form = $$new_props.form);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		noGutters,
    		form,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("noGutters" in $$props) $$invalidate(3, noGutters = $$new_props.noGutters);
    		if ("form" in $$props) $$invalidate(4, form = $$new_props.form);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	let classes;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, noGutters, form*/ 28) {
    			 $$invalidate(0, classes = classnames(className, noGutters ? "no-gutters" : null, form ? "form-row" : "row"));
    		}
    	};

    	return [classes, $$restProps, className, noGutters, form, $$scope, slots];
    }

    class Row extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { class: 2, noGutters: 3, form: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Row",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get class() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutters() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutters(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get form() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set form(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Table.svelte generated by Svelte v3.29.0 */
    const file$6 = "node_modules/sveltestrap/src/Table.svelte";

    // (35:0) {:else}
    function create_else_block$2(ctx) {
    	let table;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	let table_levels = [/*$$restProps*/ ctx[3], { class: /*classes*/ ctx[1] }];
    	let table_data = {};

    	for (let i = 0; i < table_levels.length; i += 1) {
    		table_data = assign(table_data, table_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (default_slot) default_slot.c();
    			set_attributes(table, table_data);
    			add_location(table, file$6, 35, 2, 861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2048) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
    				}
    			}

    			set_attributes(table, table_data = get_spread_update(table_levels, [
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(35:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:0) {#if responsive}
    function create_if_block$2(ctx) {
    	let div;
    	let table;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	let table_levels = [/*$$restProps*/ ctx[3], { class: /*classes*/ ctx[1] }];
    	let table_data = {};

    	for (let i = 0; i < table_levels.length; i += 1) {
    		table_data = assign(table_data, table_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			table = element("table");
    			if (default_slot) default_slot.c();
    			set_attributes(table, table_data);
    			add_location(table, file$6, 30, 4, 773);
    			attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			add_location(div, file$6, 29, 2, 735);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, table);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2048) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
    				}
    			}

    			set_attributes(table, table_data = get_spread_update(table_levels, [
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));

    			if (!current || dirty & /*responsiveClassName*/ 4) {
    				attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(29:0) {#if responsive}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*responsive*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","size","bordered","borderless","striped","dark","hover","responsive"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Table", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { size = "" } = $$props;
    	let { bordered = false } = $$props;
    	let { borderless = false } = $$props;
    	let { striped = false } = $$props;
    	let { dark = false } = $$props;
    	let { hover = false } = $$props;
    	let { responsive = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(4, className = $$new_props.class);
    		if ("size" in $$new_props) $$invalidate(5, size = $$new_props.size);
    		if ("bordered" in $$new_props) $$invalidate(6, bordered = $$new_props.bordered);
    		if ("borderless" in $$new_props) $$invalidate(7, borderless = $$new_props.borderless);
    		if ("striped" in $$new_props) $$invalidate(8, striped = $$new_props.striped);
    		if ("dark" in $$new_props) $$invalidate(9, dark = $$new_props.dark);
    		if ("hover" in $$new_props) $$invalidate(10, hover = $$new_props.hover);
    		if ("responsive" in $$new_props) $$invalidate(0, responsive = $$new_props.responsive);
    		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		size,
    		bordered,
    		borderless,
    		striped,
    		dark,
    		hover,
    		responsive,
    		classes,
    		responsiveClassName
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(4, className = $$new_props.className);
    		if ("size" in $$props) $$invalidate(5, size = $$new_props.size);
    		if ("bordered" in $$props) $$invalidate(6, bordered = $$new_props.bordered);
    		if ("borderless" in $$props) $$invalidate(7, borderless = $$new_props.borderless);
    		if ("striped" in $$props) $$invalidate(8, striped = $$new_props.striped);
    		if ("dark" in $$props) $$invalidate(9, dark = $$new_props.dark);
    		if ("hover" in $$props) $$invalidate(10, hover = $$new_props.hover);
    		if ("responsive" in $$props) $$invalidate(0, responsive = $$new_props.responsive);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("responsiveClassName" in $$props) $$invalidate(2, responsiveClassName = $$new_props.responsiveClassName);
    	};

    	let classes;
    	let responsiveClassName;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, size, bordered, borderless, striped, dark, hover*/ 2032) {
    			 $$invalidate(1, classes = classnames(className, "table", size ? "table-" + size : false, bordered ? "table-bordered" : false, borderless ? "table-borderless" : false, striped ? "table-striped" : false, dark ? "table-dark" : false, hover ? "table-hover" : false));
    		}

    		if ($$self.$$.dirty & /*responsive*/ 1) {
    			 $$invalidate(2, responsiveClassName = responsive === true
    			? "table-responsive"
    			: `table-responsive-${responsive}`);
    		}
    	};

    	return [
    		responsive,
    		classes,
    		responsiveClassName,
    		$$restProps,
    		className,
    		size,
    		bordered,
    		borderless,
    		striped,
    		dark,
    		hover,
    		$$scope,
    		slots
    	];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			class: 4,
    			size: 5,
    			bordered: 6,
    			borderless: 7,
    			striped: 8,
    			dark: 9,
    			hover: 10,
    			responsive: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get class() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bordered() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bordered(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderless() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderless(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get striped() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set striped(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hover() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hover(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get responsive() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set responsive(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/Discover/ColumsSelect.svelte generated by Svelte v3.29.0 */
    const file$7 = "svelte/Discover/ColumsSelect.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[7] = list;
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (28:4) {#if showSelectColumns}
    function create_if_block$3(ctx) {
    	let row;
    	let current;

    	row = new Row({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};

    			if (dirty & /*$$scope, cols*/ 513) {
    				row_changes.$$scope = { dirty, ctx };
    			}

    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(28:4) {#if showSelectColumns}",
    		ctx
    	});

    	return block;
    }

    // (31:16) <Col sm="6" md="4" lg="3" xl="2" class="font-weight-lighter small parent">
    function create_default_slot_1(ctx) {
    	let custominput;
    	let updating_checked;
    	let t;
    	let current;

    	function custominput_checked_binding_1(value) {
    		/*custominput_checked_binding_1*/ ctx[4].call(null, value, /*col*/ ctx[6]);
    	}

    	let custominput_props = {
    		type: "switch",
    		bsSize: "sm",
    		inline: "true",
    		id: "show_" + /*col*/ ctx[6].field,
    		name: /*col*/ ctx[6].field,
    		label: /*col*/ ctx[6].label || /*col*/ ctx[6].field
    	};

    	if (/*col*/ ctx[6].show !== void 0) {
    		custominput_props.checked = /*col*/ ctx[6].show;
    	}

    	custominput = new CustomInput({ props: custominput_props, $$inline: true });
    	binding_callbacks.push(() => bind(custominput, "checked", custominput_checked_binding_1));
    	custominput.$on("change", /*changeColumn*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(custominput.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(custominput, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const custominput_changes = {};
    			if (dirty & /*cols*/ 1) custominput_changes.id = "show_" + /*col*/ ctx[6].field;
    			if (dirty & /*cols*/ 1) custominput_changes.name = /*col*/ ctx[6].field;
    			if (dirty & /*cols*/ 1) custominput_changes.label = /*col*/ ctx[6].label || /*col*/ ctx[6].field;

    			if (!updating_checked && dirty & /*cols*/ 1) {
    				updating_checked = true;
    				custominput_changes.checked = /*col*/ ctx[6].show;
    				add_flush_callback(() => updating_checked = false);
    			}

    			custominput.$set(custominput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(custominput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(custominput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(custominput, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(31:16) <Col sm=\\\"6\\\" md=\\\"4\\\" lg=\\\"3\\\" xl=\\\"2\\\" class=\\\"font-weight-lighter small parent\\\">",
    		ctx
    	});

    	return block;
    }

    // (30:12) {#each cols as col (col.field)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let col;
    	let current;

    	col = new Col({
    			props: {
    				sm: "6",
    				md: "4",
    				lg: "3",
    				xl: "2",
    				class: "font-weight-lighter small parent",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(col.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(col, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col_changes = {};

    			if (dirty & /*$$scope, cols*/ 513) {
    				col_changes.$$scope = { dirty, ctx };
    			}

    			col.$set(col_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(col, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(30:12) {#each cols as col (col.field)}",
    		ctx
    	});

    	return block;
    }

    // (29:8) <Row>
    function create_default_slot(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*cols*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*col*/ ctx[6].field;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cols, changeColumn*/ 5) {
    				const each_value = /*cols*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(29:8) <Row>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let custominput;
    	let updating_checked;
    	let t;
    	let div;
    	let current;

    	function custominput_checked_binding(value) {
    		/*custominput_checked_binding*/ ctx[3].call(null, value);
    	}

    	let custominput_props = {
    		type: "switch",
    		id: "selectColumns",
    		name: "selectColumns",
    		label: "Select Columns"
    	};

    	if (/*showSelectColumns*/ ctx[1] !== void 0) {
    		custominput_props.checked = /*showSelectColumns*/ ctx[1];
    	}

    	custominput = new CustomInput({ props: custominput_props, $$inline: true });
    	binding_callbacks.push(() => bind(custominput, "checked", custominput_checked_binding));
    	let if_block = /*showSelectColumns*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			create_component(custominput.$$.fragment);
    			t = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "select-columns svelte-1rwwhtj");
    			add_location(div, file$7, 26, 0, 624);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(custominput, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const custominput_changes = {};

    			if (!updating_checked && dirty & /*showSelectColumns*/ 2) {
    				updating_checked = true;
    				custominput_changes.checked = /*showSelectColumns*/ ctx[1];
    				add_flush_callback(() => updating_checked = false);
    			}

    			custominput.$set(custominput_changes);

    			if (/*showSelectColumns*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showSelectColumns*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(custominput.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(custominput.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(custominput, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ColumsSelect", slots, []);
    	let { cols = [] } = $$props;
    	const dispatch = createEventDispatcher();
    	let showSelectColumns = false;

    	function changeColumn(event) {
    		dispatch(`changed`, { col: event.target.name });
    	}

    	
    	const writable_props = ["cols"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ColumsSelect> was created with unknown prop '${key}'`);
    	});

    	function custominput_checked_binding(value) {
    		showSelectColumns = value;
    		$$invalidate(1, showSelectColumns);
    	}

    	function custominput_checked_binding_1(value, col) {
    		col.show = value;
    		$$invalidate(0, cols);
    	}

    	$$self.$$set = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		FormGroup,
    		CustomInput,
    		Label,
    		Row,
    		Col,
    		cols,
    		dispatch,
    		showSelectColumns,
    		changeColumn
    	});

    	$$self.$inject_state = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    		if ("showSelectColumns" in $$props) $$invalidate(1, showSelectColumns = $$props.showSelectColumns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		cols,
    		showSelectColumns,
    		changeColumn,
    		custominput_checked_binding,
    		custominput_checked_binding_1
    	];
    }

    class ColumsSelect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { cols: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColumsSelect",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get cols() {
    		throw new Error("<ColumsSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<ColumsSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/Discover/Cell/Measure.svelte generated by Svelte v3.29.0 */

    // (9:0) {:else}
    function create_else_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("-");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(9:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (7:0) {#if value !== undefined}
    function create_if_block$4(ctx) {
    	let t_value = (/*value*/ ctx[1] * (/*col*/ ctx[0].scale || 1)).toFixed(/*col*/ ctx[0].accuracy || 0) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*col*/ 1 && t_value !== (t_value = (/*value*/ ctx[1] * (/*col*/ ctx[0].scale || 1)).toFixed(/*col*/ ctx[0].accuracy || 0) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(7:0) {#if value !== undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*value*/ ctx[1] !== undefined) return create_if_block$4;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Measure", slots, []);
    	let { tag = {} } = $$props;
    	let { col = {} } = $$props;
    	let value = tag[col.field] || tag.last[col.field];
    	const writable_props = ["tag", "col"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Measure> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tag" in $$props) $$invalidate(2, tag = $$props.tag);
    		if ("col" in $$props) $$invalidate(0, col = $$props.col);
    	};

    	$$self.$capture_state = () => ({ tag, col, value });

    	$$self.$inject_state = $$props => {
    		if ("tag" in $$props) $$invalidate(2, tag = $$props.tag);
    		if ("col" in $$props) $$invalidate(0, col = $$props.col);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [col, value, tag];
    }

    class Measure extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { tag: 2, col: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Measure",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get tag() {
    		throw new Error("<Measure>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error("<Measure>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get col() {
    		throw new Error("<Measure>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set col(value) {
    		throw new Error("<Measure>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/Discover/Cell/Text.svelte generated by Svelte v3.29.0 */

    function create_fragment$9(ctx) {
    	let t_value = (/*value*/ ctx[0] !== undefined && /*value*/ ctx[0] !== null
    	? /*value*/ ctx[0]
    	: `-`) + "";

    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Text", slots, []);
    	let { tag = {} } = $$props;
    	let { col = {} } = $$props;
    	let value = tag[col.field] || tag.last[col.field];
    	const writable_props = ["tag", "col"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Text> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tag" in $$props) $$invalidate(1, tag = $$props.tag);
    		if ("col" in $$props) $$invalidate(2, col = $$props.col);
    	};

    	$$self.$capture_state = () => ({ tag, col, value });

    	$$self.$inject_state = $$props => {
    		if ("tag" in $$props) $$invalidate(1, tag = $$props.tag);
    		if ("col" in $$props) $$invalidate(2, col = $$props.col);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, tag, col];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { tag: 1, col: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get tag() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get col() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set col(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/UI/Tooltip.svelte generated by Svelte v3.29.0 */

    const file$8 = "svelte/UI/Tooltip.svelte";
    const get_custom_tip_slot_changes = dirty => ({});
    const get_custom_tip_slot_context = ctx => ({});

    // (86:4) {:else}
    function create_else_block$4(ctx) {
    	let current;
    	const custom_tip_slot_template = /*#slots*/ ctx[10]["custom-tip"];
    	const custom_tip_slot = create_slot(custom_tip_slot_template, ctx, /*$$scope*/ ctx[9], get_custom_tip_slot_context);

    	const block = {
    		c: function create() {
    			if (custom_tip_slot) custom_tip_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (custom_tip_slot) {
    				custom_tip_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (custom_tip_slot) {
    				if (custom_tip_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(custom_tip_slot, custom_tip_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_custom_tip_slot_changes, get_custom_tip_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(custom_tip_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(custom_tip_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (custom_tip_slot) custom_tip_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(86:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (84:4) {#if tip}
    function create_if_block$5(ctx) {
    	let small;
    	let t;

    	const block = {
    		c: function create() {
    			small = element("small");
    			t = text(/*tip*/ ctx[0]);
    			attr_dev(small, "class", "default-tip svelte-16glvw6");
    			attr_dev(small, "style", /*style*/ ctx[6]);
    			add_location(small, file$8, 84, 6, 1508);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			append_dev(small, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tip*/ 1) set_data_dev(t, /*tip*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(84:4) {#if tip}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let span;
    	let t;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);
    	const if_block_creators = [create_if_block$5, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tip*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t = space();
    			div0 = element("div");
    			if_block.c();
    			attr_dev(span, "class", "tooltip-slot svelte-16glvw6");
    			add_location(span, file$8, 73, 2, 1330);
    			attr_dev(div0, "class", "tooltip svelte-16glvw6");
    			toggle_class(div0, "active", /*active*/ ctx[5]);
    			toggle_class(div0, "left", /*left*/ ctx[4]);
    			toggle_class(div0, "right", /*right*/ ctx[2]);
    			toggle_class(div0, "bottom", /*bottom*/ ctx[3]);
    			toggle_class(div0, "top", /*top*/ ctx[1]);
    			add_location(div0, file$8, 76, 2, 1383);
    			attr_dev(div1, "class", "tooltip-wrapper svelte-16glvw6");
    			add_location(div1, file$8, 72, 0, 1298);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(div1, t);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}

    			if (dirty & /*active*/ 32) {
    				toggle_class(div0, "active", /*active*/ ctx[5]);
    			}

    			if (dirty & /*left*/ 16) {
    				toggle_class(div0, "left", /*left*/ ctx[4]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(div0, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*bottom*/ 8) {
    				toggle_class(div0, "bottom", /*bottom*/ ctx[3]);
    			}

    			if (dirty & /*top*/ 2) {
    				toggle_class(div0, "top", /*top*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tooltip", slots, ['default','custom-tip']);
    	let { tip = "" } = $$props;
    	let { top = false } = $$props;
    	let { right = false } = $$props;
    	let { bottom = false } = $$props;
    	let { left = false } = $$props;
    	let { active = false } = $$props;
    	let { color = "white" } = $$props;
    	let { bgcolor = "black" } = $$props;
    	let style = `color: ${color}; background-color: ${bgcolor};`;
    	const writable_props = ["tip", "top", "right", "bottom", "left", "active", "color", "bgcolor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tooltip> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tip" in $$props) $$invalidate(0, tip = $$props.tip);
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("left" in $$props) $$invalidate(4, left = $$props.left);
    		if ("active" in $$props) $$invalidate(5, active = $$props.active);
    		if ("color" in $$props) $$invalidate(7, color = $$props.color);
    		if ("bgcolor" in $$props) $$invalidate(8, bgcolor = $$props.bgcolor);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		tip,
    		top,
    		right,
    		bottom,
    		left,
    		active,
    		color,
    		bgcolor,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("tip" in $$props) $$invalidate(0, tip = $$props.tip);
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("left" in $$props) $$invalidate(4, left = $$props.left);
    		if ("active" in $$props) $$invalidate(5, active = $$props.active);
    		if ("color" in $$props) $$invalidate(7, color = $$props.color);
    		if ("bgcolor" in $$props) $$invalidate(8, bgcolor = $$props.bgcolor);
    		if ("style" in $$props) $$invalidate(6, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tip, top, right, bottom, left, active, style, color, bgcolor, $$scope, slots];
    }

    class Tooltip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			tip: 0,
    			top: 1,
    			right: 2,
    			bottom: 3,
    			left: 4,
    			active: 5,
    			color: 7,
    			bgcolor: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tooltip",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get tip() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tip(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgcolor() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgcolor(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/Discover/Cell/Date.svelte generated by Svelte v3.29.0 */

    // (9:0) <Tooltip tip="{date.format(`YYYY-MM-DD HH:mm:ss`)}" left >
    function create_default_slot$1(ctx) {
    	let t_value = /*date*/ ctx[0].format(`HH:mm:ss`) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(9:0) <Tooltip tip=\\\"{date.format(`YYYY-MM-DD HH:mm:ss`)}\\\" left >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let tooltip;
    	let current;

    	tooltip = new Tooltip({
    			props: {
    				tip: /*date*/ ctx[0].format(`YYYY-MM-DD HH:mm:ss`),
    				left: true,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tooltip.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tooltip, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tooltip_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				tooltip_changes.$$scope = { dirty, ctx };
    			}

    			tooltip.$set(tooltip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tooltip, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Date", slots, []);
    	let { tag = {} } = $$props;
    	let { col = {} } = $$props;
    	let value = tag[col.field] || tag.last[col.field];
    	let date = moment(value);
    	const writable_props = ["tag", "col"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Date> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tag" in $$props) $$invalidate(1, tag = $$props.tag);
    		if ("col" in $$props) $$invalidate(2, col = $$props.col);
    	};

    	$$self.$capture_state = () => ({ Tooltip, tag, col, value, date });

    	$$self.$inject_state = $$props => {
    		if ("tag" in $$props) $$invalidate(1, tag = $$props.tag);
    		if ("col" in $$props) $$invalidate(2, col = $$props.col);
    		if ("value" in $$props) value = $$props.value;
    		if ("date" in $$props) $$invalidate(0, date = $$props.date);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [date, tag, col];
    }

    class Date extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { tag: 1, col: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Date",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get tag() {
    		throw new Error("<Date>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error("<Date>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get col() {
    		throw new Error("<Date>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set col(value) {
    		throw new Error("<Date>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/Discover/Panel.svelte generated by Svelte v3.29.0 */
    const file$9 = "svelte/Discover/Panel.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (26:16) {#if col.show}
    function create_if_block_4(ctx) {
    	let th;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let th_class_value;
    	let current;
    	const if_block_creators = [create_if_block_5, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*col*/ ctx[6].unit) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			th = element("th");
    			if_block.c();
    			t = space();
    			attr_dev(th, "class", th_class_value = /*col*/ ctx[6].class || `text-right`);
    			add_location(th, file$9, 26, 20, 886);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			if_blocks[current_block_type_index].m(th, null);
    			append_dev(th, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(th, t);
    			}

    			if (!current || dirty & /*cols*/ 1 && th_class_value !== (th_class_value = /*col*/ ctx[6].class || `text-right`)) {
    				attr_dev(th, "class", th_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(26:16) {#if col.show}",
    		ctx
    	});

    	return block;
    }

    // (32:24) {:else}
    function create_else_block$5(ctx) {
    	let t_value = /*col*/ ctx[6].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cols*/ 1 && t_value !== (t_value = /*col*/ ctx[6].label + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(32:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:24) {#if col.unit}
    function create_if_block_5(ctx) {
    	let tooltip;
    	let current;

    	tooltip = new Tooltip({
    			props: {
    				tip: /*col*/ ctx[6].unit,
    				bottom: true,
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tooltip.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tooltip, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tooltip_changes = {};
    			if (dirty & /*cols*/ 1) tooltip_changes.tip = /*col*/ ctx[6].unit;

    			if (dirty & /*$$scope, cols*/ 2049) {
    				tooltip_changes.$$scope = { dirty, ctx };
    			}

    			tooltip.$set(tooltip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tooltip, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(28:24) {#if col.unit}",
    		ctx
    	});

    	return block;
    }

    // (29:28) <Tooltip tip="{col.unit}" bottom >
    function create_default_slot_1$1(ctx) {
    	let t_value = /*col*/ ctx[6].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cols*/ 1 && t_value !== (t_value = /*col*/ ctx[6].label + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(29:28) <Tooltip tip=\\\"{col.unit}\\\" bottom >",
    		ctx
    	});

    	return block;
    }

    // (25:12) {#each cols as col (col.field)}
    function create_each_block_2(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*col*/ ctx[6].show && create_if_block_4(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*col*/ ctx[6].show) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*cols*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(25:12) {#each cols as col (col.field)}",
    		ctx
    	});

    	return block;
    }

    // (44:20) {#if col.show}
    function create_if_block$6(ctx) {
    	let td;
    	let t0;
    	let t1;
    	let td_class_value;
    	let current;
    	let if_block0 = /*col*/ ctx[6].render === `measure` && create_if_block_3$1(ctx);
    	let if_block1 = /*col*/ ctx[6].render === `text` && create_if_block_2$1(ctx);
    	let if_block2 = /*col*/ ctx[6].render === `date` && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			td = element("td");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(td, "class", td_class_value = /*col*/ ctx[6].class || `text-right`);
    			add_location(td, file$9, 44, 24, 1479);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			if (if_block0) if_block0.m(td, null);
    			append_dev(td, t0);
    			if (if_block1) if_block1.m(td, null);
    			append_dev(td, t1);
    			if (if_block2) if_block2.m(td, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*col*/ ctx[6].render === `measure`) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*cols*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(td, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*col*/ ctx[6].render === `text`) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*cols*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(td, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*col*/ ctx[6].render === `date`) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*cols*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(td, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*cols*/ 1 && td_class_value !== (td_class_value = /*col*/ ctx[6].class || `text-right`)) {
    				attr_dev(td, "class", td_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(44:20) {#if col.show}",
    		ctx
    	});

    	return block;
    }

    // (46:28) {#if col.render === `measure`}
    function create_if_block_3$1(ctx) {
    	let cellmeasure;
    	let current;

    	cellmeasure = new Measure({
    			props: { col: /*col*/ ctx[6], tag: /*tag*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cellmeasure.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cellmeasure, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cellmeasure_changes = {};
    			if (dirty & /*cols*/ 1) cellmeasure_changes.col = /*col*/ ctx[6];
    			if (dirty & /*tags*/ 2) cellmeasure_changes.tag = /*tag*/ ctx[3];
    			cellmeasure.$set(cellmeasure_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cellmeasure.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cellmeasure.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cellmeasure, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(46:28) {#if col.render === `measure`}",
    		ctx
    	});

    	return block;
    }

    // (49:28) {#if col.render === `text`}
    function create_if_block_2$1(ctx) {
    	let celltext;
    	let current;

    	celltext = new Text({
    			props: { col: /*col*/ ctx[6], tag: /*tag*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(celltext.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(celltext, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const celltext_changes = {};
    			if (dirty & /*cols*/ 1) celltext_changes.col = /*col*/ ctx[6];
    			if (dirty & /*tags*/ 2) celltext_changes.tag = /*tag*/ ctx[3];
    			celltext.$set(celltext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(celltext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(celltext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(celltext, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(49:28) {#if col.render === `text`}",
    		ctx
    	});

    	return block;
    }

    // (52:28) {#if col.render === `date`}
    function create_if_block_1$1(ctx) {
    	let celldate;
    	let current;

    	celldate = new Date({
    			props: { col: /*col*/ ctx[6], tag: /*tag*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(celldate.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(celldate, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const celldate_changes = {};
    			if (dirty & /*cols*/ 1) celldate_changes.col = /*col*/ ctx[6];
    			if (dirty & /*tags*/ 2) celldate_changes.tag = /*tag*/ ctx[3];
    			celldate.$set(celldate_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(celldate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(celldate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(celldate, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(52:28) {#if col.render === `date`}",
    		ctx
    	});

    	return block;
    }

    // (43:16) {#each cols as col (col.field)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*col*/ ctx[6].show && create_if_block$6(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*col*/ ctx[6].show) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*cols*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(43:16) {#each cols as col (col.field)}",
    		ctx
    	});

    	return block;
    }

    // (41:8) {#each tags as tag (tag.id)}
    function create_each_block$1(key_1, ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let current;
    	let each_value_1 = /*cols*/ ctx[0];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*col*/ ctx[6].field;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$9, 41, 12, 1367);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cols, tags*/ 3) {
    				const each_value_1 = /*cols*/ ctx[0];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, tr, outro_and_destroy_block, create_each_block_1, t, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(41:8) {#each tags as tag (tag.id)}",
    		ctx
    	});

    	return block;
    }

    // (22:0) <Table class="table-sm font-weight-lighter small" responsive>
    function create_default_slot$2(ctx) {
    	let thead;
    	let tr;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t;
    	let tbody;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let current;
    	let each_value_2 = /*cols*/ ctx[0];
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*col*/ ctx[6].field;
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value = /*tags*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*tag*/ ctx[3].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(tr, file$9, 23, 8, 786);
    			add_location(thead, file$9, 22, 4, 770);
    			add_location(tbody, file$9, 39, 4, 1310);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, tbody, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cols*/ 1) {
    				const each_value_2 = /*cols*/ ctx[0];
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_2, each0_lookup, tr, outro_and_destroy_block, create_each_block_2, null, get_each_context_2);
    				check_outros();
    			}

    			if (dirty & /*cols, tags*/ 3) {
    				const each_value = /*tags*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, tbody, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(22:0) <Table class=\\\"table-sm font-weight-lighter small\\\" responsive>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let strong;
    	let t1;
    	let columsselect;
    	let t2;
    	let table;
    	let current;

    	columsselect = new ColumsSelect({
    			props: { cols: /*cols*/ ctx[0] },
    			$$inline: true
    		});

    	columsselect.$on("changed", /*columnChange*/ ctx[2]);

    	table = new Table({
    			props: {
    				class: "table-sm font-weight-lighter small",
    				responsive: true,
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			strong = element("strong");
    			strong.textContent = "Discover";
    			t1 = space();
    			create_component(columsselect.$$.fragment);
    			t2 = space();
    			create_component(table.$$.fragment);
    			add_location(strong, file$9, 19, 0, 629);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, strong, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(columsselect, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const columsselect_changes = {};
    			if (dirty & /*cols*/ 1) columsselect_changes.cols = /*cols*/ ctx[0];
    			columsselect.$set(columsselect_changes);
    			const table_changes = {};

    			if (dirty & /*$$scope, tags, cols*/ 2051) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(columsselect.$$.fragment, local);
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(columsselect.$$.fragment, local);
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(strong);
    			if (detaching) detach_dev(t1);
    			destroy_component(columsselect, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Panel", slots, []);
    	let { tags = [] } = $$props;
    	let { cols = [] } = $$props;

    	// export let config = {};
    	function columnChange(event) {
    		const name = event.detail.name;
    		const index = cols.findIndex(c => c.field === name);
    		$$invalidate(0, cols);
    	}

    	const writable_props = ["tags", "cols"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tags" in $$props) $$invalidate(1, tags = $$props.tags);
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    	};

    	$$self.$capture_state = () => ({
    		Table,
    		ColumsSelect,
    		CellMeasure: Measure,
    		CellText: Text,
    		CellDate: Date,
    		Tooltip,
    		tags,
    		cols,
    		columnChange
    	});

    	$$self.$inject_state = $$props => {
    		if ("tags" in $$props) $$invalidate(1, tags = $$props.tags);
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cols, tags, columnChange];
    }

    class Panel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { tags: 1, cols: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get tags() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tags(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cols() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/Targets/Panel.svelte generated by Svelte v3.29.0 */

    function create_fragment$d(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Targets");
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Panel", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Panel$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* svelte/Config/Panel.svelte generated by Svelte v3.29.0 */

    function create_fragment$e(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Config");
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Panel", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Panel$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* svelte/App.svelte generated by Svelte v3.29.0 */

    const { console: console_1 } = globals;
    const file$a = "svelte/App.svelte";

    // (141:3) <Col xs="8" class="p-3 pl-4">
    function create_default_slot_3(ctx) {
    	let span;
    	let t0_value = /*addon*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let a0;
    	let i0;
    	let t2;
    	let small0;
    	let t4;
    	let a1;
    	let i1;
    	let t5;
    	let small1;
    	let t7;
    	let a2;
    	let i2;
    	let t8;
    	let small2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			a0 = element("a");
    			i0 = element("i");
    			t2 = space();
    			small0 = element("small");
    			small0.textContent = "Discover";
    			t4 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t5 = space();
    			small1 = element("small");
    			small1.textContent = "Targets";
    			t7 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t8 = space();
    			small2 = element("small");
    			small2.textContent = "Configuration";
    			attr_dev(span, "class", "mr-4");
    			add_location(span, file$a, 141, 4, 3767);
    			attr_dev(i0, "class", "fab fa-bluetooth fa-sm");
    			add_location(i0, file$a, 143, 5, 3926);
    			attr_dev(small0, "class", "ml-1 font-weight-lighter");
    			add_location(small0, file$a, 144, 5, 3970);
    			attr_dev(a0, "class", "mr-4 text-white text-decoration-none");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$a, 142, 4, 3810);
    			attr_dev(i1, "class", "fas fa-database fa-sm");
    			add_location(i1, file$a, 149, 5, 4168);
    			attr_dev(small1, "class", "ml-1 font-weight-lighter");
    			add_location(small1, file$a, 150, 5, 4211);
    			attr_dev(a1, "class", "mr-4 text-white text-decoration-none");
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$a, 148, 4, 4053);
    			attr_dev(i2, "class", "fas fa-cog fa-sm");
    			add_location(i2, file$a, 155, 5, 4407);
    			attr_dev(small2, "class", "ml-1 font-weight-lighter");
    			add_location(small2, file$a, 156, 5, 4445);
    			attr_dev(a2, "class", "mr-4 text-white text-decoration-none");
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$a, 154, 4, 4293);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a0, anchor);
    			append_dev(a0, i0);
    			append_dev(a0, t2);
    			append_dev(a0, small0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, a1, anchor);
    			append_dev(a1, i1);
    			append_dev(a1, t5);
    			append_dev(a1, small1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, a2, anchor);
    			append_dev(a2, i2);
    			append_dev(a2, t8);
    			append_dev(a2, small2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", prevent_default(/*click_handler*/ ctx[8]), false, true, false),
    					listen_dev(a1, "click", prevent_default(/*click_handler_1*/ ctx[9]), false, true, false),
    					listen_dev(a2, "click", prevent_default(/*click_handler_2*/ ctx[10]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addon*/ 2 && t0_value !== (t0_value = /*addon*/ ctx[1].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(a2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(141:3) <Col xs=\\\"8\\\" class=\\\"p-3 pl-4\\\">",
    		ctx
    	});

    	return block;
    }

    // (162:3) <Col xs="4" class="m-auto pr-4">
    function create_default_slot_2(ctx) {
    	let div;
    	let small;
    	let em;
    	let a0;
    	let t0;
    	let t1_value = /*addon*/ ctx[1].version + "";
    	let t1;
    	let a0_href_value;
    	let t2;
    	let a1;
    	let i;
    	let a1_href_value;
    	let t3;
    	let a2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			small = element("small");
    			em = element("em");
    			a0 = element("a");
    			t0 = text("v");
    			t1 = text(t1_value);
    			t2 = space();
    			a1 = element("a");
    			i = element("i");
    			t3 = space();
    			a2 = element("a");
    			attr_dev(a0, "class", "text-white font-weight-lighter text-decoration-none");
    			attr_dev(a0, "href", a0_href_value = "" + (/*addon*/ ctx[1].url + "/blob/master/CHANGELOG.md"));
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$a, 165, 7, 4636);
    			add_location(em, file$a, 164, 6, 4624);
    			add_location(small, file$a, 163, 5, 4610);
    			attr_dev(i, "class", "fab fa-github fa-sm");
    			add_location(i, file$a, 171, 6, 4897);
    			attr_dev(a1, "class", "ml-2 text-white");
    			attr_dev(a1, "href", a1_href_value = /*addon*/ ctx[1].url);
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$a, 170, 5, 4828);
    			attr_dev(a2, "class", "ml-1 text-white");
    			attr_dev(a2, "href", "https://ruuvi.com/");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$a, 173, 5, 4948);
    			attr_dev(div, "class", "float-right");
    			add_location(div, file$a, 162, 4, 4579);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, small);
    			append_dev(small, em);
    			append_dev(em, a0);
    			append_dev(a0, t0);
    			append_dev(a0, t1);
    			append_dev(div, t2);
    			append_dev(div, a1);
    			append_dev(a1, i);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			a2.innerHTML = /*ruuvi*/ ctx[0];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addon*/ 2 && t1_value !== (t1_value = /*addon*/ ctx[1].version + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*addon*/ 2 && a0_href_value !== (a0_href_value = "" + (/*addon*/ ctx[1].url + "/blob/master/CHANGELOG.md"))) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*addon*/ 2 && a1_href_value !== (a1_href_value = /*addon*/ ctx[1].url)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*ruuvi*/ 1) a2.innerHTML = /*ruuvi*/ ctx[0];		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(162:3) <Col xs=\\\"4\\\" class=\\\"m-auto pr-4\\\">",
    		ctx
    	});

    	return block;
    }

    // (140:2) <Row class="app-bgcolor" id="header">
    function create_default_slot_1$2(ctx) {
    	let col0;
    	let t;
    	let col1;
    	let current;

    	col0 = new Col({
    			props: {
    				xs: "8",
    				class: "p-3 pl-4",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	col1 = new Col({
    			props: {
    				xs: "4",
    				class: "m-auto pr-4",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col0.$$.fragment);
    			t = space();
    			create_component(col1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(col1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col0_changes = {};

    			if (dirty & /*$$scope, panel, addon*/ 4162) {
    				col0_changes.$$scope = { dirty, ctx };
    			}

    			col0.$set(col0_changes);
    			const col1_changes = {};

    			if (dirty & /*$$scope, ruuvi, addon*/ 4099) {
    				col1_changes.$$scope = { dirty, ctx };
    			}

    			col1.$set(col1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col0.$$.fragment, local);
    			transition_in(col1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col0.$$.fragment, local);
    			transition_out(col1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(col1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(140:2) <Row class=\\\"app-bgcolor\\\" id=\\\"header\\\">",
    		ctx
    	});

    	return block;
    }

    // (181:3) {#if panel === `discover`}
    function create_if_block_2$2(ctx) {
    	let paneldiscover;
    	let current;

    	paneldiscover = new Panel({
    			props: {
    				tags: /*tags*/ ctx[2],
    				targets: /*targets*/ ctx[3],
    				ruuvitags: /*ruuvitags*/ ctx[4],
    				cols: /*cols*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(paneldiscover.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(paneldiscover, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const paneldiscover_changes = {};
    			if (dirty & /*tags*/ 4) paneldiscover_changes.tags = /*tags*/ ctx[2];
    			if (dirty & /*targets*/ 8) paneldiscover_changes.targets = /*targets*/ ctx[3];
    			if (dirty & /*ruuvitags*/ 16) paneldiscover_changes.ruuvitags = /*ruuvitags*/ ctx[4];
    			if (dirty & /*cols*/ 32) paneldiscover_changes.cols = /*cols*/ ctx[5];
    			paneldiscover.$set(paneldiscover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(paneldiscover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(paneldiscover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(paneldiscover, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(181:3) {#if panel === `discover`}",
    		ctx
    	});

    	return block;
    }

    // (184:3) {#if panel === `targets`}
    function create_if_block_1$2(ctx) {
    	let paneltargets;
    	let current;
    	paneltargets = new Panel$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(paneltargets.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(paneltargets, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(paneltargets.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(paneltargets.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(paneltargets, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(184:3) {#if panel === `targets`}",
    		ctx
    	});

    	return block;
    }

    // (187:3) {#if panel === `config`}
    function create_if_block$7(ctx) {
    	let panelconfig;
    	let current;
    	panelconfig = new Panel$2({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(panelconfig.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(panelconfig, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panelconfig.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panelconfig.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panelconfig, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(187:3) {#if panel === `config`}",
    		ctx
    	});

    	return block;
    }

    // (139:1) <Container fluid id="page">
    function create_default_slot$3(ctx) {
    	let row;
    	let t0;
    	let div;
    	let t1;
    	let t2;
    	let current;

    	row = new Row({
    			props: {
    				class: "app-bgcolor",
    				id: "header",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block0 = /*panel*/ ctx[6] === `discover` && create_if_block_2$2(ctx);
    	let if_block1 = /*panel*/ ctx[6] === `targets` && create_if_block_1$2(ctx);
    	let if_block2 = /*panel*/ ctx[6] === `config` && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    			t0 = space();
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "class", "mb-4");
    			add_location(div, file$a, 179, 2, 5080);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t2);
    			if (if_block2) if_block2.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};

    			if (dirty & /*$$scope, ruuvi, addon, panel*/ 4163) {
    				row_changes.$$scope = { dirty, ctx };
    			}

    			row.$set(row_changes);

    			if (/*panel*/ ctx[6] === `discover`) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*panel*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*panel*/ ctx[6] === `targets`) {
    				if (if_block1) {
    					if (dirty & /*panel*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*panel*/ ctx[6] === `config`) {
    				if (if_block2) {
    					if (dirty & /*panel*/ 64) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$7(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(139:1) <Container fluid id=\\\"page\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let main;
    	let container;
    	let current;

    	container = new Container({
    			props: {
    				fluid: true,
    				id: "page",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(container.$$.fragment);
    			add_location(main, file$a, 137, 0, 3654);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(container, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const container_changes = {};

    			if (dirty & /*$$scope, panel, tags, targets, ruuvitags, cols, ruuvi, addon*/ 4223) {
    				container_changes.$$scope = { dirty, ctx };
    			}

    			container.$set(container_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(container);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { ws } = $$props;
    	let { ruuvi } = $$props;

    	let addon = {
    		name: `RuuviTags Discovery`,
    		version: `0.0.1`,
    		url: `https://github.com/balda/ruuvitag-discovery`
    	};

    	let config = { measures: [], targets: [] };
    	let tags = [];
    	let targets = [];
    	let ruuvitags = {};
    	let cols = [];

    	// let cols = [
    	//     {
    	//         title: `Name`,
    	//         field: `name`,
    	//         class: `text-left`,
    	//         render: (tag, field = `last`) => {
    	//             let name = `${tag.id.substring(0,4)}`;
    	//             if (tag.id && ruuvitags[tag.id]) {
    	//                 name = `${ruuvitags[tag.id]}`;
    	//             }
    	//             return `
    	//                 <a href="#" class="rename-ruuvitag mr-2 app-color" data-id="${tag.id}"><i class="fas fa-edit"></i></a>
    	//                 <span class="jstooltip" title="${tag.id}">
    	//                     ${name}
    	//                 </span>
    	//             `;
    	//         },
    	//     }, {
    	//         title: `Samples`,
    	//         field: `samples`,
    	//         global: true,
    	//         render: (tag) => {
    	//             return `
    	//                 ${tag.samples ? Math.round(tag.samples) : `-`}
    	//             `;
    	//         },
    	//     }, {
    	//     // }, {
    	//     //     title: `Last seen (sec)`,
    	//     //     field: `ts`,
    	//     //     render: (tag, field = `last`) => {
    	//     //         if (!tag[field]) {
    	//     //             return ``;
    	//     //         }
    	//     //         const data = tag[field].ts;
    	//     //         const m = moment(data);
    	//     //         return `
    	//     //             <span class="jstooltip" title="${m.format(`YYYY-MM-DD HH:mm:ss`)}<br><em>${m.fromNow()}</em>">
    	//     //                 ${((Date.now() - data) / 1000).toFixed(0)}
    	//     //             </span>
    	//     //         `;
    	//     //     },
    	// 	},
    	// ];
    	let panel = `discover`;

    	ws.onopen = () => {
    		console.log(`ws connected`);
    	};

    	ws.onmessage = message => {
    		try {
    			const data = JSON.parse(message.data);

    			if (data.addon) {
    				console.log(data);
    				$$invalidate(1, addon = data.addon);
    			}

    			if (data.config) {
    				config = data.config;

    				if (data.config.targets) {
    					$$invalidate(3, targets = data.config.targets);
    				}

    				if (data.config.ruuvitags) {
    					$$invalidate(4, ruuvitags = data.config.ruuvitags);
    				}
    			} // if (data.config.columns) {
    			// 	cols = Object.keys(data.config.columns).map(field => {

    			// 		return {
    			// 			field,
    			// 		}
    			// 	});
    			// }
    			if (data.measures) {
    				config.measures = data.measures;

    				$$invalidate(5, cols = config.measures.map(measure => {
    					measure.render = `measure`;

    					// measure.show = true;
    					measure.show = measure.required === undefined;

    					return measure;
    				}));

    				cols.splice(
    					0,
    					0,
    					{
    						label: `ID`,
    						field: `id`,
    						class: `text-left`,
    						render: `text`,
    						show: true
    					},
    					{
    						label: `Mac Address`,
    						field: `mac`,
    						class: `text-left`,
    						render: `text`,
    						show: true
    					},
    					{
    						label: `Data Format`,
    						field: `dataFormat`,
    						render: `measure`,
    						show: true
    					}
    				);

    				cols.push({
    					label: `Last seen`,
    					field: `ts`,
    					render: `date`,
    					show: true
    				});
    			}

    			if (data.targets) {
    				config.targets = data.targets;
    			}

    			if (data.tag) {
    				const tagIndex = tags.findIndex(tag => tag.id === data.tag.id);
    				$$invalidate(2, tags[tagIndex === -1 ? tags.length : tagIndex] = data.tag, tags);
    			}
    		} catch(error) {
    			
    		}
    	};

    	const writable_props = ["ws", "ruuvi"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(6, panel = `discover`);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(6, panel = `targets`);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(6, panel = `config`);
    	};

    	$$self.$$set = $$props => {
    		if ("ws" in $$props) $$invalidate(7, ws = $$props.ws);
    		if ("ruuvi" in $$props) $$invalidate(0, ruuvi = $$props.ruuvi);
    	};

    	$$self.$capture_state = () => ({
    		Container,
    		Row,
    		Col,
    		PanelDiscover: Panel,
    		PanelTargets: Panel$1,
    		PanelConfig: Panel$2,
    		ws,
    		ruuvi,
    		addon,
    		config,
    		tags,
    		targets,
    		ruuvitags,
    		cols,
    		panel
    	});

    	$$self.$inject_state = $$props => {
    		if ("ws" in $$props) $$invalidate(7, ws = $$props.ws);
    		if ("ruuvi" in $$props) $$invalidate(0, ruuvi = $$props.ruuvi);
    		if ("addon" in $$props) $$invalidate(1, addon = $$props.addon);
    		if ("config" in $$props) config = $$props.config;
    		if ("tags" in $$props) $$invalidate(2, tags = $$props.tags);
    		if ("targets" in $$props) $$invalidate(3, targets = $$props.targets);
    		if ("ruuvitags" in $$props) $$invalidate(4, ruuvitags = $$props.ruuvitags);
    		if ("cols" in $$props) $$invalidate(5, cols = $$props.cols);
    		if ("panel" in $$props) $$invalidate(6, panel = $$props.panel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ruuvi,
    		addon,
    		tags,
    		targets,
    		ruuvitags,
    		cols,
    		panel,
    		ws,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { ws: 7, ruuvi: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ws*/ ctx[7] === undefined && !("ws" in props)) {
    			console_1.warn("<App> was created without expected prop 'ws'");
    		}

    		if (/*ruuvi*/ ctx[0] === undefined && !("ruuvi" in props)) {
    			console_1.warn("<App> was created without expected prop 'ruuvi'");
    		}
    	}

    	get ws() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ws(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ruuvi() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ruuvi(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // console.log(window.location.href);
    // const _url = window.location.href.split(`://`);
    // _url[0] = `ws`;
    // console.log(_url.join(`://`));
    // const ws = new WebSocket(_url.join(`://`));
    const ws = new WebSocket('ws://localhost:8099/');

    const ruuvi = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 999.56 1200"><defs><style>.a{fill:#fff;}</style></defs><path class="a" d="M499.59,2C223.56,2-.22,225.81-.25,501.95S223.46,1002,499.48,1002,999.23,778.26,999.32,502.16C999.78,226.42,776.72,2.51,501.1,2.05h-1.51M603,829.42c-174.61,0-316.64-140.69-318.36-315.37a216.85,216.85,0,0,0,70.71,11.63c121.74,0,220.43-98.72,220.44-220.51A220.6,220.6,0,0,0,547.46,197,328.75,328.75,0,0,1,603,191.8c175.87,0,318.44,142.63,318.44,318.58S778.86,829,603,829"/></svg>`; //  width="16" height="16"

    const app = new App({
    	target: document.body,
    	props: {
    		ruuvi,
    		ws,
    	}
    });

    return app;

}());
//# sourceMappingURL=app.js.map
