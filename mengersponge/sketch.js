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
  #define SURF_DIST .01
  #define MAX_ITER 7
  
  float sdBox( vec3 p, vec3 b )
  {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
  }
  
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
  
  float sdMenger(vec3 p){
      float size=2.;
      p.z -=3.;  
      float alpha=0.5*3.14; 
      float beta=0.03*3.14*iTime; 
     
      p=rotateX(p,beta);
      p=rotateY(p,alpha);
      vec3[] s = vec3[](vec3(1,1,1),vec3(1,1,0));
      
      for(int iter=0;iter<MAX_ITER;++iter){
          p=rotateY(p,alpha);
          p=rotateX(p,beta);
         
          p=abs(p);
          if(p.y > p.x) p.yx = p.xy;
          if(p.z > p.y) p.zy = p.yz;
          
          if(p.z > .5*size) p -= size*s[0];
          else p -= size*s[1];
          size /=3.;
          
      }
      return sdBox(p,vec3(1.5*size));
  }
  
  float GetDist(vec3 p){
      float d=sdMenger(p);
      return d;
  }
  
  vec3 GetColor(vec3 p){ 
      vec3 col= vec3(1,1,1);;
      return col;
      
  }
  
  float RayMarch(vec3 ro,vec3 rd){
      float dO=0.;
      
      for(int i=0; i<MAX_STEPS; i++){
       vec3 p=ro+rd*dO;
          float dS=GetDist(p);
          dO +=dS;
          if(dO > MAX_DIST || dS< SURF_DIST) break;        
      
      }
      return dO;
  }
      
  vec3 GetNormal(vec3 p){
    float d=GetDist(p);
      vec2 e=vec2(.01,0);
      
      vec3 n= d-vec3(
          GetDist(p-e.xyy),
          GetDist(p-e.yxy),
          GetDist(p-e.yyx));
          
    return normalize(n);
  }
  
  float shadow( in vec3 ro, in vec3 rd, float mint, float maxt, float k )
  {
      float res = 1.0;
      for( float t=mint; t<maxt; )
      {
          float h = GetDist(ro + rd*t);
          if( h<0.001 )
              return 0.0;
          res = min( res, k*h/t );
          t += h;
      }
      return res;
  }
  
  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv=fragCoord.xy/iResolution.x-.5;
      vec3 rd= normalize( uv.x*ax+uv.y*ay+az);
      
      vec3 cubecol = vec3(1.,.0,.0);  
     // vec3 rd = normalize(vec3(uv.x, uv.y,1)); 
      
      
    float d=RayMarch(ro,rd);   
      vec3 p= ro+rd*d;   
     
      //Get Light
      vec3 lightPos =vec3(10,20,-20);
      vec3 l=normalize(lightPos-p);
      vec3 n=GetNormal(p);
      float cosphi=dot(n,l);
      vec3 v=normalize(-l+2.*cosphi*n);
      vec3 col=GetColor(p);
      float po=15.;
      float amb=0.1;
      float t=pow(clamp(dot(v,-rd),0.,1.),po);
      col = (1.-t)*(amb+(1.-amb)*cosphi)*col+t*vec3(1.);
           
      t=shadow(p,l,SURF_DIST*2.,MAX_DIST,4.);
      col *=t;   
      
      fragColor = vec4(col,1.0);
      if(d>MAX_DIST) fragColor =vec4(vec3(0.),0.);
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
    ay: {
      value: new THREE.Vector3()
    },
    ax: {
      value: new THREE.Vector3()
    },
    ro: {
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
    uniforms.ax.value.set(player.X.x, player.X.y, player.X.z);
    uniforms.ay.value.set(player.Y.x, player.Y.y, player.Y.z);
    uniforms.az.value.set(player.Z.x, player.Z.y, player.Z.z);
    uniforms.ro.value.set(player.x, player.y, player.z);
    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();