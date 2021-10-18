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
    default: 0.75,
    step: 0.01,
  },
  octaves: <UniformDefinition>{
    name: 'Octaves',
    type: UniformType.Int,
    default: 4,
    min: 1,
    max: 7,
  },
  amplitude: <UniformDefinition>{
    name: 'Amplitude',
    type: UniformType.Float,
    default: 50,
    min: -100,
    max: 100,
    step: 1,
    divider: 100,
  },
  radius: <UniformDefinition>{
    name: 'Radius',
    type: UniformType.Float,
    default: 44.8,
    step: 0.001,
    min: 0,
    max: 100,
    divider: 100,
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
uniform int u_octaves;
uniform float u_amplitude;
uniform float u_radius;
uniform float u_radius_smooth;

out vec4 fragColor;

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec2 fade(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Classic Perlin noise
float perlin(vec2 P) {
    // Integer and fract i o n a l coords for a l l four corners
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // Avoid truncation e f f e c t s in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    // Gradients from 41 points on a l i n e mapped to a diamond
    vec4 gx = 2.0 * fract(i * (1.0 / 41.0)) - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    // Extrapolation from the four corners
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    // Interpolation to compute f i n a l noise value
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

void main() {
    vec2 p = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = (p + (u_position / u_resolution.xy)) * u_scale * vec2(u_resolution.x / u_resolution.y, 1.0);
    uv = uv * 10.;


    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

    float f = 0.0;
    float amplitude = u_amplitude;
    for (int i = 1; i <= u_octaves; i++) {
        f += amplitude * perlin(uv);
        uv = m * uv;
        amplitude /= 2.0;
    }

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
