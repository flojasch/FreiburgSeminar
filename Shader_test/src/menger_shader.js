export const menger_shader = (function() {

  const _VS = `#version 300 es

  #define saturate(a) clamp( a, 0.0, 1.0 )

  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `;
  

  const _PS = `#version 300 es
  #include <packing>
  #include <common>

  in vec2 vUv;
  out vec4 out_FragColor;

  uniform float iTime;
  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform vec3 cameraForward;
  uniform mat4 inverseProjection;
  uniform mat4 inverseView;

  #define MAX_STEPS 100
  #define MAX_DIST 1000.
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
      float size=50.; 
      vec3[] s = vec3[](vec3(1,1,1),vec3(1,1,0));
      float alpha=0.5*3.14; 
      float beta=0.03*3.14*iTime; 

      p=rotateX(p,beta);
      p=rotateY(p,alpha);
      
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

  vec3 _ScreenToWorld(vec3 pos) {
    vec4 posP = vec4(pos.xyz * 2.0 - 1.0, 1.0);

    vec4 posVS = inverseProjection * posP;
    vec4 posWS = inverseView * vec4((posVS.xyz / posVS.w), 1.0);

    return posWS.xyz;
  }

  void main() {
    float z = texture2D(tDepth, vUv).x;
    vec3 posWS = _ScreenToWorld(vec3(vUv, z));
    float dist = length(posWS - cameraPosition);
    vec3 diffuse = texture2D(tDiffuse, vUv).xyz;

    vec3 rd = normalize(posWS-cameraPosition);

    vec3 cubecol = vec3(1.,.0,.0);  
      
    float d=RayMarch(cameraPosition,rd);   
    vec3 p= cameraPosition+rd*d;   
   
    vec3 lightPos =vec3(0.,500.,300.);
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
    
    out_FragColor.rgb = col;

    if(d>MAX_DIST) out_FragColor.rgb = diffuse;
    out_FragColor.a = 1.0;
  }
  `;
  

  const _Shader = {
    uniforms: {
      "tDiffuse": { value: null },
      "tDepth": { value: null },
      "cameraNear": { value: 0.0 },
      "cameraFar": { value: 0.0 },
    },
    vertexShader: _VS,
    fragmentShader: _PS,
  };

  return {
    Shader: _Shader,
    VS: _VS,
    PS: _PS,
  };
})();
  