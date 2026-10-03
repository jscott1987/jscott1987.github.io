(function(){
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const auth=$('[data-ops-auth]'),app=$('[data-ops-app]'),form=$('[data-ops-login]'),err=$('[data-ops-error]');
  async function getJson(url,token){
    const r=await fetch(url,{cache:'no-store',headers:token?{authorization:'Bearer '+token}:{}});
    if(!r.ok){const e=new Error(String(r.status));e.status=r.status;throw e;}
    return r.json();
  }
  function eventCount(data,name){return Number((data.events||[]).find(x=>x.event_name===name)?.count||0);}
  async function load(token){
    const [ops,inventory,status]=await Promise.all([
      getJson('/api/ops-summary',token),
      getJson('../data/puppies.json'),
      getJson('../data/sync-status.json')
    ]);
    sessionStorage.setItem('pd_ops_token',token);
    auth.classList.add('ops-hidden');app.classList.remove('ops-hidden');
    const pups=Array.isArray(inventory.puppies)?inventory.puppies:[];
    const available=pups.filter(p=>p.status==='available');
    const unavailable=pups.filter(p=>p.status==='unavailable');
    const breeds={};for(const p of available){const b=p.breed||'Unknown';breeds[b]=(breeds[b]||0)+1;}
    $('[data-kpi="available"]').textContent=available.length;
    $('[data-kpi="breeds"]').textContent=Object.keys(breeds).length;
    $('[data-kpi="unavailable"]').textContent=unavailable.length;
    $('[data-kpi="sync"]').textContent=status.status||'unknown';
    $('[data-kpi="visitors"]').textContent=eventCount(ops,'page_view');
    $('[data-kpi="phone"]').textContent=eventCount(ops,'phone_click');
    $('[data-kpi="forms"]').textContent=(ops.leads||[]).reduce((n,x)=>n+Number(x.count||0),0);
    $('[data-kpi="outbound"]').textContent=eventCount(ops,'outbound_noble_click');
    $('[data-sync-detail]').innerHTML='<span class="status-dot '+(status.status==='success'?'status-success':'status-error')+'"></span>'+esc(status.message||'No sync detail')+(status.last_run?'<br><small>Last run: '+esc(status.last_run)+'</small>':'');
    $('[data-puppy-rows]').innerHTML=pups.map(p=>'<tr><td>'+esc(p.name||'Unnamed')+'</td><td>'+esc(p.breed||'')+'</td><td>'+esc(p.sex||'')+'</td><td>'+esc(p.status||'')+'</td><td>'+esc(p.last_seen_at||p.last_missing_at||'')+'</td><td>'+(p.source_url?'<a href="'+esc(p.source_url)+'">Source</a>':'')+'</td></tr>').join('')||'<tr><td colspan="6">No verified puppy records have been published yet.</td></tr>';
    $('[data-breed-rows]').innerHTML=Object.entries(breeds).sort((a,b)=>b[1]-a[1]).map(([b,n])=>'<tr><td>'+esc(b)+'</td><td>'+n+'</td></tr>').join('')||'<tr><td colspan="2">No verified breed counts yet.</td></tr>';
    $('[data-lead-rows]').innerHTML=(ops.recent_leads||[]).map(l=>'<tr><td>'+esc(l.created_at||'')+'</td><td>'+esc(l.name||'')+'</td><td>'+esc(l.phone||l.email||'')+'</td><td>'+esc(l.breed||l.puppy_name||'')+'</td><td>'+esc(l.status||'')+'</td><td>'+esc(l.source_path||'')+'</td></tr>').join('')||'<tr><td colspan="6">No leads yet.</td></tr>';
  }
  form.addEventListener('submit',async e=>{e.preventDefault();err.textContent='';const token=$('[data-ops-token]').value.trim();try{await load(token);}catch(e){err.textContent=e.status===401?'Invalid Operations token.':'Operations data could not be loaded.';}});
  const saved=sessionStorage.getItem('pd_ops_token');if(saved) load(saved).catch(()=>sessionStorage.removeItem('pd_ops_token'));
})();