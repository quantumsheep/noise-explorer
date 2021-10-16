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

out vec4 fragColor;

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
  // Compute f i n a l noise value at P
  vec3 g;
  g.x = gx.x * x0.x + gy.x * x0.y;
  g.yz = gx.yz * x12.xz + gy.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 p = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = p * u_scale * vec2(u_resolution.x / u_resolution.y, 1.0);
    uv = uv * 10.;

    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

    float f = 0.0;
    for (int i = 1; i <= u_octaves; i++) {
        f += (1.0 / pow(2.0, float(i))) * simplex(uv);
        uv = m * uv;
    }

    f = 0.5 + 0.5 * f;

    fragColor = vec4(f, f, f, 1.0);
}
`.trimStart();

export default { typing, shader };
