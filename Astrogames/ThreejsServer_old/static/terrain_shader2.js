export const terrain_shader2 = (function() {

  const _VS = `#version 300 es
  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `;
  
  const _PS = `#version 300 es
  #include <common>
  in vec2 vUv;
  out vec4 out_FragColor;

  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform sampler2D iChannel0;
  uniform mat4 inverseProjection;
  uniform mat4 inverseView;
  //uniform float iScale;
  const float iScale=200.;
// value noise, and its analytical derivatives
vec3 noised( in vec2 x )
{
    vec2 f = fract(x);
    vec2 u = f*f*(3.0-2.0*f);
    vec2 du = 6.0*f*(1.0-f);

    ivec2 p = ivec2(floor(x));
    float a = texelFetch( iChannel0, (p+ivec2(0,0))&255, 0 ).x;
    float b = texelFetch( iChannel0, (p+ivec2(1,0))&255, 0 ).x;
    float c = texelFetch( iChannel0, (p+ivec2(0,1))&255, 0 ).x;
    float d = texelFetch( iChannel0, (p+ivec2(1,1))&255, 0 ).x;

    return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
                du*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
}

const mat2 m2 = mat2(0.8,-0.6,0.6,0.8);

float terrainH( in vec2 x )
{
	vec2  p = x*0.003/iScale;
    float a = 0.0;
    float b = 1.0;
	vec2  d = vec2(0.0);
    for( int i=0; i<16; i++ )
    {
        vec3 n = noised(p);
        d += n.yz;
        a += b*n.x/(1.0+dot(d,d));
		b *= 0.5;
        p = m2*p*2.0;
    }

	return iScale*120.0*a;
}

float terrainM( in vec2 x )
{
	vec2  p = x*0.003/iScale;
    float a = 0.0;
    float b = 1.0;
	vec2  d = vec2(0.0);
    for( int i=0; i<9; i++ )
    {
        vec3 n = noised(p);
        d += n.yz;
        a += b*n.x/(1.0+dot(d,d));
		b *= 0.5;
        p = m2*p*2.0;
    }
    
	return iScale*120.0*a;
}

float terrainL( in vec2 x )
{
	vec2  p = x*0.003/iScale;
    float a = 0.0;
    float b = 1.0;
	vec2  d = vec2(0.0);
    for( int i=0; i<3; i++ )
    {
        vec3 n = noised(p);
        d += n.yz;
        a += b*n.x/(1.0+dot(d,d));
		b *= 0.5;
        p = m2*p*2.0;
    }
    
	return iScale*120.0*a;
}

float raycast( in vec3 ro, in vec3 rd, in float tmin, in float tmax )
{
    float t = tmin;
	for( int i=0; i<300; i++ )
	{
        vec3 pos = ro + t*rd;
		float h = pos.y - terrainM( pos.xz );
		if( abs(h)<(0.0015*t) || t>tmax ) break;
		t += 0.4*h;
	}

	return t;
}

float softShadow(in vec3 ro, in vec3 rd, float dis )
{
    float minStep = clamp(dis*0.01,iScale*0.5,iScale*50.0);

    float res = 1.0;
    float t = 0.001;
	for( int i=0; i<80; i++ )
	{
	    vec3  p = ro + t*rd;
        float h = p.y - terrainM( p.xz );
		res = min( res, 16.0*h/t );
		t += max(minStep,h);
		if( res<0.001 ||p.y>(iScale*200.0) ) break;
	}
	return clamp( res, 0.0, 1.0 );
}

vec3 calcNormal( in vec3 pos, float t )
{
    vec2  eps = vec2( 0.001*t, 0.0 );
    return normalize( vec3( terrainH(pos.xz-eps.xy) - terrainH(pos.xz+eps.xy),
                            2.0*eps.x,
                            terrainH(pos.xz-eps.yx) - terrainH(pos.xz+eps.yx) ) );
}

float fbm( vec2 p )
{
    float f = 0.0;
    f += 0.5000*texture( iChannel0, p/256.0 ).x; p = m2*p*2.02;
    f += 0.2500*texture( iChannel0, p/256.0 ).x; p = m2*p*2.03;
    f += 0.1250*texture( iChannel0, p/256.0 ).x; p = m2*p*2.01;
    f += 0.0625*texture( iChannel0, p/256.0 ).x;
    return f/0.9375;
}

vec4 render( in vec3 ro, in vec3 rd )
{
    vec3 light1 = normalize( vec3(-0.8,0.4,-0.3) );
    // bounding plane
    float tmin = 1.0;
    float tmax = 5000.0*iScale;
#if 1
    float maxh = 250.0*iScale;
    float tp = (maxh-ro.y)/rd.y;
    if( tp>0.0 )
    {
        if( ro.y>maxh ) tmin = max( tmin, tp );
        else            tmax = min( tmax, tp );
    }
#endif
	float sundot = clamp(dot(rd,light1),0.0,1.0);
	vec3 col;
    float t = raycast( ro, rd, tmin, tmax );
    if( t>tmax)
    {
        // sky		
        col = vec3(0.3,0.5,0.85) - rd.y*rd.y*0.5;
        col = mix( col, 0.85*vec3(0.7,0.75,0.85), pow( 1.0-max(rd.y,0.0), 4.0 ) );
        // sun
		col += 0.25*vec3(1.0,0.7,0.4)*pow( sundot,5.0 );
		col += 0.25*vec3(1.0,0.8,0.6)*pow( sundot,64.0 );
		col += 0.2*vec3(1.0,0.8,0.6)*pow( sundot,512.0 );
        // clouds
		vec2 sc = ro.xz + rd.xz*(iScale*1000.0-ro.y)/rd.y;
		col = mix( col, vec3(1.0,0.95,1.0), 0.5*smoothstep(0.5,0.8,fbm(0.0005*sc/iScale)) );
        // horizon
        col = mix( col, 0.68*vec3(0.4,0.65,1.0), pow( 1.0-max(rd.y,0.0), 16.0 ) );
        t = tmax*.1;
	}
	else
	{
        // mountains		
		vec3 pos = ro + t*rd;
        vec3 nor = calcNormal( pos, t );
        //nor = normalize( nor + 0.5*( vec3(-1.0,0.0,-1.0) + vec3(2.0,1.0,2.0)*texture(iChannel1,0.01*pos.xz).xyz) );
        vec3 ref = reflect( rd, nor );
        float fre = clamp( 1.0+dot(rd,nor), 0.0, 1.0 );
        vec3 hal = normalize(light1-rd);
        
        // rock
		float r = texture( iChannel0, (7.0/iScale)*pos.xz/256.0 ).x;
        col = (r*0.25+0.75)*0.9*mix( vec3(0.08,0.05,0.03), vec3(0.10,0.09,0.08), 
                                     texture(iChannel0,0.00007*vec2(pos.x,pos.y*48.0)/iScale).x );
		col = mix( col, 0.20*vec3(0.45,.30,0.15)*(0.50+0.50*r),smoothstep(0.70,0.9,nor.y) );
        
        
        col = mix( col, 0.15*vec3(0.30,.30,0.10)*(0.25+0.75*r),smoothstep(0.95,1.0,nor.y) );
		col *= 0.1+1.8*sqrt(fbm(pos.xz*0.04)*fbm(pos.xz*0.005));

		// snow
		float h = smoothstep(55.0,80.0,pos.y/iScale + 25.0*fbm(0.01*pos.xz/iScale) );
        float e = smoothstep(1.0-0.5*h,1.0-0.1*h,nor.y);
        float o = 0.3 + 0.7*smoothstep(0.0,0.1,nor.x+h*h);
        float s = h*e*o;
        col = mix( col, 0.29*vec3(0.62,0.65,0.7), smoothstep( 0.1, 0.9, s ) );
		
         // lighting		
        float amb = clamp(0.5+0.5*nor.y,0.0,1.0);
		float dif = clamp( dot( light1, nor ), 0.0, 1.0 );
		float bac = clamp( 0.2 + 0.8*dot( normalize( vec3(-light1.x, 0.0, light1.z ) ), nor ), 0.0, 1.0 );
		float sh = 1.0; if( dif>=0.0001 ) sh = softShadow(pos+light1*iScale*0.05,light1,t);
		
		vec3 lin  = vec3(0.0);
		lin += dif*vec3(8.00,5.00,3.00)*1.3*vec3( sh, sh*sh*0.5+0.5*sh, sh*sh*0.8+0.2*sh );
		lin += amb*vec3(0.40,0.60,1.00)*1.2;
        lin += bac*vec3(0.40,0.50,0.60);
		col *= lin;
        
        col += (0.7+0.3*s)*(0.04+0.96*pow(clamp(1.0+dot(hal,rd),0.0,1.0),5.0))*
               vec3(7.0,5.0,3.0)*dif*sh*
               pow( clamp(dot(nor,hal), 0.0, 1.0),16.0);
        
        col += s*0.65*pow(fre,4.0)*vec3(0.3,0.5,0.6)*smoothstep(0.0,0.6,ref.y);
        
		// fog
        float fo = 1.0-exp(-pow(0.001*t/iScale,1.5) );
        vec3 fco = 0.65*vec3(0.4,0.65,1.0);
        col = mix( col, fco, fo );

	}
    // sun scatter
    col += 0.3*vec3(1.0,0.7,0.3)*pow( sundot, 8.0 );

    // gamma
	col = sqrt(col);
    
	return vec4(col,t);
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
    
    vec4 res=render(cameraPosition,rd);
    if(res.w < dist ){ 
      diffuse=res.rgb;
    }

    out_FragColor.rgb = diffuse;
    out_FragColor.a = 1.0;
  }
  `;

  const _DS=`#version 300 es
  #include <common>
  in vec2 vUv;
  out vec4 out_FragColor;

  uniform sampler2D iChannel0;
  uniform float iScale;
  uniform vec3 iPos;
  uniform vec2 iRes;

    // value noise, and its analytical derivatives
    vec3 noised( in vec2 x )
    {
        vec2 f = fract(x);
        vec2 u = f*f*(3.0-2.0*f);
        vec2 du = 6.0*f*(1.0-f);

        ivec2 p = ivec2(floor(x));
        float a = texelFetch( iChannel0, (p+ivec2(0,0))&255, 0 ).x;
        float b = texelFetch( iChannel0, (p+ivec2(1,0))&255, 0 ).x;
        float c = texelFetch( iChannel0, (p+ivec2(0,1))&255, 0 ).x;
        float d = texelFetch( iChannel0, (p+ivec2(1,1))&255, 0 ).x;

        return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
                    du*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
    }

    const mat2 m2 = mat2(0.8,-0.6,0.6,0.8);

    float terrainM( in vec2 x )
    {
        vec2  p = x*0.003/iScale;
        float a = 0.0;
        float b = 1.0;
        vec2  d = vec2(0.0);
        for( int i=0; i<9; i++ )
        {
            vec3 n = noised(p);
            d += n.yz;
            a += b*n.x/(1.0+dot(d,d));
            b *= 0.5;
            p = m2*p*2.0;
        }
        
        return iScale*120.0*a;
    }

  void main() {
    out_FragColor = vec4(vec3(-1),1);
    ivec2 k=ivec2(vUv*iRes);
    if(k.x == 0 && k.y==0){
        float dist=iPos.y-terrainM(iPos.xz);
        out_FragColor = vec4(vec3(dist),1);
    }
  }
  `;

  return {
    DS: _DS,
    VS: _VS,
    PS: _PS,
  };
})();
  