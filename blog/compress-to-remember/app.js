'use strict';
const $=(q,el=document)=>el.querySelector(q);
const $$=(q,el=document)=>Array.from(el.querySelectorAll(q));
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>'<img src="assets/icons/'+name+'.svg" alt="">';
const familyName=k=>k==='cf'?'Causal Forcing':'Causal-rCM';
const timestamp=t=>String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const players=new Set(),stories=[];
let DATA,mainPlayer,teaserPlayer;
function stopOthers(current){for(const p of players)if(p!==current)p.pause();}
class ComparisonPlayer {
  constructor(host,example,full=false) {
    this.host=host;this.example=example;this.intent=false;this.dead=false;this.raf=0;this.ticket=0;this.buffering=false;
    const keys=full&&example.methods.full?['full','relax','pacc']:['relax','pacc'];
    const names={full:'Full AR',relax:'Relax Forcing',pacc:'PACC / Ours'};
    host.classList.add('player');host.dataset.columns=keys.length;
    host.innerHTML='<div class="player-videos '+(keys.length===3?'three':'')+'">'+keys.map(key=>{
      const m=example.methods[key];
      return '<div class="video-cell"><video crossorigin="anonymous" muted playsinline preload="metadata" poster="'+m.poster+'" src="'+m.url+'" aria-label="'+escapeHTML(names[key]+': '+example.title)+'"></video><span class="video-label '+(key==='pacc'?'ours':'')+'">'+names[key]+'</span></div>';
    }).join('')+'</div>'+
    '<div class="player-controls"><button class="icon-button play-toggle" aria-label="Play comparison" title="Play comparison">'+icon('play')+'</button>'+
    '<button class="icon-button frame-back" aria-label="Previous frame" title="Previous frame">'+icon('step-back')+'</button>'+
    '<button class="icon-button frame-forward" aria-label="Next frame" title="Next frame">'+icon('step-forward')+'</button>'+
    '<span class="time-display"><b>00:00</b> / '+timestamp(example.duration)+'</span>'+
    '<input class="seek" type="range" min="0" max="'+(example.duration-1/16)+'" step="0.0625" value="0" aria-label="Comparison time">'+
    '<select class="speed" aria-label="Playback speed"><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="2">2x</option></select>'+
    '<button class="icon-button restart" aria-label="Restart comparison" title="Restart comparison">'+icon('rotate-ccw')+'</button>'+
    '<button class="icon-button fullscreen" aria-label="Fullscreen comparison" title="Fullscreen comparison">'+icon('maximize')+'</button></div>'+
    '<div class="prompt-stages">'+example.labels.map((label,i)=>'<button class="prompt-stage" data-phase="'+i+'" aria-pressed="'+(i===0)+'" title="'+escapeHTML(example.prompts[i])+'">'+escapeHTML(label)+'<small>'+timestamp(DATA.phaseStarts[i])+' - '+timestamp(DATA.phaseStarts[i+1]||example.duration)+'</small></button>').join('')+'</div>'+
    '<div class="caption-line"><span class="caption-number">PROMPT 01</span><p class="caption-text"></p></div>'+
    '<p class="player-status" role="status"></p>';
    this.videos=$$('video',host);this.master=this.videos.at(-1);this.range=$('.seek',host);this.button=$('.play-toggle',host);this.status=$('.player-status',host);
    this.videos.forEach(v=>{
      v.muted=true;v.defaultMuted=true;
      v.addEventListener('error',()=>{if(this.dead)return;this.pause();this.status.textContent='Video unavailable. Please reload the page.';});
      v.addEventListener('waiting',()=>this.waitTogether());
      v.addEventListener('canplay',()=>this.resumeBuffered());
      v.addEventListener('seeked',()=>this.resumeBuffered());
    });
    this.button.addEventListener('click',()=>this.intent?this.pause():this.play());
    this.range.addEventListener('input',()=>this.seek(Number(this.range.value)));
    $('.restart',host).addEventListener('click',()=>this.seek(0));
    $('.frame-back',host).addEventListener('click',()=>{this.pause();this.seek(this.master.currentTime-1/16);});
    $('.frame-forward',host).addEventListener('click',()=>{this.pause();this.seek(this.master.currentTime+1/16);});
    $('.speed',host).addEventListener('change',e=>this.videos.forEach(v=>v.playbackRate=Number(e.target.value)));
    $$('.prompt-stage',host).forEach(b=>b.addEventListener('click',()=>this.seek(DATA.phaseStarts[Number(b.dataset.phase)])));
    $('.fullscreen',host).addEventListener('click',async()=>{
      try {if(document.fullscreenElement)await document.exitFullscreen();else if(host.requestFullscreen)await host.requestFullscreen();else this.status.textContent='Fullscreen is not available in this browser.';}
      catch(_){this.status.textContent='Fullscreen is not available in this browser.';}
    });
    this.master.addEventListener('timeupdate',()=>this.renderTime());
    this.master.addEventListener('ended',()=>{if(this.intent){this.seek(0);this.play();}});
    this.renderTime(0);players.add(this);
  }
  async play() {
    if(this.dead)return;
    stories.forEach(s=>s.pause(false));stopOthers(this);this.intent=true;this.buffering=false;
    const ticket=++this.ticket;
    this.button.innerHTML=icon('pause');this.button.setAttribute('aria-label','Pause comparison');this.button.title='Pause comparison';
    if(this.master.ended)this.seek(0);
    const time=this.master.currentTime;
    this.videos.forEach(v=>{if(v.readyState&&Math.abs(v.currentTime-time)>.08)v.currentTime=time;});
    this.status.textContent='Loading video...';
    try {
      await Promise.all(this.videos.map(v=>v.play()));
      if(this.dead||ticket!==this.ticket){if(!this.intent)this.videos.forEach(v=>v.pause());return;}
      this.status.textContent='';cancelAnimationFrame(this.raf);this.tick();
    } catch(error) {
      if(this.dead||ticket!==this.ticket)return;
      if(this.buffering&&this.intent){this.resumeBuffered();return;}
      this.pause();this.status.textContent='Playback did not start. Please try again.';
    }
  }
  pause() {
    this.intent=false;this.buffering=false;++this.ticket;
    cancelAnimationFrame(this.raf);this.videos.forEach(v=>v.pause());
    this.button.innerHTML=icon('play');this.button.setAttribute('aria-label','Play comparison');this.button.title='Play comparison';
  }
  waitTogether() {
    if(this.dead||!this.intent||this.videos.every(v=>v.readyState>=3))return;
    this.buffering=true;this.videos.forEach(v=>v.pause());this.status.textContent='Buffering comparison...';
  }
  resumeBuffered() {
    if(this.buffering&&this.intent&&!this.dead&&this.videos.every(v=>v.readyState>=3&&!v.seeking)) {
      this.buffering=false;this.play();
    }
  }
  seek(time) {
    const target=Math.max(0,Math.min(this.example.duration-1/16,time));
    for(const video of this.videos) {
      if(video.readyState>=1)video.currentTime=target;
      else video.addEventListener('loadedmetadata',()=>{if(!this.dead)video.currentTime=target;},{once:true});
    }
    this.renderTime(target);
  }
  tick() {
    if(this.dead||!this.intent)return;
    if(!this.buffering&&!this.master.seeking) {
      const time=this.master.currentTime;
      for(const video of this.videos)if(video!==this.master&&video.readyState>=2&&!video.seeking&&Math.abs(video.currentTime-time)>.09)video.currentTime=time;
      this.renderTime(time);
    }
    this.raf=requestAnimationFrame(()=>this.tick());
  }
  renderTime(time=this.master.currentTime) {
    if(this.dead)return;
    $('.time-display b',this.host).textContent=timestamp(time);
    this.range.value=String(time);this.range.setAttribute('aria-valuetext',timestamp(time)+' of '+timestamp(this.example.duration));
    const phase=DATA.phaseStarts.reduce((n,start,i)=>time>=start?i:n,0);
    $$('.prompt-stage',this.host).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===phase)));
    $('.caption-number',this.host).textContent='PROMPT '+String(phase+1).padStart(2,'0');
    $('.caption-text',this.host).textContent=this.example.prompts[phase];
  }
  destroy() {
    this.pause();this.dead=true;players.delete(this);
    this.videos.forEach(v=>{v.removeAttribute('src');v.load();});
    this.host.innerHTML='';
  }
}
async function copyCitation() {
  const text=$('#bibtex').textContent;
  let copied=false;
  try{await navigator.clipboard.writeText(text);copied=true;}
  catch(_){
    const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();
    copied=document.execCommand('copy');field.remove();
  }
  $('#copy-status').textContent=copied?'Citation copied.':'Select the citation text to copy it.';
  $('#copy-citation').innerHTML=icon(copied?'check':'copy');
  setTimeout(()=>{$('#copy-citation').innerHTML=icon('copy');},2000);
}

function renderResults(){
 const colors={'Infinity-RoPE':'#b9c4cf','Relax Forcing':'#637d96','Deep Forcing':'#9daab6','MemRoPE':'#818d99','PACC (Ours)':'#2b7760'},axisMin=30,axisMax=65,axisStep=5;
 const axisRange=axisMax-axisMin;
 $('#result-axis-range').textContent=axisMin+'\u2013'+axisMax+' (truncated axis)';
 const visibleRows=family=>DATA.results[family].filter(r=>r[0]!=='Rolling Sink');
 $('#result-legend').innerHTML=visibleRows('rcm').map(r=>'<li><span style="background:'+colors[r[0]]+'" aria-hidden="true"></span>'+escapeHTML(r[0])+'</li>').join('');
 $('#result-charts').innerHTML=['rcm','cf'].map(family=>{
  const rows=visibleRows(family);
  const grid=Array.from({length:axisRange/axisStep+1},(_,i)=>axisMin+i*axisStep).map(v=>'<span class="mbench-gridline" style="bottom:'+(v-axisMin)/axisRange*100+'%"><span>'+v+'</span></span>').join('');
  const bars=rows.map(r=>'<div class="mbench-bar '+(r[0]==='PACC (Ours)'?'ours':'')+'" role="listitem" data-score="'+r[4]+'" aria-label="'+escapeHTML(r[0])+': '+r[4].toFixed(2)+'" title="'+escapeHTML(r[0])+': '+r[4].toFixed(2)+'" style="--bar-color:'+colors[r[0]]+';height:'+(r[4]-axisMin)/axisRange*100+'%"><span class="mbench-value" aria-hidden="true">'+r[4].toFixed(2)+'</span></div>').join('');
  return '<div class="mbench-backbone" data-backbone="'+family+'" data-axis-min="'+axisMin+'" data-axis-max="'+axisMax+'"><div class="mbench-plot"><div class="mbench-grid" aria-hidden="true">'+grid+'</div><div class="mbench-bars" role="list" style="--bar-count:'+rows.length+'" aria-label="'+familyName(family)+' MBench scores; axis starts at '+axisMin+'">'+bars+'</div></div><h3>'+familyName(family)+'</h3></div>';
 }).join('');
 animateResults();
}
function animateResults(){
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),replay=$('#replay-results');
 const charts=$$('#result-charts .mbench-backbone').map(plot=>{
  const bars=$$('.mbench-bar',plot).map(bar=>({bar,label:$('.mbench-value',bar),score:Number(bar.dataset.score)}));
  return {plot,bars,axisMin:Number(plot.dataset.axisMin),axisMax:Number(plot.dataset.axisMax),visible:false,played:false,raf:0};
 });
 const paint=(chart,progress)=>{
  for(const {bar,label,score} of chart.bars){
   bar.style.height=String((score-chart.axisMin)/(chart.axisMax-chart.axisMin)*100*progress)+'%';
   label.textContent=(chart.axisMin+(score-chart.axisMin)*progress).toFixed(2);
  }
 };
 const finish=chart=>{
  cancelAnimationFrame(chart.raf);chart.raf=0;chart.played=true;paint(chart,1);
 };
 const play=chart=>{
  if(preference.matches){finish(chart);return;}
  cancelAnimationFrame(chart.raf);chart.played=true;paint(chart,0);
  let start;
  const tick=now=>{
   if(start===undefined)start=now;
   const progress=Math.min(1,(now-start)/2200);
   paint(chart,1-Math.pow(1-progress,3));
   if(progress<1)chart.raf=requestAnimationFrame(tick);else finish(chart);
  };
  chart.raf=requestAnimationFrame(tick);
 };
 // Each backbone starts when visible, including the lower chart on mobile.
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   const chart=charts.find(c=>c.plot===entry.target);chart.visible=entry.isIntersecting&&entry.intersectionRatio>=.5;
   if(!chart.visible&&chart.raf){cancelAnimationFrame(chart.raf);chart.raf=0;chart.played=false;paint(chart,0);}
   if(chart.visible&&!chart.played&&!document.hidden)play(chart);
  }
 },{threshold:.5});
 charts.forEach(chart=>{if(preference.matches)finish(chart);else paint(chart,0);observer.observe(chart.plot);});
 replay.hidden=preference.matches;
 replay.onclick=()=>charts.forEach(chart=>{
  cancelAnimationFrame(chart.raf);chart.raf=0;chart.played=false;paint(chart,0);
  if(preference.matches)finish(chart);else if(chart.visible)play(chart);
 });
 preference.addEventListener('change',()=>{
  replay.hidden=preference.matches;
  if(preference.matches)charts.forEach(finish);
 });
 document.addEventListener('visibilitychange',()=>{
  for(const chart of charts){
   if(document.hidden&&chart.raf)finish(chart);
   else if(!document.hidden&&chart.visible&&!chart.played)play(chart);
  }
 });
}

const rolloutSteps=[
 {title:'Teacher generates the prefix',text:'Use the frozen teacher to generate the first few chunks ahead of training.'},
 {title:'Student predicts from memory',text:'Compress the prefix H into M. The student uses M to generate the first new chunk, Y1.'},
 {title:'Append Y1, then predict again',text:'Add Y1 to the rollout prefix H, compress the updated H into M, then use that memory to generate Y2.'},
 {title:'Append Y2 to the rollout prefix',text:'Add Y2 to H as well. The teacher-generated chunks and student continuation together form the rollout prefix H.'}
];
const trainingSteps=[
 {title:'Match the next prediction',text:'At each noisy rollout state, compare full-prefix and compressed-memory predictions. Both see the same generated history.'},
 {title:'Train only the compressor',text:'Average the rollout losses, then update only C through frozen G. Generated history and teacher targets stay detached.'}
];
const inferenceSteps=[
 {title:'Compress a completed block',text:'Every 21 latent frames, convert the completed block into CR10 memory. No frames are reconstructed.'},
 {title:'Keep a compact archive',text:'Store each memory block once. New blocks are added without rewriting the earlier memories.'},
 {title:'Retrieve, anchor and continue',text:'For each new three-frame chunk, select one memory block and combine it with raw sink and recent frames.'}
];
const frame=(name='start',method='pacc')=>DATA.demos.find(c=>c.id===DATA.showcase.id).methods[method].stills[name];
const txt=(x,y,text,cls='',anchor='middle')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" class="'+cls+'">'+text+'</text>';
const pic=(x,y,w,h,name='start')=>'<image href="'+frame(name)+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="xMidYMid meet"/>';
const cue=(content,at=0,dy=8,dx=0)=>'<g data-cue="'+at+'" data-dy="'+dy+'" data-dx="'+dx+'">'+content+'</g>';
const during=(content,from,to)=>'<g data-window="'+from+'" data-until="'+to+'">'+content+'</g>';
const route=(d,at=0,duration=800,cls='',arrow=true)=>'<path class="'+(arrow?'wire':'trace')+' '+cls+'" data-draw="'+at+'" data-duration="'+duration+'" d="'+d+'"/>';
const line=(x1,y1,x2,y2,at=0,duration=800)=>route('M'+x1+','+y1+' L'+x2+','+y2,at,duration);
function flight(d,at,duration=950,photo='',centered=false){
 const content=photo?'<g'+(centered?' transform="translate(-15 -9)"':'')+'>'+pic(0,0,30,18,photo)+'</g>':'<rect width="9" height="7" rx="1" class="packet"/><rect x="12" width="9" height="7" rx="1" class="packet"/>';
 return '<g data-flight="'+at+'" data-duration="'+duration+'" aria-hidden="true"><path class="flight-route" d="'+d+'" fill="none" stroke="none"/><g class="flight-payload">'+content+'</g></g>';
}
function model(x,y,w,h,label,note='',pulseAt=0,learn=false){
 return '<rect class="model" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/>'+
 '<rect class="model-work '+(learn?'learn':'')+'" data-pulse="'+pulseAt+'" data-duration="1500" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/>'+
 txt(x+w/2,y+h/2+6,label)+(note?txt(x+w/2,y+h+21,note,'sans'):'');
}
function memory(x,y,label='',selected=false,small=false,at=0){
 const cell=small?7:10,gap=3,total=6*(cell+gap)-gap;
 return '<g class="memory-mark">'+Array.from({length:12},(_,i)=>cue('<rect class="cell" x="'+(x+(i%6)*(cell+gap))+'" y="'+(y+Math.floor(i/6)*(cell+gap))+'" width="'+cell+'" height="'+cell+'"/>',at+i*35,5)).join('')+
 (selected?cue('<rect x="'+(x-7)+'" y="'+(y-7)+'" width="'+(total+14)+'" height="'+(cell*2+gap+14)+'" fill="none" stroke="#2b7760" stroke-width="1.5"/>',at+440,0):'')+
 (label?cue(txt(x+total/2,y+cell*2+gap+27,label,selected?'green':''),at+400,4):'')+'</g>';
}
function wrapDiagram(title,body,mobile){
 const marker='arrow-'+title.toLowerCase().replace(/[^a-z]+/g,'-');
 return '<svg viewBox="0 0 '+(mobile?'360 390':'1000 345')+'" style="--arrowhead:url(#'+marker+')" role="img" aria-label="'+escapeHTML(title)+'"><title>'+escapeHTML(title)+'</title><defs><marker id="'+marker+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs><g class="scene">'+body+'</g></svg>';
}
function compressScene(mobile,inference=false){
 const title=inference?'Completed block':'Rollout prefix H';
 if(mobile)return txt(180,27,title)+['start','middle','end'].map((n,i)=>cue(pic(20+i*111,45,98,57,n),i*180)).join('')+
 line(180,115,180,147,750)+model(120,158,120,59,'Compressor',inference?'frozen':'trainable',1400)+
 line(180,244,180,273,2500)+memory(142,289,inference?'Memory':'Memory M',true,false,2900)+
 flight('M165,113 L165,139',850,850,'middle')+flight('M171,248 L171,277',2550)+
 cue(txt(180,370,inference?'21 latent frames → CR10':'Compress once; keep M for this rollout.','sans'),3600);
 return txt(199,86,title)+['start','middle','end'].map((n,i)=>cue(pic(45+i*106,105,100,58,n),i*180)).join('')+
 line(375,136,438,136,750)+model(450,104,128,64,'Compressor',inference?'frozen':'trainable',1400)+
 line(596,136,660,136,2500)+memory(691,124,inference?'Memory':'Memory M',true,false,2900)+
 flight('M366,126 L413,126',850,850,'middle')+flight('M592,131 L661,131',2550)+
 cue(txt(500,266,inference?'21 latent frames → compact memory tokens':'Compress once; keep M throughout this training rollout.','sans'),3600);
}
function rolloutDiagram(step,mobile){
 const width=mobile?360:1000,height=mobile?430:300;
 const atStep=(phase,time)=>step<phase?100000:step===phase?time:-2000;
 const after=time=>atStep(1,time),append=time=>atStep(2,time);
 const paths=mobile?{
  history:'M235,118 V139 H71 V159',compress:'M136,189 H154',memory:'M200,244 V274 H61 V293',
  predict:'M116,323 V285 H287 V295',return:'M190,375 H338 V32 H257 V38'
 }:{
  history:'M233,166 V188 H343 V112 H360',compress:'M512,112 H524',memory:'M619,112 H692',
  predict:'M820,112 V67 H961 V82',return:'M870,170 V220 H334 V74 H260 V90'
 };
 const highlight=(id,path,time,duration)=>'<g data-rollout-flow="'+id+'" style="--arrowhead:url(#rollout-focus-arrow)">'+route(path,time,duration,'rollout-highlight')+
  '<g data-flight="'+time+'" data-duration="'+duration+'" aria-hidden="true"><path class="flight-route" d="'+path+'" fill="none" stroke="none"/><g class="flight-payload"><circle class="rollout-flow-marker" r="5"/></g></g></g>';
 const focusBox=(id,x,y,w,h,time)=>'<g data-rollout-focus="'+id+'">'+cue('<rect class="rollout-focus-box" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3"/>',time,0)+'</g>';
 const node=(id,body)=>'<g data-rollout-node="'+id+'">'+body+'</g>';
 const chunk=(x,y,id,photo,at,w=70,h=40,labelAt=-2000)=>'<rect class="rollout-frame '+(id[0]==='Y'?'generated':'given')+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="2"/>'+
  '<g data-rollout-chunk="'+id+'">'+cue(pic(x+1,y+1,w-2,h-2,photo),at,0)+'</g>'+cue(txt(x+w/2,y+h+22,id,'sans'+(id[0]==='Y'?' green':'')),labelAt,0);
 const compact=(x,y)=>node('memory','<rect class="rollout-frame generated" x="'+(x-4)+'" y="'+(y-4)+'" width="83" height="31" rx="2"/>'+
  memory(x,y,'',false,false,after(600))+txt(x+37.5,y+54,'Memory M','sans green')+
  (step===2?'<rect class="model-work rollout-work" data-pulse="3400" data-duration="1100" x="'+(x-4)+'" y="'+(y-4)+'" width="83" height="31"/>':''));
 const historyCopy=(id,phase,x,y,w,h)=>'<g data-appended-history="'+id+'">'+cue(chunk(x,y,id,'end',atStep(phase,1900),w,h,atStep(phase,1900)),atStep(phase,100),0)+'</g>';
 const copyFlight=(id,phase,d,centered=false)=>'<g data-history-flight="'+id+'">'+flight(d,atStep(phase,600),1200,'end',centered)+'</g>';
 const footer=step===3?'H now includes Y1 and Y2.':step===2?'Update H, compress, then predict Y2.':'Compress H; predict Y1 from M.';
 let body='';
 if(mobile){
  body=node('teacher',model(12,40,94,46,'Teacher G','frozen',step===0?0:-2000))+
   line(114,63,142,63,step===0?100:-2000,450)+txt(234,20,'Rollout prefix H','sans')+
   chunk(150,46,'H1','start',step===0?550:-2000,38,28)+chunk(194,46,'H2','middle',step===0?1100:-2000,38,28)+
   historyCopy('Y1',2,238,46,38,28)+historyCopy('Y2',3,282,46,38,28)+
   route(paths.history,after(100),450)+
   node('compressor',model(14,166,114,46,'Compressor','trainable C',step===2?3000:after(400),true))+
   route(paths.compress,after(400),450)+compact(162,178)+
   txt(239,156,'Student context M','sans rollout-context-label')+
   route(paths.memory,after(1200),450)+
   node('student',model(14,300,94,46,'Student G','frozen',step>=2?append(4300):after(1500)))+
   line(116,323,147,323,after(1700),350)+
   '<g data-rollout-output="Y1">'+chunk(155,303,'Y1','end',after(2200))+'</g>'+
   route(paths.predict,append(4800),650)+'<g data-rollout-output="Y2">'+chunk(252,303,'Y2','end',append(5650))+'</g>'+
   copyFlight('Y1',2,paths.return,true)+copyFlight('Y2',3,'M267,375 H328 V51 H286')+
   txt(180,420,footer,'sans');
 }else{
  body=node('teacher',model(12,86,108,52,'Teacher G','frozen',step===0?0:-2000))+
   line(128,112,140,112,step===0?100:-2000,450)+txt(237,46,'Rollout prefix H','sans')+
   chunk(148,98,'H1','start',step===0?550:-2000,40,29)+chunk(194,98,'H2','middle',step===0?1100:-2000,40,29)+
   historyCopy('Y1',2,240,98,40,29)+historyCopy('Y2',3,286,98,40,29)+
   route(paths.history,after(100),450)+
   node('compressor',model(368,86,136,52,'Compressor','trainable C',step===2?3000:after(400),true))+
   route(paths.compress,after(400),450)+compact(532,104)+
   txt(605,46,'Student context M','sans')+
   route(paths.memory,after(1200),450)+
   node('student',model(700,86,114,52,'Student G','frozen',step>=2?append(4300):after(1500)))+
   line(820,112,827,112,after(1700),350)+txt(912,46,'Student chunks','sans')+
   '<g data-rollout-output="Y1">'+chunk(835,90,'Y1','end',after(2200))+'</g>'+
   route(paths.predict,append(4800),650)+'<g data-rollout-output="Y2">'+chunk(926,90,'Y2','end',append(5650))+'</g>'+
   copyFlight('Y1',2,paths.return,true)+copyFlight('Y2',3,'M946,170 V220 H291 V104')+
   txt(500,277,footer,'sans');
 }
 if(step===2){
  body+=during(highlight('append',paths.return,600,1200),500,2450)+
   highlight('history',paths.history,2350,650)+highlight('compress',paths.compress,3200,450)+
   highlight('memory',paths.memory,3800,600)+highlight('predict',paths.predict,4800,650);
  body+=mobile?focusBox('history',146,42,134,36,1900)+focusBox('compressor',14,166,114,46,2900)+
   focusBox('memory',158,174,83,31,3400)+focusBox('student',14,300,94,46,4300)+focusBox('Y2',252,303,70,40,5650):
   focusBox('history',144,94,140,37,1900)+focusBox('compressor',368,86,136,52,2900)+
   focusBox('memory',528,100,83,31,3400)+focusBox('student',700,86,114,52,4300)+focusBox('Y2',926,90,70,40,5650);
 }
 return '<svg viewBox="0 0 '+width+' '+height+'" style="--arrowhead:url(#rollout-arrow)" role="img" aria-label="Teacher generates prefix chunks, compressor produces memory M, student generates the continuation"><title>Teacher prefix, compressor, memory, student continuation</title><defs><marker id="rollout-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker><marker id="rollout-focus-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#d35414"/></marker></defs><g class="scene">'+body+'</g></svg>';
}
function predictionScene(mobile,gradient){
 // Keep the complete forward graph in place when switching to the update step.
 const at=time=>gradient?-2000:time;
 const node=(id,body)=>'<g data-training-node="'+id+'">'+body+'</g>';
 let s='';
 if(mobile){
  s=node('history',cue(pic(16,28,74,43)+txt(70,17,'Rollout prefix H','sans'),at(0)))+
   line(96,50,140,50,at(400))+
   node('teacher',model(149,24,89,52,'G','teacher / frozen',at(1100)))+
   line(244,50,269,50,at(2400))+
   node('full',cue(txt(295,57,'v<tspan baseline-shift="sub" font-size="11">full</tspan>')+txt(295,83,'detached','sans'),at(2900)))+
   route('M53,100 V125 H69 V138',at(400),800)+
   node('compressor',model(14,142,110,50,'Compressor','trainable C',gradient?3100:1100,gradient))+
   line(130,167,171,167,at(1500))+
   node('memory',memory(179,154,'Memory',false,true,at(2000)))+
   route('M208,211 V228 H194 V240',at(2500),650)+
   node('student',model(149,244,89,52,'G','student / frozen',at(3000)))+
   line(244,270,269,270,at(3700))+
   node('mem',cue(txt(295,277,'v<tspan baseline-shift="sub" font-size="11">mem</tspan>'),at(4200)))+
   route('M326,50 H343 V270 H326',at(4700),600,'',false)+
   node('loss',cue(txt(290,151,'MSE')+txt(290,176,'loss','sans'),at(5000)))+
   txt(190,119,'Same noisy chunk','sans')+txt(180,381,'Both also see the same generated history.','sans');
  if(gradient)s+=route('M322,181 H350 V329 H253 V282 H242',700,1200,'gradient-wire')+
   route('M230,240 V220 H248 V163 H239',2000,750,'gradient-wire')+
   route('M173,177 H129',2800,400,'gradient-wire')+
   cue('<rect x="14" y="142" width="110" height="50" fill="none" stroke="var(--red)" stroke-width="2"/>',3100,0)+
   cue(txt(180,359,'Update compressor only','red'),3200,0);
  else s+=flight('M94,45 L132,45',450,650)+flight('M129,163 L164,163',1550,700)+
   flight('M199,211 V224 H184 V236',2550,650)+flight('M241,266 L262,266',3750,650);
 }else{
  s=txt(500,23,'Both branches also see the same generated history.','sans')+
   node('history',cue(txt(123,119,'Rollout prefix H')+['start','middle','end'].map((name,i)=>pic(28+i*65,137,60,36,name)).join(''),at(0)))+
   route('M230,155 H255 V80 H582',at(400),1000)+
   node('teacher',model(594,48,144,64,'Generator G','teacher / frozen',at(1400)))+
   line(754,80,793,80,at(2500))+
   node('full',cue(txt(823,87,'v<tspan baseline-shift="sub" font-size="14">full</tspan>')+txt(823,116,'detached','sans'),at(3000)))+
   route('M230,155 H255 V236 H270',at(400),800)+
   node('compressor',model(282,204,134,64,'Compressor','trainable C',gradient?3200:1200,gradient))+
   line(424,236,451,236,at(1500))+
   node('memory',memory(463,224,'Memory M',true,false,at(2000)))+
   line(550,236,582,236,at(2600))+
   node('student',model(594,204,144,64,'Generator G','student / frozen',at(3100)))+
   line(754,236,793,236,at(3800))+
   node('mem',cue(txt(823,243,'v<tspan baseline-shift="sub" font-size="14">mem</tspan>'),at(4300)))+
   route('M870,80 H889 V236 H870',at(4700),600,'',false)+
   node('loss',cue(txt(940,151,'MSE')+txt(940,176,'loss','sans'),at(5000)))+
   txt(666,165,'Same noisy chunk','sans');
  if(gradient)s+=route('M928,193 V302 H774 V252 H742',700,1400,'gradient-wire')+
   route('M586,252 H548',2200,500,'gradient-wire')+
   route('M452,252 H420',2800,400,'gradient-wire')+
   cue('<rect x="282" y="204" width="134" height="64" fill="none" stroke="var(--red)" stroke-width="2"/>',3200,0)+
   cue(txt(580,339,'Gradients through G; update only C.','sans red'),3200,0);
  else s+=flight('M230,150 H249 V75 H574',450,1000)+flight('M421,231 L444,231',1550,650)+
   flight('M546,231 L574,231',2650,650)+flight('M750,231 L786,231',3850,650);
 }
 return s;
}
function trainingDiagram(step,mobile){
 return wrapDiagram(trainingSteps[step].title,predictionScene(mobile,step===1),mobile);
}
function inferenceDiagram(step,mobile){
 let s='';
 if(step===0)s=compressScene(mobile,true);
 if(step===1){
  const xs=mobile?[21,141,261]:[151,436,721],yw=mobile?68:72,w=mobile?78:128,h=mobile?45:74;
  xs.forEach((x,i)=>{
   const at=i*1600;s+=cue(txt(x+w/2,yw-18,'Block '+(i+1))+pic(x,yw,w,h,['start','middle','end'][i]),at)+
    line(x+w/2,yw+h+16,x+w/2,mobile?215:205,at+450)+memory(x+(mobile?10:27),mobile?232:225,'M'+(i+1),i===2,mobile,at+1250)+
    flight('M'+(x+w/2-10)+','+(yw+h+17)+' V'+(mobile?220:210),at+500,800);
  });
  s+=cue(txt(mobile?180:500,mobile?350:326,'Store once. Append as the video grows.','sans'),4900);
 }
 if(step===2){
  if(mobile){
   [22,142,262].forEach((x,i)=>s+=memory(x,45,'M'+(i+1),false,true,0));
   s+=during('<rect class="selection" x="135" y="38" width="71" height="31"/>',600,4400)+during('<rect class="selection" x="255" y="38" width="71" height="31"/>',4500,10000);
   s+=during(route('M170,113 V156',950,800),800,4400)+during(route('M290,113 V140 H180 V156',4700,800),4500,10000)+
    cue(pic(19,177,76,44)+pic(266,177,76,44,'end'),200)+memory(152,187,'',true,true,1700)+
    txt(57,246,'Sink ×2','sans')+during(txt(180,246,'Memory M2','sans'),1700,4400)+during(txt(180,246,'Memory M3','sans'),5200,10000)+txt(305,246,'Recent','sans')+
    line(180,264,180,289,2200)+model(120,300,120,56,'Generator G','',2800)+cue(txt(180,384,'Generate the next chunk','sans'),3500)+
    flight('M163,109 V157',1000,850)+flight('M280,107 V140 H170 V158',4750,850)+flight('M170,262 L170,282',2350,650)+flight('M170,262 L170,282',6200,650);
  }else{
   [139,340,541].forEach((x,i)=>s+=memory(x,38,'M'+(i+1),false,false,0));
   s+=during('<rect class="selection" x="333" y="31" width="89" height="37"/>',600,4400)+during('<rect class="selection" x="534" y="31" width="89" height="37"/>',4500,10000);
   s+=during(route('M378,109 V161 H422 V190',950,850),800,4400)+during(route('M579,109 V161 H422 V190',4700,850),4500,10000)+
    cue(pic(97,194,94,54)+pic(106,200,94,54),200)+txt(152,283,'Raw sink ×2','sans')+memory(385,208,'',true,false,1700)+
    during(txt(423,283,'Memory M2','green'),1700,4400)+during(txt(423,283,'Memory M3','green'),5200,10000)+
    cue(pic(594,194,94,54,'end'),200)+txt(641,283,'Raw recent','sans')+txt(293,228,'+')+txt(540,228,'+')+
    line(703,222,748,222,2350)+model(762,190,102,64,'G','frozen',3000)+line(878,222,906,222,3700)+cue(pic(921,198,77,44,'end'),4050)+
    txt(953,282,'Next chunk','sans')+cue(txt(500,333,'Retrieve again for every native generation chunk.','sans'),4800)+
    flight('M368,108 V155 H412 V190',1000,850)+flight('M570,108 V155 H412 V190',4750,850)+
    flight('M698,218 L739,218',2400,650)+flight('M698,218 L739,218',6200,650)+flight('M874,218 L903,218',3750,500)+flight('M874,218 L903,218',7300,500);
  }
 }
 return wrapDiagram(inferenceSteps[step].title,s,mobile);
}
class Story{
 constructor(id,steps,diagram){
  this.id=id;this.host=$('#'+id+'-story');this.steps=steps;this.diagram=diagram;this.index=0;this.playing=false;this.raf=0;this.mobile=innerWidth<=700;
  this.durations={rollout:[2600,3800,7000,3400],training:[6800,6200],inference:[6200,7200,9000]}[id];
  this.total=this.durations.reduce((a,b)=>a+b,0);this.elapsed=0;this.mode='auto';this.userPaused=reduced;this.visible=false;
  const progress=$('.story-progress',this.host);
  progress.innerHTML=steps.map((s,i)=>'<span class="story-segment" data-step="'+i+'" style="flex:'+this.durations[i]+'"><span></span></span>').join('')+
   '<input class="story-seek" type="range" min="0" max="'+this.total/1000+'" step="0.02" value="0" aria-label="'+id+' animation timeline">';
  this.seekControl=$('.story-seek',this.host);this.seekControl.oninput=()=>this.seek(+this.seekControl.value*1000);
  $('.previous',this.host).onclick=()=>this.select(this.index-1);
  $('.next',this.host).onclick=()=>this.select(this.index+1);
  $('.toggle',this.host).onclick=()=>this.playing?this.pause(true):this.play();
  this.go(0,reduced);stories.push(this);
  new IntersectionObserver(es=>{
   this.visible=es[0].isIntersecting;
   if(!this.visible)this.pause(false);
   else if(!this.userPaused&&!reduced&&this.mode==='auto')this.start();
  },{threshold:.35}).observe(this.host);
  new ResizeObserver(()=>{const m=innerWidth<=700;if(m!==this.mobile){this.mobile=m;this.draw();}}).observe(this.host);
 }
 go(index,manual=false){
  cancelAnimationFrame(this.raf);this.index=(index+this.steps.length)%this.steps.length;
  this.host.dataset.step=String(this.index);
  this.elapsed=manual?this.durations[this.index]:0;
  if(manual){this.playing=false;this.userPaused=true;}
  const s=this.steps[this.index];
  $('.story-words h3',this.host).innerHTML='<span class="story-number">'+(this.index+1)+'</span>'+escapeHTML(s.title);
  $('.story-words p',this.host).textContent=s.text;
  $('output',this.host).textContent=(this.index+1)+' / '+this.steps.length;
  this.draw();this.controls();
 }
 draw(){const stage=$('.story-stage',this.host);stage.innerHTML=this.diagram(this.index,this.mobile);this.motion=new DiagramMotion($('svg',stage));this.paint();}
 paint(){
  this.motion.paint(this.elapsed);
  $$('[data-step]',this.host).forEach((bar,i)=>{
   bar.classList.toggle('active',i===this.index);bar.style.setProperty('--progress',String(i<this.index?1:i>this.index?0:this.elapsed/this.durations[i]));
  });
  const global=this.durations.slice(0,this.index).reduce((a,b)=>a+b,0)+this.elapsed;
  this.seekControl.value=String(global/1000);this.seekControl.setAttribute('aria-valuetext',this.steps[this.index].title+', '+Math.round(this.elapsed/this.durations[this.index]*100)+' percent');
 }
 select(index){
  this.pause(true);this.mode='step';this.go(index,reduced);
  if(!reduced)this.start();
 }
 seek(time){
  this.pause(true);this.mode='auto';time=Math.max(0,Math.min(this.total,time));
  let index=0,local=time;while(index<this.durations.length-1&&local>=this.durations[index])local-=this.durations[index++];
  if(index!==this.index)this.go(index);
  this.elapsed=local;this.paint();
 }
 play(){
  this.userPaused=false;this.mode='auto';
  if(this.elapsed>=this.durations[this.index])this.go(this.index+1);
  this.start();
 }
 start(){
  stories.forEach(s=>{if(s!==this)s.pause(false);});stopOthers(null);
  if(this.playing)return;this.playing=true;this.last=performance.now();this.controls();this.raf=requestAnimationFrame(t=>this.tick(t));
 }
 pause(user=false){this.playing=false;if(user)this.userPaused=true;cancelAnimationFrame(this.raf);this.controls();}
 controls(){this.host.dataset.playing=String(this.playing);const b=$('.toggle',this.host);b.innerHTML=icon(this.playing?'pause':'play');b.setAttribute('aria-label',(this.playing?'Pause ':'Play ')+this.id+' animation');b.title=this.playing?'Pause animation':'Play animation';}
 tick(now){
  if(!this.playing)return;this.elapsed+=Math.min(100,now-this.last);this.last=now;
  if(this.elapsed>=this.durations[this.index]){
   this.elapsed=this.durations[this.index];this.paint();
   if(this.mode==='step'){this.pause(true);return;}
   this.go(this.index+1);
  }
  this.paint();this.raf=requestAnimationFrame(t=>this.tick(t));
 }
}
function renderDemo(id){
 const c=DATA.demos.find(x=>x.id===id);if(!c)return;
 if(mainPlayer)mainPlayer.destroy();
 mainPlayer=new ComparisonPlayer($('#comparison-player'),c,false);
 $('#comparison-title').textContent=c.title;$('#comparison-family').textContent=familyName(c.family)+' / CR10 / 5k / seed '+c.seed;
 $$('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===id)));
}
async function init(){
 const r=await fetch('data.json');if(!r.ok)throw Error('Research data could not load.');DATA=await r.json();
 const showcase=DATA.demos.find(c=>c.id===DATA.showcase.id);
 $('#teaser-title').textContent=DATA.showcase.title;
 teaserPlayer=new ComparisonPlayer($('#teaser-player'),showcase);
 let teaserPaused=reduced,teaserVisible=false;
 $('#teaser-player').addEventListener('pointerdown',e=>{if(e.target.closest('button,input,select'))teaserPaused=true;});
 $('#teaser-player').addEventListener('click',e=>{if(e.target.closest('.play-toggle'))teaserPaused=!teaserPlayer.intent;});
 new IntersectionObserver(es=>{
  teaserVisible=es[0].isIntersecting;
  if(teaserVisible&&!teaserPaused&&!document.hidden)teaserPlayer.play();
  else if(!teaserVisible)teaserPlayer.pause();
 },{threshold:.25}).observe($('#teaser-player'));
 const rollout=new Story('rollout',rolloutSteps,rolloutDiagram),training=new Story('training',trainingSteps,trainingDiagram),inference=new Story('inference',inferenceSteps,inferenceDiagram);
 $('#case-tabs').innerHTML=DATA.demos.map((c,i)=>'<button data-case="'+c.id+'" aria-pressed="'+(i===0)+'" aria-controls="comparison-player" aria-label="'+escapeHTML(c.tab)+'"><img src="'+c.methods.pacc.poster+'" width="832" height="480" alt="" loading="lazy"><span class="case-title">'+escapeHTML(c.shortTitle)+'</span><span class="case-family">'+familyName(c.family)+'</span></button>').join('');
 $$('[data-case]').forEach(b=>b.onclick=()=>renderDemo(b.dataset.case));
 const observer=new IntersectionObserver(es=>{if(es[0].isIntersecting&&!mainPlayer){renderDemo(DATA.demos[0].id);observer.disconnect();}},{rootMargin:'400px'});observer.observe($('#comparison-player'));
 renderResults();
 $('#copy-citation').onclick=copyCitation;
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopOthers(null);stories.forEach(s=>s.pause());}
  else if(teaserVisible&&!teaserPaused&&!reduced)teaserPlayer.play();
  else if(!reduced){const active=stories.find(s=>s.visible&&!s.userPaused&&s.mode==='auto');active?.start();}
 });
 new IntersectionObserver(es=>{if(!es[0].isIntersecting)mainPlayer?.pause();},{threshold:.02}).observe($('#comparisons'));
 window.PACC={data:DATA,rollout,training,inference,renderDemo,teaser:teaserPlayer,get player(){return mainPlayer}};
 document.documentElement.dataset.ready='true';
}
init().catch(e=>{$('#load-error').hidden=false;$('#load-error').textContent=e.message+' The paper PDF remains available.';});
