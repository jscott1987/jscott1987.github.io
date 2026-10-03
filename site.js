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
  async function loadAnalyticsConfig(){
    try{
      const r=await fetch('/api/config',{cache:'no-store'});
      if(!r.ok) return;
      const cfg=await r.json();
      const id=cfg?.ga4_measurement_id;
      if(!id||!/^G-[A-Z0-9]+$/i.test(id)||document.querySelector('script[data-pd-ga4]')) return;
      const s=document.createElement('script');
      s.async=true;
      s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
      s.dataset.pdGa4='1';
      document.head.appendChild(s);
      window.dataLayer=window.dataLayer||[];
      window.gtag=function(){window.dataLayer.push(arguments);};
      window.gtag('js',new Date());
      window.gtag('config',id,{send_page_view:false});
    }catch{}
  }
  window.PuppyDiscoveryAnalytics={track:send,anonymousId:anonId};
  loadAnalyticsConfig().finally(()=>{
    send('page_view',{});
    if(/^\/puppies\/[a-z0-9-]+\/$/.test(location.pathname) && !/\/puppies\/stuart-fl\/$/.test(location.pathname)){
      send('puppy_view',{slug:location.pathname.split('/').filter(Boolean).pop()});
    }
  });
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