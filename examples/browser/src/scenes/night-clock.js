import * as T from 'three';
import {mulberry32} from '../rng.js';
export const META={duration:10,aspect:[16,9]};

export function buildScene({renderer,camera,width,height}){
  const rng=mulberry32(715);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  const alley=new T.Scene(), room=new T.Scene();
  alley.background=new T.Color(0x102337);
  alley.fog=new T.FogExp2(0x162a3d,.062);
  room.background=new T.Color(0x15100e);
  room.fog=new T.FogExp2(0x24160f,.024);
  const mapCanvas=document.createElement('canvas');
  mapCanvas.width=mapCanvas.height=256;
  const paint=mapCanvas.getContext('2d');
  const pattern=paint.createImageData(256,256);
  for(let i=0;i<65536;i++){
    const v=115+55*rng()+18*Math.sin(i%256*.061+Math.floor(i/256)*.019);
    pattern.data.set([v,v,v,255],4*i);
  }
  paint.putImageData(pattern,0,0);
  const grain=new T.CanvasTexture(mapCanvas);
  grain.wrapS=grain.wrapT=T.RepeatWrapping;
  const material=(color,roughness,metalness=0)=>new T.MeshStandardMaterial({
    color,roughness,metalness,map:grain,bumpMap:grain,bumpScale:.021
  });
  const wet=[0x4d6270,0x3d515a,0x566b72,0x384e61].map(c=>material(c,.24,.22));
  const wall=material(0x566073,.93), wood=material(0x543020,.75), brass=material(0xbd8953,.29,.62);
  const iron=material(0x4d2920,.52,.28);
  const glow=new T.MeshBasicMaterial({color:0xffbd66});
  const ink=new T.MeshBasicMaterial({color:0xeec892});
  function object(s,g,m,x,y,z){
    const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;s.add(o);return o;
  }
  const box=(s,m,x,y,z,w,h,d)=>object(s,new T.BoxGeometry(w,h,d),m,x,y,z);
  function light(s,color,power,x,y,z){
    const l=new T.PointLight(color,power,18,2);l.position.set(x,y,z);s.add(l);return l;
  }
  alley.add(new T.HemisphereLight(0x89bfff,0x253647,.9));
  const moon=new T.DirectionalLight(0x8fbcff,2);
  moon.position.set(-4,8,-5);alley.add(moon);
  for(let j=0;j<24;j++){
    for(let i=-3;i<=3;i++){
      const stone=box(alley,wet[(i+j+12)%4],i*.67+(j%2)*.19,-.075,-j*.63+5,.64,.13,.60);
      stone.rotation.y=(rng()-.5)*.07;
    }
    if(j%4===0){
      for(const side of [-1,1]){
        box(alley,wall,side*2.8,1.75,4-j*.63,.8,3.5,2.65);
        box(alley,wood,side*2.46,3.47,4-j*.63,.7,.22,2.66);
      }
    }
  }
  box(alley,wall,0,1.9,-8,6,3.8,.5);
  box(alley,glow,0,1.34,-7.69,1.24,2.68,.08);
  for(const x of [-.69,.69])box(alley,wood,x,1.45,-7.63,.15,2.9,.2);
  box(alley,wood,0,2.87,-7.63,1.6,.18,.25);
  box(alley,wood,.39,1.3,-7.54,.49,2.57,.12);
  for(const y of [.62,1.22,1.92])box(alley,wood,.39,y,-7.46,.49,.065,.05);
  light(alley,0xff9545,95,0,2.05,-7.26);
  light(alley,0xffab68,38,-1.8,2.55,-3.2);
  box(alley,glow,-2.27,2.58,-3.3,.18,.34,.24);
  const traveler=new T.Group();
  alley.add(traveler);
  const coat=material(0x263441,.92);
  object(traveler,new T.CylinderGeometry(.18,.35,.92,12),coat,0,.88,0);
  object(traveler,new T.SphereGeometry(.16,16,12),coat,0,1.51,0);
  object(traveler,new T.ConeGeometry(.42,.19,24),coat,0,1.67,0);
  const boots=[-.12,.12].map(x=>box(traveler,coat,x,.22,0,.13,.43,.18));
  const rain=new Float32Array(390*6), rainSeeds=Array.from({length:390},()=>[rng(),rng(),rng()]);
  const rainGeo=new T.BufferGeometry(), rainPos=new T.BufferAttribute(rain,3);
  rainGeo.setAttribute('position',rainPos);
  const drizzle=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xb4d4ee,transparent:true,opacity:.32,depthWrite:false}));
  drizzle.frustumCulled=false;alley.add(drizzle);

  room.add(new T.HemisphereLight(0x6e89a3,0x271719,.73));
  box(room,wall,0,3,-3,10,6,.3);
  box(room,wood,0,-.16,0,10,.3,9);
  for(let i=-4;i<=4;i++)box(room,iron,i,.01,0,.022,.012,8);
  box(room,wood,0,.98,0,3.7,.21,1.65);
  for(const x of [-1.52,1.52])for(const z of [-.59,.59])box(room,wood,x,.49,z,.19,.98,.18);
  box(room,wood,-1.15,2.26,-.45,1.25,.13,.62);
  for(const x of [-1.69,-.65])box(room,wood,x,1.68,-.45,.12,1.22,.12);
  const potShape=[new T.Vector2(.18,0),new T.Vector2(.37,.11),new T.Vector2(.52,.38),
    new T.Vector2(.48,.61),new T.Vector2(.32,.78),new T.Vector2(.31,.85)];
  object(room,new T.LatheGeometry(potShape,48),brass,-1.15,2.33,-.45);
  const spout=object(room,new T.CylinderGeometry(.065,.11,.54,18),brass,-.57,2.43,-.25);
  spout.rotation.z=Math.PI/2;
  const cupShape=[new T.Vector2(.26,0),new T.Vector2(.41,0),new T.Vector2(.48,.22),
    new T.Vector2(.48,.64),new T.Vector2(.44,.64),new T.Vector2(.43,.17),new T.Vector2(.25,.09)];
  object(room,new T.LatheGeometry(cupShape,48),iron,-.32,1.09,-.25);
  const water=object(room,new T.CircleGeometry(.43,48),new T.MeshStandardMaterial({
    color:0x496d7d,roughness:.12,metalness:.34,side:T.DoubleSide
  }),-.32,1.42,-.25);
  water.rotation.x=-Math.PI/2;
  const rule=box(room,wood,.15,1.97,-.28,.18,1.42,.09);
  for(let i=0;i<9;i++)box(room,ink,.16,1.39+i*.14,-.225,i%2?.053:.091,.013,.012);
  const floatRod=box(room,brass,-.19,1.83,-.25,.027,.74,.026);
  const pointer=box(room,brass,-.026,2.1,-.211,.335,.025,.033);
  const drop=object(room,new T.SphereGeometry(.042,20,16),new T.MeshPhysicalMaterial({
    color:0xb9e8ff,metalness:.24,roughness:.12,clearcoat:1
  }),-.32,2.38,-.25);
  drop.scale.y=1.36;
  const ringMat=new T.MeshBasicMaterial({color:0xf2d9a3,transparent:true,depthWrite:false,side:T.DoubleSide});
  const ring=object(room,new T.RingGeometry(.92,1,48),ringMat,-.32,1.43,-.25);
  ring.rotation.x=-Math.PI/2;ring.castShadow=false;
  box(room,brass,1.32,1.14,.27,.42,.1,.42);
  const flame=object(room,new T.SphereGeometry(.09,16,12),glow,1.32,1.39,.27);
  flame.scale.set(.7,2.1,.72);flame.castShadow=false;
  const candle=light(room,0xff9f47,44,1.27,1.77,.5);
  const spot=new T.SpotLight(0xffd095,148,14,.7,.6,1.7);
  spot.position.set(-2.6,4.2,2.1);spot.target.position.set(-.4,1.6,0);
  spot.castShadow=true;spot.shadow.mapSize.set(1024,1024);spot.shadow.normalBias=.025;
  room.add(spot,spot.target);
  const rim=new T.DirectionalLight(0x719ed5,.82);rim.position.set(-3,3,-1);room.add(rim);

  const overlay=document.createElement('canvas');overlay.width=width;overlay.height=height;
  overlay.style.cssText='position:absolute;inset:0;pointer-events:none';document.body.append(overlay);
  const ctx=overlay.getContext('2d');
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mixScene=new T.Scene(), mixCamera=new T.OrthographicCamera(-1,1,1,-1,0,2);
  mixCamera.position.z=1;
  const targets=[0,1].map(()=>new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType}));
  const mixMaterial=new T.ShaderMaterial({
    uniforms:{a:{value:targets[0].texture},b:{value:targets[1].texture},blend:{value:0}},
    vertexShader:'varying vec2 p; void main(){p=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 p; uniform sampler2D a; uniform sampler2D b; uniform float blend;
    void main(){gl_FragColor=mix(texture2D(a,p),texture2D(b,p),blend);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`
  });
  mixScene.add(new T.Mesh(new T.PlaneGeometry(2,2),mixMaterial));
  function street(t){
    camera.position.set(1.15-.19*t,2.15,4.7-1.23*t);
    camera.lookAt(.04,1.5,-7.6);
    traveler.position.set(-.31,0,-1.8-t*.72);
    boots.forEach((b,i)=>{b.position.z=.12*Math.sin(t*9+i*Math.PI);b.rotation.x=.25*Math.sin(t*9+i*Math.PI);});
    rainSeeds.forEach(([a,b,c],i)=>{
      const y=5*((b-t*.81)%1+1)%5,x=(a-.5)*6,z=6-c*15;
      rainPos.setXYZ(i*2,x,y,z);rainPos.setXYZ(i*2+1,x+.10,y-.34,z-.04);
    });
    rainPos.needsUpdate=true;
  }
  function interior(t,close){
    if(close){camera.position.set(1.62-(t-6.3)*.1,3.22,2.55-(t-6.3)*.08);camera.lookAt(-.24,1.84,-.27);}
    else{camera.position.set(3.15-(t-3)*.29,2.76,4.55-(t-3)*.29);camera.lookAt(-.35,1.78,-.17);}
    const phase=((t*.96)%1+1)%1;
    water.position.y=1.38+.12*clamp((t-4)/6);
    floatRod.position.y=water.position.y+.38;
    pointer.position.y=water.position.y+.67;
    drop.visible=phase<.7;
    drop.position.y=2.38-(2.38-water.position.y)*(phase/.7)**2;
    const wave=clamp((phase-.7)/.3);
    ring.visible=phase>=.7;
    ring.position.y=water.position.y+.008;
    ring.scale.setScalar(.036+.37*wave);
    ringMat.opacity=.68*(1-wave);
    candle.intensity=43+4*Math.sin(t*13)+3*Math.sin(t*21);
    flame.scale.y=2.1+.17*Math.sin(t*19);
  }
  return {renderAt(t){
    const close=t>=6.35;
    if(t>=2.95&&t<3.65){
      renderer.setRenderTarget(targets[0]);street(t);renderer.render(alley,camera);
      renderer.setRenderTarget(targets[1]);interior(t,false);renderer.render(room,camera);
      renderer.setRenderTarget(null);
      const p=clamp((t-2.95)/.7);mixMaterial.uniforms.blend.value=p*p*(3-2*p);
      renderer.render(mixScene,mixCamera);
    }else if(t<2.95){street(t);renderer.render(alley,camera);}
    else{interior(t,close);renderer.render(room,camera);}
    ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(width/1280,height/720);
    const fade=ctx.createLinearGradient(0,0,0,720);
    fade.addColorStop(0,'#080c13c8');fade.addColorStop(.29,'#080c1300');
    fade.addColorStop(.73,'#080c1300');fade.addColorStop(1,'#080c13ee');
    ctx.fillStyle=fade;ctx.fillRect(0,0,1280,720);
    ctx.fillStyle='#d9b77f';ctx.font='600 21px Microsoft YaHei';
    ctx.fillText('夜里的时间     /     器具原理示意',60,57);
    ctx.fillStyle='#fff0d4';ctx.font='bold 39px Microsoft YaHei';
    ctx.fillText(t<3.4?'看不见星星，怎么知道过了多久？':close?'水位升一格，时间就有了刻度。':'走进屋里，答案在一滴水里。',60,660);
    ctx.restore();
  }};
}
