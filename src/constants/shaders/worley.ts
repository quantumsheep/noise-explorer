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
    default: 10.0,
  },
  mode: <UniformDefinition>{
    name: 'Mode',
    type: UniformType.Int,
    default: 0,
    min: 0,
    max: 63,
  },
};

export const shader = `
#version 300 es

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

uniform float u_position;
uniform float u_scale;
uniform float u_mode;

out vec4 fragColor;

#define OCTAVES   		1		// 7

vec2 hash( vec2 p ){
	p = vec2( dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
	return fract(sin(p)*43758.5453);
}

float worley( vec2 x, float time, float mode){
    float function 			= mod(mode,4.0);
    bool  multiply_by_F1	= mod(mode,8.0)  >= 4.0;
    bool  inverse				= mod(mode,16.0) >= 8.0;
    float distance_type	= mod(mode/16.0,4.0);
    
	vec2 n = floor( x );
	vec2 f = fract( x );
	
	float F1 = 8.0;
	float F2 = 8.0;
	
	for( int j=-1; j<=1; j++ )
		for( int i=-1; i<=1; i++ ){
			vec2 g = vec2(i,j);
			vec2 o = hash( n + g );

			o = 0.5 + 0.41*sin(time + 6.2831*o );	
			vec2 r = g - f + o;

		float d = 	distance_type < 1.0 ? dot(r,r)  :				// euclidean^2
				  	distance_type < 2.0 ? sqrt(dot(r,r)) :			// euclidean
					distance_type < 3.0 ? abs(r.x) + abs(r.y) :		// manhattan
					distance_type < 4.0 ? max(abs(r.x), abs(r.y)) :	// chebyshev
					0.0;

		if( d<F1 ) { 
			F2 = F1; 
			F1 = d; 
		} else if( d<F2 ) {
			F2 = d;
		}
    }
	
	float c = function < 1.0 ? F1 : 
			  function < 2.0 ? F2 : 
			  function < 3.0 ? F2-F1 :
			  function < 4.0 ? (F1+F2)/2.0 : 
			  0.0;
		
	if( multiply_by_F1 )	c *= F1;
	if( inverse )			c = 1.0 - c;
	
    return c;
}

float fbm(vec2 p, float time, float mode){
	float s = 0.0;
	float m = 0.0;
	float a = 0.5;
	
	for( int i=0; i<OCTAVES; i++ ){
		s += a * worley(p, time, mode);
		m += a;
		a *= 0.5;
		p *= 2.0;
	}
	return s/m;
}

void main() {
  vec2 st = (gl_FragCoord.xy + u_position) / u_resolution;
  float n = worley(st * u_scale, u_time, u_mode);
  fragColor = vec4(vec3(n), 1.0);
}
`.trimStart();

export default { typing, shader };
