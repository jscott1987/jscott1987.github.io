(function(){
  const KEY='pd_anon_id';
  let anonId=localStorage.getItem(KEY);
  if(!anonId){anonId=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2));localStorage.setItem(KEY,anonId);}
  const qs=new URLSearchParams(location.search);
  const attribution={
    utm_source:qs.get('utm_source')||null,
    utm_medium:qs.get('utm_medium')||null,
    utm_campaign:qs.get('utm_campaign')||null,
    utm_term:qs.get('utm_term')||null,
    utm_content:qs.get('utm_content')||null,
    referrer:document.referrer||null
  };
  function payload(name,props){
    return {
      event:name,
      event_id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2)),
      anonymous_id:anonId,
      occurred_at:new Date().toISOString(),
      path:location.pathname,
      title:document.title,
      attribution,
      properties:props||{}
    };
  }
  function queue(evt){
    try{
      const q=JSON.parse(localStorage.getItem('pd_event_queue')||'[]');
      q.push(evt); localStorage.setItem('pd_event_queue',JSON.stringify(q.slice(-100)));
    }catch{}
  }
  function send(name,props){
    const evt=payload(name,props);
    if(typeof window.gtag==='function'){
      try{window.gtag('event',name,{...props,page_path:location.pathname});}catch{}
    }
    try{
      const body=JSON.stringify(evt);
      if(navigator.sendBeacon){
        const ok=navigator.sendBeacon('/api/events',new Blob([body],{type:'application/json'}));
        if(!ok) queue(evt);
      }else{
        fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true}).catch(()=>queue(evt));
      }
    }catch{queue(evt);}
  }
  window.PuppyDiscoveryAnalytics={track:send,anonymousId:anonId};
  send('page_view',{});
  document.addEventListener('click',e=>{
    const a=e.target.closest('a,button'); if(!a) return;
    const href=a.getAttribute('href')||'';
    const label=(a.textContent||'').trim().slice(0,120);
    if(href.startsWith('tel:')) send('phone_click',{label,phone:href.replace('tel:','')});
    if(href.startsWith('sms:')) send('sms_click',{label});
    if(/thenoblepaw\.com/i.test(href)) send('outbound_noble_click',{label,href});
    if(/\/puppies\/[a-z0-9-]+\/$/.test(href) && !/stuart-fl/.test(href)) send('puppy_click',{label,href});
    if(/find-my-puppy/.test(href) || /Find My Puppy/i.test(label)) send('find_my_puppy_start',{label,href});
  },{capture:true});
})();