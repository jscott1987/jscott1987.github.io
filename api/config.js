import { json } from './_lib/db.js';

export default async function handler(req,res){
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
  res.setHeader('Cache-Control','public, max-age=300, s-maxage=300');
  return json(res,200,{
    ga4_measurement_id: process.env.GA4_MEASUREMENT_ID || null
  });
}
