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

  uniform vec3 planetPosition;
  uniform float planetRadius;
  uniform float atmosphereRadius;
  uniform vec3 lightDir;

  //Definitionen für Mengerschwamm
  #define MAX_STEPS 100
  #define MAX_DIST 20000.
  #define SURF_DIST .01
  #define MAX_ITER 7

  //Definitionen für Atmosphere
  #define saturate(a) clamp( a, 0.0, 1.0 )
  #define PI 3.141592
  #define PRIMARY_STEP_COUNT 16
  #define LIGHT_STEP_COUNT 8
  
  //Methoden für Mengerschwamm
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
      float d=sdMenger(p-vec3(0.,10000.,3000.));
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

//Methoden für Atmospere
float _SoftLight(float a, float b) {
  return (b < 0.5 ?
      (2.0 * a * b + a * a * (1.0 - 2.0 * b)) :
      (2.0 * a * (1.0 - b) + sqrt(a) * (2.0 * b - 1.0))
  );
}

vec3 _SoftLight(vec3 a, vec3 b) {
  return vec3(
      _SoftLight(a.x, b.x),
      _SoftLight(a.y, b.y),
      _SoftLight(a.z, b.z)
  );
}

bool _RayIntersectsSphere(
    vec3 rayStart, vec3 rayDir, vec3 sphereCenter, float sphereRadius, out float t0, out float t1) {
  vec3 oc = rayStart - sphereCenter;
  float a = dot(rayDir, rayDir);
  float b = 2.0 * dot(oc, rayDir);
  float c = dot(oc, oc) - sphereRadius * sphereRadius;
  float d =  b * b - 4.0 * a * c;

  // Also skip single point of contact
  if (d <= 0.0) {
    return false;
  }

  float r0 = (-b - sqrt(d)) / (2.0 * a);
  float r1 = (-b + sqrt(d)) / (2.0 * a);

  t0 = min(r0, r1);
  t1 = max(r0, r1);

  return (t1 >= 0.0);
}


vec3 _SampleLightRay(
    vec3 origin, vec3 sunDir, float planetScale, float planetRadius, float totalRadius,
    float rayleighScale, float mieScale, float absorptionHeightMax, float absorptionFalloff) {

  float t0, t1;
  _RayIntersectsSphere(origin, sunDir, planetPosition, totalRadius, t0, t1);

  float actualLightStepSize = (t1 - t0) / float(LIGHT_STEP_COUNT);
  float virtualLightStepSize = actualLightStepSize * planetScale;
  float lightStepPosition = 0.0;

  vec3 opticalDepthLight = vec3(0.0);

  for (int j = 0; j < LIGHT_STEP_COUNT; j++) {
    vec3 currentLightSamplePosition = origin + sunDir * (lightStepPosition + actualLightStepSize * 0.5);

    // Calculate the optical depths and accumulate
    float currentHeight = length(currentLightSamplePosition) - planetRadius;
    float currentOpticalDepthRayleigh = exp(-currentHeight / rayleighScale) * virtualLightStepSize;
    float currentOpticalDepthMie = exp(-currentHeight / mieScale) * virtualLightStepSize;
    float currentOpticalDepthOzone = (1.0 / cosh((absorptionHeightMax - currentHeight) / absorptionFalloff));
    currentOpticalDepthOzone *= currentOpticalDepthRayleigh * virtualLightStepSize;

    opticalDepthLight += vec3(
        currentOpticalDepthRayleigh,
        currentOpticalDepthMie,
        currentOpticalDepthOzone);

    lightStepPosition += actualLightStepSize;
  }

  return opticalDepthLight;
}

void _ComputeScattering(
    vec3 worldSpacePos, vec3 rayDirection, vec3 rayOrigin, vec3 sunDir,
    out vec3 scatteringColour, out vec3 scatteringOpacity) {

  vec3 betaRayleigh = vec3(5.5e-6, 13.0e-6, 22.4e-6);
  float betaMie = 21e-6;
  vec3 betaAbsorption = vec3(2.04e-5, 4.97e-5, 1.95e-6);
  float g = 0.76;
  float sunIntensity = 40.0;

  float planetRadius = planetRadius;
  float atmosphereRadius = atmosphereRadius - planetRadius;
  float totalRadius = planetRadius + atmosphereRadius;

  float referencePlanetRadius = 6371000.0;
  float referenceAtmosphereRadius = 100000.0;
  float referenceTotalRadius = referencePlanetRadius + referenceAtmosphereRadius;
  float referenceRatio = referencePlanetRadius / referenceAtmosphereRadius;

  float scaleRatio = planetRadius / atmosphereRadius;
  float planetScale = referencePlanetRadius / planetRadius;
  float atmosphereScale = scaleRatio / referenceRatio;
  float maxDist = distance(worldSpacePos, rayOrigin);

  float rayleighScale = 8500.0 / (planetScale * atmosphereScale);
  float mieScale = 1200.0 / (planetScale * atmosphereScale);
  float absorptionHeightMax = 32000.0 * (planetScale * atmosphereScale);
  float absorptionFalloff = 3000.0 / (planetScale * atmosphereScale);;

  float mu = dot(rayDirection, sunDir);
  float mumu = mu * mu;
  float gg = g * g;
  float phaseRayleigh = 3.0 / (16.0 * PI) * (1.0 + mumu);
  float phaseMie = 3.0 / (8.0 * PI) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg));

  // Early out if ray doesn't intersect atmosphere.
  float t0, t1;
  if (!_RayIntersectsSphere(rayOrigin, rayDirection, planetPosition, totalRadius, t0, t1)) {
    scatteringOpacity = vec3(1.0);
    return;
  }

  // Clip the ray between the camera and potentially the planet surface.
  t0 = max(0.0, t0);
  t1 = min(maxDist, t1);

  float actualPrimaryStepSize = (t1 - t0) / float(PRIMARY_STEP_COUNT);
  float virtualPrimaryStepSize = actualPrimaryStepSize * planetScale;
  float primaryStepPosition = 0.0;

  vec3 accumulatedRayleigh = vec3(0.0);
  vec3 accumulatedMie = vec3(0.0);
  vec3 opticalDepth = vec3(0.0);

  // Take N steps along primary ray
  for (int i = 0; i < PRIMARY_STEP_COUNT; i++) {
    vec3 currentPrimarySamplePosition = rayOrigin + rayDirection * (
        primaryStepPosition + actualPrimaryStepSize * 0.5);

    float currentHeight = max(0.0, length(currentPrimarySamplePosition) - planetRadius);

    float currentOpticalDepthRayleigh = exp(-currentHeight / rayleighScale) * virtualPrimaryStepSize;
    float currentOpticalDepthMie = exp(-currentHeight / mieScale) * virtualPrimaryStepSize;

    // Taken from https://www.shadertoy.com/view/wlBXWK
    float currentOpticalDepthOzone = (1.0 / cosh((absorptionHeightMax - currentHeight) / absorptionFalloff));
    currentOpticalDepthOzone *= currentOpticalDepthRayleigh * virtualPrimaryStepSize;

    opticalDepth += vec3(currentOpticalDepthRayleigh, currentOpticalDepthMie, currentOpticalDepthOzone);

    // Sample light ray and accumulate optical depth.
    vec3 opticalDepthLight = _SampleLightRay(
        currentPrimarySamplePosition, sunDir,
        planetScale, planetRadius, totalRadius,
        rayleighScale, mieScale, absorptionHeightMax, absorptionFalloff);

    vec3 r = (
        betaRayleigh * (opticalDepth.x + opticalDepthLight.x) +
        betaMie * (opticalDepth.y + opticalDepthLight.y) + 
        betaAbsorption * (opticalDepth.z + opticalDepthLight.z));
    vec3 attn = exp(-r);

    accumulatedRayleigh += currentOpticalDepthRayleigh * attn;
    accumulatedMie += currentOpticalDepthMie * attn;

    primaryStepPosition += actualPrimaryStepSize;
  }

  scatteringColour = sunIntensity * (phaseRayleigh * betaRayleigh * accumulatedRayleigh + phaseMie * betaMie * accumulatedMie);
  scatteringOpacity = exp(
      -(betaMie * opticalDepth.y + betaRayleigh * opticalDepth.x + betaAbsorption * opticalDepth.z));
}

vec3 _ApplyGroundFog(
    in vec3 rgb,
    float distToPoint,
    float height,
    in vec3 worldSpacePos,
    in vec3 rayOrigin,
    in vec3 rayDir,
    in vec3 sunDir)
{
  vec3 up = normalize(rayOrigin);

  float skyAmt = dot(up, rayDir) * 0.25 + 0.75;
  skyAmt = saturate(skyAmt);
  skyAmt *= skyAmt;

  vec3 DARK_BLUE = vec3(0.1, 0.2, 0.3);
  vec3 LIGHT_BLUE = vec3(0.5, 0.6, 0.7);
  vec3 DARK_ORANGE = vec3(0.7, 0.4, 0.05);
  vec3 BLUE = vec3(0.5, 0.6, 0.7);
  vec3 YELLOW = vec3(1.0, 0.9, 0.7);

  vec3 fogCol = mix(DARK_BLUE, LIGHT_BLUE, skyAmt);
  float sunAmt = max(dot(rayDir, sunDir), 0.0);
  fogCol = mix(fogCol, YELLOW, pow(sunAmt, 16.0));

  float be = 0.0005;
  float fogAmt = (1.0 - exp(-distToPoint * be));

  // Sun
  sunAmt = 0.5 * saturate(pow(sunAmt, 256.0));

  return mix(rgb, fogCol, fogAmt) + sunAmt * YELLOW;
}

vec3 _ApplySpaceFog(
    in vec3 rgb,
    in float distToPoint,
    in float height,
    in vec3 worldSpacePos,
    in vec3 rayOrigin,
    in vec3 rayDir,
    in vec3 sunDir)
{
  float atmosphereThickness = (atmosphereRadius - planetRadius);

  float t0 = -1.0;
  float t1 = -1.0;

  // This is a hack since the world mesh has seams that we haven't fixed yet.
  if (_RayIntersectsSphere(
      rayOrigin, rayDir, planetPosition, planetRadius, t0, t1)) {
    if (distToPoint > t0) {
      distToPoint = t0;
      worldSpacePos = rayOrigin + t0 * rayDir;
    }
  }

  if (!_RayIntersectsSphere(
      rayOrigin, rayDir, planetPosition, planetRadius + atmosphereThickness * 5.0, t0, t1)) {
    return rgb * 0.5;
  }

  // Figure out a better way to do this
  float silhouette = saturate((distToPoint - 10000.0) / 10000.0);

  // Glow around planet
  float scaledDistanceToSurface = 0.0;

  // Calculate the closest point between ray direction and planet. Use a point in front of the
  // camera to force differences as you get closer to planet.
  vec3 fakeOrigin = rayOrigin + rayDir * atmosphereThickness;
  float t = max(0.0, dot(rayDir, planetPosition - fakeOrigin) / dot(rayDir, rayDir));
  vec3 pb = fakeOrigin + t * rayDir;

  scaledDistanceToSurface = saturate((distance(pb, planetPosition) - planetRadius) / atmosphereThickness);
  scaledDistanceToSurface = smoothstep(0.0, 1.0, 1.0 - scaledDistanceToSurface);
  //scaledDistanceToSurface = smoothstep(0.0, 1.0, scaledDistanceToSurface);

  float scatteringFactor = scaledDistanceToSurface * silhouette;

  // Fog on surface
  t0 = max(0.0, t0);
  t1 = min(distToPoint, t1);

  vec3 intersectionPoint = rayOrigin + t1 * rayDir;
  vec3 normalAtIntersection = normalize(intersectionPoint);

  float distFactor = exp(-distToPoint * 0.0005 / (atmosphereThickness));
  float fresnel = 1.0 - saturate(dot(-rayDir, normalAtIntersection));
  fresnel = smoothstep(0.0, 1.0, fresnel);

  float extinctionFactor = saturate(fresnel * distFactor) * (1.0 - silhouette);

  // Front/Back Lighting
  vec3 BLUE = vec3(0.5, 0.6, 0.75);
  vec3 YELLOW = vec3(1.0, 0.9, 0.7);
  vec3 RED = vec3(0.035, 0.0, 0.0);

  float NdotL = dot(normalAtIntersection, sunDir);
  float wrap = 0.5;
  float NdotL_wrap = max(0.0, (NdotL + wrap) / (1.0 + wrap));
  float RdotS = max(0.0, dot(rayDir, sunDir));
  float sunAmount = RdotS;

  vec3 backLightingColour = YELLOW * 0.1;
  vec3 frontLightingColour = mix(BLUE, YELLOW, pow(sunAmount, 32.0));

  vec3 fogColour = mix(backLightingColour, frontLightingColour, NdotL_wrap);

  extinctionFactor *= NdotL_wrap;

  // Sun
  float specular = pow((RdotS + 0.5) / (1.0 + 0.5), 64.0);

  fresnel = 1.0 - saturate(dot(-rayDir, normalAtIntersection));
  fresnel *= fresnel;

  float sunFactor = (length(pb) - planetRadius) / (atmosphereThickness * 5.0);
  sunFactor = (1.0 - saturate(sunFactor));
  sunFactor *= sunFactor;
  sunFactor *= sunFactor;
  sunFactor *= specular * fresnel;

  vec3 baseColour = mix(rgb, fogColour, extinctionFactor);
  vec3 litColour = baseColour + _SoftLight(fogColour * scatteringFactor + YELLOW * sunFactor, baseColour);
  vec3 blendedColour = mix(baseColour, fogColour, scatteringFactor);
  blendedColour += blendedColour + _SoftLight(YELLOW * sunFactor, blendedColour);
  return mix(litColour, blendedColour, scaledDistanceToSurface * 0.25);
}

vec3 _ApplyFog(
  in vec3 rgb,
  in float distToPoint,
  in float height,
  in vec3 worldSpacePos,
  in vec3 rayOrigin,
  in vec3 rayDir,
  in vec3 sunDir)
{
  float distToPlanet = max(0.0, length(rayOrigin) - planetRadius);
  float atmosphereThickness = (atmosphereRadius - planetRadius);

  vec3 groundCol = _ApplyGroundFog(
    rgb, distToPoint, height, worldSpacePos, rayOrigin, rayDir, sunDir);
  vec3 spaceCol = _ApplySpaceFog(
    rgb, distToPoint, height, worldSpacePos, rayOrigin, rayDir, sunDir);

  float blendFactor = saturate(distToPlanet / (atmosphereThickness * 0.5));

  blendFactor = smoothstep(0.0, 1.0, blendFactor);
  blendFactor = smoothstep(0.0, 1.0, blendFactor);

  return mix(groundCol, spaceCol, blendFactor);
}

  void main() {
    float z = texture2D(tDepth, vUv).x;
    vec3 posWS = _ScreenToWorld(vec3(vUv, z));
    float dist = length(posWS - cameraPosition);
    vec3 diffuse = texture2D(tDiffuse, vUv).xyz;
    vec3 rd = normalize(posWS-cameraPosition);
    
    //Berechnung des Mengerschwamms
    float d=RayMarch(cameraPosition,rd);   
    if(d < dist && d<MAX_DIST){ 
      vec3 p= cameraPosition+rd*d;   
      vec3 n=GetNormal(p);
      float cosphi=dot(n,lightDir);
      vec3 v=normalize(-lightDir+2.*cosphi*n);
      vec3 col=GetColor(p);
      float po=15.;
      float amb=0.1;
      float t=pow(clamp(dot(v,-rd),0.,1.),po);
      col = (1.-t)*(amb+(1.-amb)*cosphi)*col+t*vec3(1.);
      t=shadow(p,lightDir,SURF_DIST*2.,MAX_DIST,4.);
      col *=t;   
      diffuse = col;
    }

    //Berechnung der Atmosphere
    float height = max(0.0, length(cameraPosition) - planetRadius);
    diffuse = _ApplyFog(diffuse, dist, height, posWS, cameraPosition, rd, lightDir);
    diffuse = ACESFilmicToneMapping(diffuse);


    out_FragColor.rgb = diffuse;
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
  