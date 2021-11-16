import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({
  canvas
});
renderer.autoClearColor = false;

const camera = new THREE.OrthographicCamera(
  -1, //left
  1, //right
  1, //top
  -1, //bottom
  -1, //near,
  1, //far
);

const scene = new THREE.Scene();
const plane = new THREE.PlaneGeometry(2, 2);

const fragmentShader = `
#include <common>
 
uniform vec3 iResolution;
uniform float iTime;
uniform vec3 mouse;
uniform vec3 scale;
 
float distanceToMandelbrot( in vec2 c )
{
    
    float c2 = dot(c, c);
    // skip computation inside M1 
    if( 256.0*c2*c2 - 96.0*c2 + 32.0*c.x - 3.0 < 0.0 ) return 0.0;
    // skip computation inside M2 
    if( 16.0*(c2+2.0*c.x+1.0) - 1.0 < 0.0 ) return 0.0;
    

    // iterate
    float di =  1.0;
    vec2 z  = vec2(0.0);
    float m2 = 0.0;
    vec2 dz = vec2(0.0);
    for( int i=0; i<1000; i++ )
    {
        if( m2>1024.0 ) { di=0.0; break; }

		// Z' -> 2·Z·Z' + 1
        dz = 2.0*vec2(z.x*dz.x-z.y*dz.y, z.x*dz.y + z.y*dz.x) + vec2(1.0,0.0);
			
        // Z -> Z² + c			
        z = vec2( z.x*z.x - z.y*z.y, 2.0*z.x*z.y ) + c;
			
        m2 = dot(z,z);
    }

    // distance	
	// d(c) = |Z|·log|Z|/|Z'|
	float d = 0.5*sqrt(dot(z,z)/dot(dz,dz))*log(dot(z,z));
    if( di>0.5 ) d=0.0;
	
    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;

    // animation	
	//float tz = 0.5 - 0.5*cos(0.225*iTime);
    float zoo = scale.x; 
    //pow( 0.5, 17.0*tz );
    //vec2(-0.74543,.11301)
	vec2 c =  vec2(mouse.x,mouse.y) + p*zoo;

    // distance to Mandelbrot
    float d = distanceToMandelbrot(c);
    
    // do some soft coloring based on distance
	d = clamp( pow(4.0*d/zoo,0.2), 0.0, 1.0 );
    
    vec3 col = vec3(d);
    
    fragColor = vec4( col, 1.0 );
}
 
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;
const uniforms = {
  iTime: {
    value: 0
  },
  iResolution: {
    value: new THREE.Vector3()
  },
  mouse: {
    value: new THREE.Vector3()
  },
  scale: {
    value: new THREE.Vector3()
  },
};

const material = new THREE.ShaderMaterial({
  fragmentShader,
  uniforms
});
scene.add(new THREE.Mesh(plane, material));

function render(time) {
  time *= .001;
  resizeRendererToDisplaySize(renderer);

  const canvas = renderer.domElement;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iTime.value = time;
  uniforms.mouse.value.set(mx, my, 0);
  uniforms.scale.value.set(ex, ey, 0);
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);