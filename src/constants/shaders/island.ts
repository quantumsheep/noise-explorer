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
  radius: <UniformDefinition>{
    name: 'Radius',
    type: UniformType.Float,
    default: 0.448,
    step: 0.001,
  },
  radius_smooth: <UniformDefinition>{
    name: 'Radius Smooth',
    type: UniformType.Float,
    default: 0.202,
    step: 0.001,
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

uniform vec2 u_position;
uniform float u_scale;
uniform float u_radius;
uniform float u_radius_smooth;

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

    vec2 uv = (p + (u_position / u_resolution.xy)) * u_scale * vec2(u_resolution.x / u_resolution.y, 1.0);
    uv = uv * 10.;

    float f = 0.0;

    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    f = 0.5000 * perlin(uv);
    uv = m * uv;
    f += 0.2500 * perlin(uv);
    uv = m * uv;
    f += 0.1250 * perlin(uv);
    uv = m * uv;
    f += 0.0625 * perlin(uv);
    uv = m * uv;

    f = 0.5 + 0.5 * f;

    float radius = u_radius;
    float dist = distance(p, vec2(0.5));
    float circle = smoothstep(-u_radius_smooth, u_radius_smooth, radius - dist);
    f *= circle;

    if(f > 0.7) {
        fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else if(f > 0.67) {
        fragColor = vec4(0.71, 0.81, 0.72, 1);
    } else if(f > 0.6) {
        fragColor = vec4(0.515, 0.715, 0.531, 1.000);
    } else if(f > 0.5) {
        fragColor = vec4(0.283, 0.860, 0.252, 1.000);
    } else if(f > 0.46) {
        fragColor = vec4(0.94, 1, 0.71, 1);
    } else if(f > 0.4) {
        fragColor = vec4(0.236, 0.325, 1.000, 1.000);
    } else if(f > 0.35) {
        fragColor = vec4(0, 0.12, 1, 1);
    } else {
        fragColor = vec4(0, 0, 0.81, 1);
    }

    // fragColor = vec4(f, f, f, 1.0);
}
`.trimStart();

export default { typing, shader };
