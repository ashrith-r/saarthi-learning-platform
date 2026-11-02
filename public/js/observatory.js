import { routePose, blendPose, validPose } from './planet-state.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const scene = document.getElementById('observatory-scene');
scene.dataset.instance = String(Date.now());
const planet = document.getElementById('planet-view');
const sky = document.getElementById('starfield');
const skyContext = sky?.getContext('2d');
let route = location.pathname + location.search;
let target = routePose(route);
let previous = target;
try {
  const stored = JSON.parse(sessionStorage.getItem('saarthi:planet-camera') || 'null');
  if (stored?.path !== route && validPose(stored?.pose)) previous = stored.pose;
} catch { /* Navigation still works when storage is unavailable. */ }
let pose = previous, width = innerWidth, height = innerHeight, animation = 0;
let start = performance.now(), last = start, stars = [];
const pointer = { x: innerWidth * .6, y: innerHeight * .3 };

function shaderRenderer(canvas) {
  if (!canvas) return null;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer:true, powerPreference: 'low-power' });
  if (!gl) return null;
  const vertexSource = 'attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}';
  const fragmentSource = `
    precision highp float;
    uniform vec2 size;
    uniform vec4 camera;
    uniform vec2 pointer;
    float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
    float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float n=0.0,a=0.5;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.05+vec3(4.1,2.3,7.7);a*=0.5;}return n;}
    mat3 turn(float y,float x){float a=cos(y),b=sin(y),c=cos(x),d=sin(x);return mat3(a,0.0,-b,b*d,c,a*d,b*c,-d,a*c);}
    void main(){
      vec2 p=(gl_FragCoord.xy/size*2.0-1.0)/camera.z;
      float r=length(p),radius=0.77;
      vec3 light=normalize(vec3(-0.85+pointer.x*.08,1.0,camera.w));
      if(r>radius){
        float glow=exp(-(r-radius)*36.0)*0.36;
        float lit=clamp(dot(normalize(vec3(p,0.15)),light)*.8+.28,0.0,1.0);
        float alpha=glow*lit;
        gl_FragColor=vec4(vec3(.19,.43,.78)*lit*alpha,alpha);return;
      }
      vec3 normal=vec3(p/radius,sqrt(max(0.0,1.0-r*r/(radius*radius))));
      vec3 surface=turn(camera.x,camera.y)*normal;
      float terrain=fbm(surface*6.5);
      float detail=fbm(surface*47.0);
      float ridge=pow(1.0-abs(noise(surface*18.0)-.5)*2.0,5.0);
      vec3 ocean=vec3(.045,.11,.16),land=vec3(.24,.32,.36),rock=vec3(.46,.44,.39);
      vec3 color=mix(ocean,land,smoothstep(.43,.57,terrain));
      color=mix(color,rock,smoothstep(.58,.76,terrain));
      color*=.67+detail*.55+ridge*.16;
      float cloud=smoothstep(.57,.74,fbm(surface*11.0+vec3(.7,2.1,1.3)));
      color=mix(color,vec3(.64,.72,.76),cloud*.55);
      float day=max(dot(normal,light),0.0);
      float rim=pow(1.0-normal.z,3.5);
      vec3 shade=color*(.04+day*1.5)+vec3(.14,.38,.7)*rim*max(dot(normal,light)+.2,0.0)*.85;
      float night=1.0-smoothstep(-.12,.14,dot(normal,light));
      float fire=pow(noise(surface*145.0),22.0)*smoothstep(.5,.57,terrain)*night;
      shade+=vec3(1.0,.32,.055)*fire*.6;
      gl_FragColor=vec4(shade,1.0);
    }`;
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  }
  const vertex = compile(gl.VERTEX_SHADER, vertexSource), fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const dimensions = gl.getUniformLocation(program, 'size'), camera = gl.getUniformLocation(program, 'camera'), mouse = gl.getUniformLocation(program, 'pointer');
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); scene?.classList.add('planet-fallback'); });
  return state => {
    const bounds = canvas.getBoundingClientRect(), scale = Math.min(devicePixelRatio || 1, 1.5);
    const side = Math.min(512, Math.round(bounds.width * scale));
    if (!side) return;
    if (canvas.width !== side || canvas.height !== side) { canvas.width = side; canvas.height = side; gl.viewport(0, 0, side, side); }
    gl.uniform2f(dimensions, side, side); gl.uniform4f(camera, state.yaw, state.tilt, state.zoom, state.phase);
    gl.uniform2f(mouse, (pointer.x / width - .5) * 2, pointer.y / height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
}
const renderPlanet = shaderRenderer(planet);
if (!renderPlanet) scene?.classList.add('planet-fallback');


function reducedMotion(){try{return reduced.matches||localStorage.getItem('saarthi:reduce-motion')==='true';}catch{return reduced.matches;}}
function resize(){
 width=innerWidth;height=innerHeight;const scale=Math.min(devicePixelRatio||1,1.5);
 if(sky){sky.width=width*scale;sky.height=height*scale;skyContext.setTransform(scale,0,0,scale,0,0);}
 let seed=9173;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 stars=Array.from({length:Math.min(230,Math.round(width*height/4300))},()=>({x:random()*width,y:random()*height,r:.35+random()*1.15,phase:random()*6.28}));
 draw(performance.now());
}
function persist(){try{sessionStorage.setItem('saarthi:planet-camera',JSON.stringify({path:route,pose}));}catch{}}
function draw(now){
 pose=reducedMotion()?target:blendPose(previous,target,(now-start)/1200);
 renderPlanet?.(pose);
 scene.dataset.motion=reducedMotion()?'reduced':'full';
 if(skyContext){skyContext.clearRect(0,0,width,height);for(const star of stars){
 const alpha=reducedMotion()?.55:.48+.13*Math.sin(now/6000+star.phase);
 skyContext.fillStyle='rgba(203,224,255,'+alpha+')';skyContext.beginPath();skyContext.arc(star.x,star.y,star.r,0,Math.PI*2);skyContext.fill();
 if(star.r>1.35){skyContext.strokeStyle='rgba(172,205,255,.2)';skyContext.lineWidth=.5;skyContext.beginPath();skyContext.moveTo(star.x-3,star.y);skyContext.lineTo(star.x+3,star.y);skyContext.moveTo(star.x,star.y-3);skyContext.lineTo(star.x,star.y+3);skyContext.stroke();}
 }}last=now;
}
function quiet(){return /^\/(learn|practice\/run)\//.test(location.pathname);}
function loop(now){if(now-last>=(innerWidth<768?80:50))draw(now);animation=requestAnimationFrame(loop);}
function resume(){cancelAnimationFrame(animation);if(document.hidden)return;draw(performance.now());for(const button of document.querySelectorAll('[data-motion-toggle]')){button.disabled=reduced.matches;button.setAttribute('aria-pressed',String(reducedMotion()));button.textContent=reduced.matches?'System reduced motion':reducedMotion()?'Enable scene motion':'Reduce scene motion';}if(!reducedMotion()&&!quiet())animation=requestAnimationFrame(loop);}
function update(){persist();previous=pose;route=location.pathname+location.search;target=routePose(route);start=performance.now();resume();}
addEventListener('resize',resize,{passive:true});addEventListener('pagehide',persist);addEventListener('pageswap',persist);
addEventListener('pageshow',resume);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
document.addEventListener('workspace:navigated',update);
document.addEventListener('click',event=>{const button=event.target.closest('[data-motion-toggle]');if(!button)return;const value=!reducedMotion();try{localStorage.setItem('saarthi:reduce-motion',String(value));}catch{}resume();});
resize();resume();
