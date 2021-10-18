<script lang="ts">
	import { onMount } from 'svelte';
	import Input from '../components/Input.svelte';
	import Select from '../components/Select.svelte';
	import islandPerlin from '../constants/shaders/island-perlin';
	import islandSimplex from '../constants/shaders/island-simplex';
	import perlin from '../constants/shaders/perlin';
	import simplex from '../constants/shaders/simplex';
	import worley from '../constants/shaders/worley';
	import { UniformType } from '../constants/shaders/_interfaces';
	import { createQueryStore } from '../utils/store';

	const vertex = `
#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = a_texcoord;
}
`.trim();

	let canvas: HTMLCanvasElement;
	let gl: WebGLRenderingContext;

	onMount(() => {
		gl =
			canvas.getContext('webgl') ||
			(canvas.getContext('experimental-webgl') as WebGLRenderingContext);

		loadShaderProgram();
	});

	let algorithms = {
		worley,
		simplex,
		perlin,
		'island-perlin': islandPerlin,
		'island-simplex': islandSimplex
	};

	const algorithmDemoOptions = [
		{ name: 'Example: Island (Perlin)', value: 'island-perlin' },
		{ name: 'Example: Island (Simplex)', value: 'island-simplex' }
	].sort((a, b) => a.name.localeCompare(b.name));

	const algorithmOptions = [
		{ name: 'Worley', value: 'worley' },
		{ name: 'Simplex', value: 'simplex' },
		{ name: 'Perlin', value: 'perlin' }
	]
		.sort((a, b) => a.name.localeCompare(b.name))
		.concat(algorithmDemoOptions);

	const queryAlgorithmStore = createQueryStore<keyof typeof algorithms>('algorithm');
	let algorithm = queryAlgorithmStore.get();

	if (!(algorithm in algorithms)) {
		algorithm = 'perlin';
	}

	type Options<T extends keyof typeof algorithms = keyof typeof algorithms> = Record<
		T,
		Record<keyof typeof algorithms[T]['typing'], unknown>
	>;

	let options: Options = Object.keys(algorithms).reduce(
		(acc, algorithm: keyof typeof algorithms) => {
			const typing = algorithms[algorithm].typing;

			acc[algorithm] = Object.keys(typing).reduce((acc, key) => {
				acc[key] = typing[key].default;
				return acc;
			}, {} as Record<keyof typeof typing, unknown>);

			return acc;
		},
		{} as Options
	);

	let program: WebGLProgram;
	let buffer: WebGLBuffer;

	function updateProgramVariables(targetProgram: WebGLProgram) {
		if (!canvas || !program || program !== targetProgram) return;

		const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
		gl.uniform2fv(resolutionLocation, [canvas.width, canvas.height]);

		const timeLocation = gl.getUniformLocation(program, 'u_time');
		gl.uniform1f(timeLocation, performance.now() / 1000);

		for (const key in options[algorithm]) {
			const uniformLocation = gl.getUniformLocation(program, `u_${key}`);
			const uniformTyping = algorithms[algorithm].typing[key];
			const uniformType = uniformTyping.type;
			const uniformValue = options[algorithm][key];

			if (uniformType === UniformType.Float) {
				const divider = uniformTyping.divider || 1;
				gl.uniform1f(uniformLocation, uniformValue / divider);
			} else if (uniformType === UniformType.Int) {
				const divider = uniformTyping.divider || 1;
				gl.uniform1i(uniformLocation, uniformValue / divider);
			} else if (uniformType === UniformType.Vector2) {
				gl.uniform2fv(uniformLocation, uniformValue);
			} else if (uniformType === UniformType.Vector3) {
				gl.uniform3fv(uniformLocation, uniformValue);
			}
		}

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		requestAnimationFrame(() => updateProgramVariables(targetProgram));
	}

	function cleanupShaderProgram() {
		gl.useProgram(null);
		if (buffer) gl.deleteBuffer(buffer);
		if (program) gl.deleteProgram(program);
	}

	function loadShaderProgram() {
		cleanupShaderProgram();

		const vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertexShader, vertex);
		gl.compileShader(vertexShader);

		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			const error = gl.getShaderInfoLog(vertexShader);
			console.error(`Vertex shader did not compile successfully: ${error}`);
			return;
		}

		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragmentShader, algorithms[algorithm].shader);
		gl.compileShader(fragmentShader);

		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			const error = gl.getShaderInfoLog(fragmentShader);
			console.error(`Fragment shader did not compile successfully: ${error}`);
			cleanupShaderProgram();
			return;
		}

		program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.detachShader(program, vertexShader);
		gl.detachShader(program, fragmentShader);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const error = gl.getProgramInfoLog(program);
			console.error(`Shader program did not link successfully: ${error}`);
			return;
		}

		const texCoordsLoc = gl.getAttribLocation(program, 'a_texcoord');
		const texCoords = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoords);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
			gl.STATIC_DRAW
		);
		gl.enableVertexAttribArray(texCoordsLoc);
		gl.vertexAttribPointer(texCoordsLoc, 2, gl.FLOAT, false, 0, 0);

		const verticesLoc = gl.getAttribLocation(program, 'a_position');
		const vertices = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]),
			gl.STATIC_DRAW
		);
		gl.enableVertexAttribArray(verticesLoc);
		gl.vertexAttribPointer(verticesLoc, 2, gl.FLOAT, false, 0, 0);

		gl.useProgram(program);

		requestAnimationFrame(() => updateProgramVariables(program));

		// cleanupShaderProgram();
	}
</script>

<div class="page w-screen bg-gray-800 flex flex-row items-center justify-center p-3">
	<div class="mx-auto shadow-2xl">
		<div class="rounded-2xl shadow-lg bg-gray-900 w-full p-3 antialiased">
			<div class="flex flex-col lg:flex-row">
				<canvas
					bind:this={canvas}
					class="rounded-xl shadow-lg antialiased mb-4 lg:mb-0"
					width="1024"
					height="1024"
				/>
				<div class="w-full px-3">
					<Select
						name="Algorithm"
						options={algorithmOptions}
						bind:value={algorithm}
						on:change={() => {
							queryAlgorithmStore.set(algorithm);
							loadShaderProgram();
						}}
					/>
					<hr class="border-gray-800" />
					<br />
					{#each Object.entries(algorithms[algorithm].typing) as [key, uniform]}
						{#if uniform.type === UniformType.Float || uniform.type === UniformType.Int}
							<Input
								label={uniform.name}
								type={uniform.min !== undefined && uniform.max !== undefined ? 'range' : 'number'}
								min={uniform.min}
								max={uniform.max}
								step={uniform.step}
								bind:value={options[algorithm][key]}
							/>
						{/if}
						{#if uniform.type === UniformType.Vector2}
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-300">{uniform.name}</label>
							<div class="flex justify-between">
								<Input class="w-full mr-1" type="number" bind:value={options[algorithm][key][0]} />
								<Input class="w-full ml-1" type="number" bind:value={options[algorithm][key][1]} />
							</div>
						{/if}
						{#if uniform.type === UniformType.Vector3}
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-300">{uniform.name}</label>
							<div class="flex justify-between">
								<Input class="w-full mr-1" type="number" bind:value={options[algorithm][key][0]} />
								<Input class="w-full ml-1" type="number" bind:value={options[algorithm][key][1]} />
								<Input class="w-full ml-1" type="number" bind:value={options[algorithm][key][2]} />
							</div>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
	}

	canvas {
		width: 512px;
		height: 100%;
		max-width: 100%;
	}
</style>
