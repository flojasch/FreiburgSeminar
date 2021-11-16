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

function main() {
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
uniform vec3 az;
uniform vec3 ay;
uniform vec3 ax;
uniform vec3 ro;
 
#define MAX_STEPS 100
#define MAX_DIST 100.
#define MIN_DIST .01

vec3 bgcolor=vec3(.5,.7,.9);

vec3 rotateY(vec3 p, float alpha){
	float px=p.x;
    float c=cos(alpha);
    float s=sin(alpha);
    
 	p.x=c*px-s*p.z;
    p.z=s*px+c*p.z;
    
    return p;
}

vec3 rotateX(vec3 p, float alpha){
	float py=p.y;
    float c=cos(alpha);
    float s=sin(alpha);
    
 	p.y=c*py-s*p.z;
    p.z=s*py+c*p.z;
    
    return p;
}


float plane(vec3 p){
 	vec3(0,1,0);
    float d=p.y;
    return d;
}

float box( vec3 p, vec3 b, float r )
{  
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float sphere(vec3 p,vec3 m){
   // p.z= mod(p.z,10.);
   // p.x= mod(p.x,10.);
	float d=length(p-m)-2.;  
    return d;
}

float objdist(int k, vec3 p){
   
    if(k==0) return plane(p);
    if(k==1) return box(p-vec3(0,1.5,8),vec3(1),0.5);
    if(k==2) return sphere(p,vec3(5.*cos(iTime),2,8.+5.*sin(iTime)));

}
vec3 getcolor(vec3 p){
    float[20] d;
    vec3 planecol=vec3(.7,.7,.9);
    if((mod(p.x,10.) > 5. && mod(p.z,10.) > 5.)||(mod(p.x,10.) < 5. && mod(p.z,10.) < 5.)) 
        planecol=vec3(.5);
    vec3[] colors=vec3[](planecol,
                   vec3(0.9,0.3,0.3),
                   vec3(0));
    
    for(int k=0;k<3;++k) d[k]=objdist(k,p);
    
    float dist=MAX_DIST;
    vec3 color=bgcolor;    
    for(int i=0;i<3;i++){
        if(d[i]<dist){
            color=colors[i];
            dist=d[i];
        }
    }
    return color;
}


float getdist(vec3 p){
    float[20] d;
    
    for(int k=0;k<3;++k) d[k]=objdist(k,p);
    
    float dist=MAX_DIST;
    for(int i=0;i<3;i++){
        if(d[i]<dist){
            dist=d[i];
        }
    }
    return dist;
}

vec3 getnormal(vec3 p){
    float d=getdist(p);
    vec2 e=vec2(.01,0.);
    
    vec3 n=d-vec3(getdist(p-e.xyy),
                  getdist(p-e.yxy),
                  getdist(p-e.yyx));
    return normalize(n);
}

float raymarch(vec3 ro, vec3 rd){
    
    float dist = 0.;
    vec3 p = ro;
    
    for(int i=0; i < MAX_STEPS ; i++){
     float d=getdist(p);
        p += d*rd;
        dist += d;
        if(d < MIN_DIST || d > MAX_DIST) break;
    }
    
    return dist;
    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)

    vec2 uv = (fragCoord-0.5*iResolution.xy)/iResolution.y;
    vec3 rd= normalize( uv.x*ax+uv.y*ay+az);
    
    float beta=-.3;
    rd=rotateX(rd,-beta);
    
    float d=raymarch(ro,rd);
    vec3 p=ro+d*rd;   
    vec3 l=vec3(3.,6,.0);
	  vec3 n=getnormal(p);
    vec3 col=getcolor(p);   
    int i=0;
    //reflecting sphere
    while(length(col)==0.&& i<2){
      rd = normalize(rd-2.*dot(n,rd)*n);
      d=raymarch(p+n*MIN_DIST*2.,rd);
      p=p+d*rd;
      col=getcolor(p); 
      n=getnormal(p);  
    }
    
    vec3 pl = normalize(l-p);
    vec3 v = normalize(pl-2.*dot(n,pl)*n);
 	
    
   //diffuse reflection and ambient light
    float amb=0.5;
    float diff= clamp((1.-amb)*dot(n,pl)+amb*dot(n,normalize(ro-p)),.0,1.);
    col *=diff;
    
     //reflection	
    float t=pow(clamp(dot(v,rd),0.,1.),20.);
    col=t*vec3(1)+(1.-t)*col;
    
    //shadow
     if(d<MAX_DIST){
       float ds=raymarch(p+n*MIN_DIST*2.,pl);
       if( ds < length(l-p)) col=col*0.2;
     }
    
    //fog
    t=pow(clamp(d/MAX_DIST,0.,1.),1.);
    col= t*bgcolor+(1.-t)*col;
     
    // Output to screen
    fragColor = vec4(col,1.0);
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
    az: {
      value: new THREE.Vector3()
    },
    ay:{
      value: new THREE.Vector3()
    },
    ax: {
      value: new THREE.Vector3()
    },
    ro:{
      value: new THREE.Vector3()
    }
  };
  
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms
  });
  scene.add(new THREE.Mesh(plane, material));

  function render(time) {
    time *= .001;
    movePlayer(mov);
    resizeRendererToDisplaySize(renderer);

    const canvas = renderer.domElement;
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iTime.value = time;
    uniforms.ax.value.set(player.X.x,player.X.y,player.X.z);
    uniforms.ay.value.set(player.Y.x,player.Y.y,player.Y.z);
    uniforms.az.value.set(player.Z.x,player.Z.y,player.Z.z);
    uniforms.ro.value.set(player.x,player.y,player.z);
    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();