<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let label: string = '';
	export let placeholder: string = '';
	export let type: string = 'text';

	export let min: number = null;
	export let max: number = null;

	export let value: string = '';

	export let error: string = '';

	const dispatch = createEventDispatcher();
</script>

<div class={`mb-4${$$props.class ? ` ${$$props.class}` : ''}`}>
	<!-- svelte-ignore a11y-label-has-associated-control -->
	<label class="block text-sm font-medium text-gray-300" class:hidden={!label}>{label}</label>
	<input
		class="shadow appearance-none border rounded-xl w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
		class:border-red-500={!!error}
		{type}
		{placeholder}
		{value}
		{min}
		{max}
		on:input={(e) => {
			value = e.target['value'];
			dispatch('change', value);
		}}
        on:change={(e) => {
            value = e.target['value'];
            dispatch('change', value);
        }}
	/>
	{#if error}
		<p class="text-red-500 text-xs italic">{error}</p>
	{/if}
</div>
