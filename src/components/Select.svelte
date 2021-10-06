<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { clickOutside } from '../utils/click-outside';

	export let name: string;
	export let options: Record<string, string>;

	export let value: string;

	const dispatch = createEventDispatcher();

	let mouseInsideOptionValue = '';

	function onMouseEnter(optionValue: string) {
		mouseInsideOptionValue = optionValue;
	}

	function onMouseLeave(optionValue: string) {
		mouseInsideOptionValue = '';
	}

	let isOpen = false;

	function invert() {
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}
</script>

<div class="mb-4">
	<!-- svelte-ignore a11y-label-has-associated-control -->
	<label class="block text-sm font-medium text-gray-300">{name}</label>
	<div class="mt-1 relative" use:clickOutside={close}>
		<button
			type="button"
			class="relative w-full bg-white border border-gray-300 rounded-xl shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
			on:click={invert}
		>
			<span class="flex items-center">
				<span class="block truncate text-gray-700 leading-tight">{options[value]}</span>
			</span>
			<span class="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
				<svg
					class="h-5 w-5 text-gray-400"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</span>
		</button>

		<ul
			class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-xl py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
			class:hidden={!isOpen}
			tabindex="-1"
			role="listbox"
			aria-labelledby="listbox-label"
			aria-activedescendant="listbox-option-3"
		>
			{#each Object.entries(options) as [optionValue, optionName]}
				<li
					class="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9"
					class:text-white={mouseInsideOptionValue === optionValue}
					class:bg-indigo-600={mouseInsideOptionValue === optionValue}
					role="option"
					on:click={() => {
						value = optionValue;
						dispatch('change', optionValue);
					}}
					on:mouseenter={() => onMouseEnter(optionValue)}
					on:mouseleave={() => onMouseLeave(optionValue)}
				>
					<div class="flex items-center">
						<span
							class="ml-3 block truncate"
							class:font-normal={value !== optionValue}
							class:font-semibold={value === optionValue}>{optionName}</span
						>
					</div>

					<span
						class="text-indigo-600 absolute inset-y-0 right-0 flex items-center pr-4"
						class:text-white={mouseInsideOptionValue === optionValue}
						class:hidden={value !== optionValue}
					>
						<svg
							class="h-5 w-5"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</span>
				</li>
			{/each}
		</ul>
	</div>
</div>
