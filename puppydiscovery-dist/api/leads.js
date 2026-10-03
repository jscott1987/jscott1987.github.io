import { sql, json, readJson } from './_lib/db.js';
import crypto from 'node:crypto';

function clean(v,n=300){return typeof v==='string'?v.trim().slice(0,n):'';}
function validEmail(v){return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function validPhone(v){return !v || v.replace(/\D/g,'').length>=10;}

async function sendEmail(lead){
  if(!process.env.RESEND_API_KEY||!process.env.LEAD_EMAIL_TO) return {sent:false,reason:'not_configured'};
  const from=process.env.LEAD_EMAIL_FROM||'PuppyDiscovery <leads@puppydiscovery.com>';
  const lines=[
    'New PuppyDiscovery lead',
    '',
    'Name: '+(lead.name||''),
    'Phone: '+(lead.phone||''),
    'Email: '+(lead.email||''),
    'Breed: '+(lead.breed||''),
    'Puppy: '+(lead.puppy_name||''),
    'Timing: '+(lead.timing||''),
    'Source: '+(lead.source_path||''),
    'Notes: '+(lead.notes||'')
  ];
  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{authorization:'Bearer '+process.env.RESEND_API_KEY,'content-type':'application/json'},
    body:JSON.stringify({from,to:[process.env.LEAD_EMAIL_TO],subject:'New PuppyDiscovery lead'+(lead.breed?' · '+lead.breed:''),text:lines.join('\n')})
  });
  if(!r.ok) throw new Error('Resend '+r.status+' '+(await r.text()).slice(0,300));
  return {sent:true};
}

export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'method_not_allowed'});
  try{
    const body=await readJson(req);
    const lead={
      id:crypto.randomUUID(),
      created_at:new Date().toISOString(),
      name:clean(body.name,120),
      phone:clean(body.phone,40),
      email:clean(body.email,200).toLowerCase(),
      breed:clean(body.breed,160),
      puppy_key:clean(body.puppy_key,200),
      puppy_name:clean(body.puppy_name,160),
      timing:clean(body.timing,120),
      notes:clean(body.notes,2000),
      source_path:clean(body.source_path,500)||'/',
      anonymous_id:clean(body.anonymous_id,100),
      attribution:body.attribution&&typeof body.attribution==='object'?body.attribution:{}
    };
    if(!lead.phone&&!lead.email) return json(res,400,{error:'phone_or_email_required'});
    if(!validEmail(lead.email)||!validPhone(lead.phone)) return json(res,400,{error:'invalid_contact'});
    const db=sql();
    await db`
      insert into pd_leads (lead_id,created_at,name,phone,email,breed,puppy_key,puppy_name,timing,notes,source_path,anonymous_id,attribution,status)
      values (${lead.id},${lead.created_at},${lead.name||null},${lead.phone||null},${lead.email||null},${lead.breed||null},${lead.puppy_key||null},${lead.puppy_name||null},${lead.timing||null},${lead.notes||null},${lead.source_path},${lead.anonymous_id||null},${db.json(lead.attribution)},'new')
    `;
    let email={sent:false};
    try{email=await sendEmail(lead);}catch(err){console.error(err);email={sent:false,reason:'send_failed'};}
    return json(res,201,{ok:true,lead_id:lead.id,email_sent:email.sent});
  }catch(e){
    if(String(e.message)==='PAYLOAD_TOO_LARGE') return json(res,413,{error:'payload_too_large'});
    console.error(e);
    return json(res,500,{error:'lead_store_unavailable'});
  }
}
