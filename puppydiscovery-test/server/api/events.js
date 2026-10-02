import { sql, json, readJson } from './_lib/db.js';

const allowed=new Set([
  'page_view','phone_click','sms_click','outbound_noble_click',
  'puppy_click','puppy_view','find_my_puppy_start','lead_submit'
]);

export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'method_not_allowed'});
  try{
    const body=await readJson(req);
    if(!allowed.has(body.event)) return json(res,400,{error:'invalid_event'});
    if(typeof body.event_id!=='string'||body.event_id.length>100) return json(res,400,{error:'invalid_event_id'});
    if(typeof body.anonymous_id!=='string'||body.anonymous_id.length>100) return json(res,400,{error:'invalid_anonymous_id'});
    const occurredAt=body.occurred_at && !Number.isNaN(Date.parse(body.occurred_at))?body.occurred_at:new Date().toISOString();
    const path=typeof body.path==='string'?body.path.slice(0,500):'/';
    const title=typeof body.title==='string'?body.title.slice(0,300):null;
    const props=body.properties&&typeof body.properties==='object'?body.properties:{};
    const attribution=body.attribution&&typeof body.attribution==='object'?body.attribution:{};
    const db=sql();
    await db`
      insert into pd_events (event_id,event_name,anonymous_id,occurred_at,path,title,properties,attribution)
      values (${body.event_id},${body.event},${body.anonymous_id},${occurredAt},${path},${title},${db.json(props)},${db.json(attribution)})
      on conflict (event_id) do nothing
    `;
    return json(res,202,{ok:true});
  }catch(e){
    if(String(e.message)==='PAYLOAD_TOO_LARGE') return json(res,413,{error:'payload_too_large'});
    console.error(e);
    return json(res,500,{error:'event_store_unavailable'});
  }
}
