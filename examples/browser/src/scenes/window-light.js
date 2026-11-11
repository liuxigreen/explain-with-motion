import * as T from 'three';
import {mulberry32} from '../rng.js';
export const META={duration:14,aspect:[16,9]};
export function buildScene({scene,camera,renderer,width,height}){
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  scene.background=new T.Color(0x0b141e);
  scene.fog=new T.FogExp2(0x131d28,.037);
  const rng=mulberry32(22);
  const tex=document.createElement('canvas');tex.width=512;tex.height=512;
  const tx=tex.getContext('2d');const pixels=tx.createImageData(512,512);
  for(let i=0;i<512*512;i++){
    const x=i%512,y=Math.floor(i/512);
    const g=106+36*rng()+14*Math.sin(x*.057+y*.037)+9*Math.sin(y*.18);
    pixels.data.set([g,g*.93,g*.82,255],i*4);
  }
  tx.putImageData(pixels,0,0);
  const texture=new T.CanvasTexture(tex);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(5,5);
  texture.colorSpace=T.SRGBColorSpace;
  const stone=new T.MeshStandardMaterial({color:0x67666b,map:texture,bumpMap:texture,bumpScale:.047,roughness:.96});
  const wood=new T.MeshStandardMaterial({color:0x34231b,map:texture,roughness:.78});
  const brass=new T.MeshStandardMaterial({color:0xad7040,metalness:.55,roughness:.32});
  function mesh(geo,mat,x,y,z){
    const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
  }
  function box(w,h,d,m,x,y,z){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z);}
  box(20,.3,20,stone,0,-.15,0);
  box(17,8,.4,stone,0,4,-4.4);
  box(.4,8,12,stone,-7,4,0);
  for(let i=0;i<13;i++)box(.025,.018,15,wood,i-6,.005,0);
  const gate=[];
  function slat(w,h,x,y){gate.push(box(w,h,.19,wood,x,y,-.65));}
  slat(3,.17,0,3.52);slat(3,.17,0,1.22);
  slat(.17,2.3,-1.42,2.37);slat(.17,2.3,1.42,2.37);
  slat(.13,2.3,-.46,2.37);slat(.13,2.3,.46,2.37);
  slat(3,.12,0,2.36);
  for(const x of [-1.42,1.42])box(.17,1.24,.24,wood,x,.62,-.65);
  const stand=[box(.9,.15,.74,brass,0,1.2,4.2),box(.07,1.2,.07,brass,0,.6,4.2)];
  const bulb=mesh(new T.SphereGeometry(.14,24,16),new T.MeshBasicMaterial({color:0xffcc74}),0,1.53,4.2);
  bulb.castShadow=false;
  const lamp=new T.SpotLight(0xffbd70,0,22,.57,.65,1.35);
  lamp.position.set(0,1.53,4.05);lamp.target.position.set(0,2.9,-4.1);
  lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);
  lamp.shadow.bias=-.0005;lamp.shadow.normalBias=.025;
  scene.add(lamp,lamp.target);
  scene.add(new T.HemisphereLight(0x80acd7,0x594134,.75));
  const rim=new T.DirectionalLight(0x90c0f5,1.3);rim.position.set(-6,5,3);scene.add(rim);
  const count=220, particles=new Float32Array(count*3), seeds=[];
  for(let i=0;i<count;i++)seeds.push([rng(),rng(),rng()]);
  const dustGeo=new T.BufferGeometry();
  const attr=new T.BufferAttribute(particles,3);dustGeo.setAttribute('position',attr);
  const dustMat=new T.PointsMaterial({color:0xffca88,size:.027,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const dust=new T.Points(dustGeo,dustMat);dust.frustumCulled=false;scene.add(dust);
  const overlay=document.createElement('canvas');overlay.width=width;overlay.height=height;
  overlay.style.cssText='position:absolute;inset:0;pointer-events:none';document.body.append(overlay);
  const ctx=overlay.getContext('2d');
  const clamp=x=>Math.min(1,Math.max(0,x));
  const lines=[
    ['墙上这扇窗，是真的吗？','暗室里，只有一盏灯。'],
    ['窗格挡住了一部分光','光穿过空隙，木条的影子落到墙上。'],
    ['灯移近，影子为什么变大？','光线从灯向外散开，窗格的影子被放大。'],
  ];
  return {renderAt(t){
    const shot=t<4?0:t<8.5?1:2;
    const move=clamp((t-9)/2.4);
    const z=4.05-2.05*move;
    lamp.position.z=z;bulb.position.z=z+.15;
    stand.forEach(part=>{part.position.z=z+.15;});
    lamp.intensity=220*clamp((t-.5)/1.35);
    dustMat.opacity=.46*clamp((t-1)/1.5);
    for(let i=0;i<count;i++){
      const [a,b,c]=seeds[i], k=(a+t*.014)%1;
      attr.setXYZ(i,(b-.5)*(1.9+k*2.2)+.11*Math.sin(t*.9+i),1.35+k*1.35+(c-.5)*1.3,z-k*(z+4.2));
    }
    attr.needsUpdate=true;
    if(shot===0){camera.position.set(5.5-t*.24,3.2,8.6-t*.27);camera.lookAt(0,2,-2.5);}
    if(shot===1){camera.position.set(6.8-(t-4)*.32,3.9,3.3);camera.lookAt(0,2.35,-1.6);}
    if(shot===2){camera.position.set(1.1-(t-8.5)*.16,3.4,7.8);camera.lookAt(0,2.6,-4);}
    renderer.render(scene,camera);
    ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(width/1280,height/720);
    const shade=ctx.createLinearGradient(0,0,0,720);
    shade.addColorStop(0,'#080e16de');shade.addColorStop(.28,'#080e1600');shade.addColorStop(.73,'#080e1600');shade.addColorStop(1,'#080e16ee');
    ctx.fillStyle=shade;ctx.fillRect(0,0,1280,720);
    ctx.fillStyle='#e9b975';ctx.font='600 19px Microsoft YaHei';ctx.fillText('暗室笔记    /    0'+(shot+1),64,59);
    ctx.fillStyle='#fff0d2';ctx.font='bold 47px Microsoft YaHei';ctx.fillText(lines[shot][0],62,123);
    ctx.font='600 29px Microsoft YaHei';ctx.fillText(lines[shot][1],64,660);
    ctx.restore();
  }};
}
