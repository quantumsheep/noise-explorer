import type { UniformDefinition } from './_interfaces';
import { UniformType } from './_interfaces';

export const typing = {
  position: <UniformDefinition>{
    name: 'Position',
    type: UniformType.Vector2,
    default: [0, 0],
  },
  scale: <UniformDefinition>{
    name: 'Scale',
    type: UniformType.Float,
    default: 1.0,
  },
};

export const shader = `
#version 300 es

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform float u_scale;

out vec4 fragColor;

float hash(vec2 p) {
    p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

float perlin(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    vec2 p = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = p * u_scale * vec2(u_resolution.x / u_resolution.y, 1.0);
    uv = uv * 10.;

    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    float f = 0.5000 * perlin(uv);
    uv = m * uv;
    f += 0.2500 * perlin(uv);
    uv = m * uv;
    f += 0.1250 * perlin(uv);
    uv = m * uv;
    f += 0.0625 * perlin(uv);
    uv = m * uv;

    f = 0.5 + 0.5 * f;

    fragColor = vec4(f, f, f, 1.0);
}
`.trimStart();

export default { typing, shader };
