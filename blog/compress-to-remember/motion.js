'use strict';

// One clock drives drawing, movement and scrubbing, so pause freezes the whole figure.
class DiagramMotion {
  constructor(svg) {
    const items=selector=>Array.from(svg.querySelectorAll(selector));
    this.cues=items('[data-cue]').map(el=>({el,start:+el.dataset.cue,duration:+el.dataset.duration||400,dx:+el.dataset.dx||0,dy:+el.dataset.dy||0,base:el.getAttribute('transform')||''}));
    this.traces=items('[data-draw]').map(el=>({el,start:+el.dataset.draw,duration:+el.dataset.duration||900,length:el.getTotalLength()}));
    this.flights=items('[data-flight]').map(el=>({el,path:el.querySelector('.flight-route'),payload:el.querySelector('.flight-payload'),start:+el.dataset.flight,duration:+el.dataset.duration||1000}));
    this.flights.forEach(f=>f.length=f.path.getTotalLength());
    this.pulses=items('[data-pulse]').map(el=>({el,start:+el.dataset.pulse,duration:+el.dataset.duration||1100}));
    this.windows=items('[data-window]').map(el=>({el,start:+el.dataset.window,end:+el.dataset.until||Infinity}));
  }
  paint(time) {
    const unit=x=>Math.max(0,Math.min(1,x));
    const ease=x=>{const u=unit(x);return u*u*(3-2*u);};
    for(const c of this.cues){
      const p=ease((time-c.start)/c.duration);
      c.el.style.opacity=p;
      c.el.setAttribute('transform',c.base+' translate('+(c.dx*(1-p))+','+(c.dy*(1-p))+')');
    }
    for(const t of this.traces){
      const p=ease((time-t.start)/t.duration);
      t.el.style.strokeDasharray=String(t.length);
      t.el.style.strokeDashoffset=String((1-p)*t.length);
      t.el.style.opacity=p?1:0;
      t.el.style.markerEnd=p>.98&&t.el.classList.contains('wire')?'var(--arrowhead)':'none';
    }
    for(const f of this.flights){
      const p=(time-f.start)/f.duration;
      f.el.style.opacity=unit(p*8)*unit((1-p)*8);
      const point=f.path.getPointAtLength(ease(p)*f.length);
      f.payload.setAttribute('transform','translate('+point.x+','+point.y+')');
    }
    for(const p of this.pulses){
      const u=(time-p.start)/p.duration;
      const strength=u>0&&u<1?Math.sin(u*Math.PI):0;
      p.el.style.strokeWidth=String(1+2*strength);
      p.el.style.strokeOpacity=String(strength);
      p.el.style.fillOpacity=String(.07*strength);
    }
    for(const w of this.windows)w.el.style.opacity=String(unit((time-w.start)/180)*unit((w.end-time)/180));
  }
}
