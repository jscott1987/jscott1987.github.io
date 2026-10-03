import { sql, json } from './_lib/db.js';
import crypto from 'node:crypto';

function safeEqual(a,b){
  if(!a||!b) return false;
  const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}

export default async function handler(req,res){
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
  const auth=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!safeEqual(auth,process.env.OPERATIONS_TOKEN)) return json(res,401,{error:'unauthorized'});
  try{
    const db=sql();
    const [eventCounts,leadCounts,recentLeads]=await Promise.all([
      db`select event_name,count(*)::int as count from pd_events where occurred_at>=now()-interval '30 days' group by event_name order by count desc`,
      db`select status,count(*)::int as count from pd_leads where created_at>=now()-interval '30 days' group by status`,
      db`select lead_id,created_at,name,phone,email,breed,puppy_name,timing,source_path,status from pd_leads order by created_at desc limit 50`
    ]);
    return json(res,200,{generated_at:new Date().toISOString(),events:eventCounts,leads:leadCounts,recent_leads:recentLeads});
  }catch(e){console.error(e);return json(res,500,{error:'operations_unavailable'});}
}
