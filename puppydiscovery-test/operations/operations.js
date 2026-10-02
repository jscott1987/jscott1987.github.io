(async function(){
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  async function get(p){const r=await fetch('../'+p,{cache:'no-store'});if(!r.ok) throw new Error(p+' '+r.status);return r.json();}
  let inventory={puppies:[]},status={status:'unknown'};
  try{[inventory,status]=await Promise.all([get('data/puppies.json'),get('data/sync-status.json')]);}catch(e){status={status:'error',message:String(e)}}
  const pups=Array.isArray(inventory.puppies)?inventory.puppies:[];
  const available=pups.filter(p=>p.status==='available');
  const unavailable=pups.filter(p=>p.status==='unavailable');
  const breeds={}; for(const p of available){const b=p.breed||'Unknown';breeds[b]=(breeds[b]||0)+1;}
  $('[data-kpi="available"]').textContent=available.length;
  $('[data-kpi="breeds"]').textContent=Object.keys(breeds).length;
  $('[data-kpi="unavailable"]').textContent=unavailable.length;
  $('[data-kpi="sync"]').textContent=status.status||'unknown';
  $('[data-sync-detail]').innerHTML='<span class="status-dot '+(status.status==='success'?'status-success':'status-error')+'"></span>'+esc(status.message||'No sync detail')+(status.last_run?'<br><small>Last run: '+esc(status.last_run)+'</small>':'');
  const rows=pups.map(p=>'<tr><td>'+esc(p.name||'Unnamed')+'</td><td>'+esc(p.breed||'')+'</td><td>'+esc(p.sex||'')+'</td><td>'+esc(p.status||'')+'</td><td>'+esc(p.last_seen_at||p.last_missing_at||'')+'</td><td>'+(p.source_url?'<a href="'+esc(p.source_url)+'">Source</a>':'')+'</td></tr>').join('');
  $('[data-puppy-rows]').innerHTML=rows||'<tr><td colspan="6">No verified puppy records have been published yet.</td></tr>';
  const breedRows=Object.entries(breeds).sort((a,b)=>b[1]-a[1]).map(([b,n])=>'<tr><td>'+esc(b)+'</td><td>'+n+'</td></tr>').join('');
  $('[data-breed-rows]').innerHTML=breedRows||'<tr><td colspan="2">No verified breed counts yet.</td></tr>';
})();