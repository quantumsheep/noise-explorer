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
    default: 0.4,
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

#define MAX_OCTAVES 7

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec3 taylorInvSqrt(vec3 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float simplex(vec2 v) {
  const vec2 C = vec2(0.211324865405187134, // (3.0 -sqrt ( 3 . 0 ) ) / 6 . 0 ;
  0.366025403784438597); // 0.5*( sqrt ( 3 . 0 ) -1.0) ;
  // First corner
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  // Other corners
  vec2 i1;
  i1.x = step(x0.y, x0.x); // 1.0 i f x0 . x > x0 . y , e l s e 0.0
  i1.y = 1.0 - i1.x;
  // x0 = x0 - 0.0 + 0.0 *C. xx ;
  // x1 = x0 - i1 + 1.0 *C. xx ;
  // x2 = x0 - 1.0 + 2.0 *C. xx ;
  vec4 x12 = x0.xyxy + vec4(C.xx, C.xx * 2.0 - 1.0);
  x12.xy -= i1;
  // Permutations
  i = mod(i, 289.0); // Avoid truncation in polynomial evaluation
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  // Circularly symmetric blending kernel
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  // Gradients from 41 points on a line , mapped onto a diamond
  vec3 x = fract(p * (1.0 / 41.0)) * 2.0 - 1.0;
  vec3 gy = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5); // round (x) i s a GLSL 1.30 feature
  vec3 gx = x - ox;
  // Normalise gradients implicitly by scaling m
  m *= taylorInvSqrt(gx * gx + gy * gy);
  // Compute final noise value at P
  vec3 g;
  g.x = gx.x * x0.x + gy.x * x0.y;
  g.yz = gx.yz * x12.xz + gy.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 p = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = (p + (u_position / u_resolution.xy)) * u_scale * vec2(u_resolution.x / u_resolution.y, 1.0);
    uv = uv * 10.;

    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

    float f = 0.0;
    float amplitude = u_amplitude;
    for (int i = 1; i <= MAX_OCTAVES; i++) {
        if (i > u_octaves) break;
        f += amplitude * simplex(uv);
        uv = m * uv;
        amplitude /= 2.0;
    }

    f = 0.5 + 0.5 * f;

    float radius = u_radius;
    float dist = distance(p, vec2(0.5));
    float circle = smoothstep(-u_radius_smooth, u_radius_smooth, radius - dist);
    f *= circle;

    if(f > 0.7) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else if(f > 0.67) {
        gl_FragColor = vec4(0.71, 0.81, 0.72, 1);
    } else if(f > 0.6) {
        gl_FragColor = vec4(0.515, 0.715, 0.531, 1.000);
    } else if(f > 0.5) {
        gl_FragColor = vec4(0.283, 0.860, 0.252, 1.000);
    } else if(f > 0.46) {
        gl_FragColor = vec4(0.94, 1, 0.71, 1);
    } else if(f > 0.4) {
        gl_FragColor = vec4(0.236, 0.325, 1.000, 1.000);
    } else if(f > 0.35) {
        gl_FragColor = vec4(0, 0.12, 1, 1);
    } else {
        gl_FragColor = vec4(0, 0, 0.81, 1);
    }

    // gl_FragColor = vec4(f, f, f, 1.0);
}
`.trimStart();

export default { typing, shader };
