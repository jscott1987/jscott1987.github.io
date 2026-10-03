import postgres from 'postgres';

let client;

export function sql() {
  const url=process.env.DATABASE_URL;
  if(!url) throw new Error('DATABASE_URL is not configured');
  if(!client) client=postgres(url,{ssl:'require',max:3,idle_timeout:20,connect_timeout:10});
  return client;
}

export function json(res,status,body){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export async function readJson(req,maxBytes=32768){
  let size=0,parts=[];
  for await (const chunk of req){
    size+=chunk.length;
    if(size>maxBytes) throw new Error('PAYLOAD_TOO_LARGE');
    parts.push(chunk);
  }
  const raw=Buffer.concat(parts).toString('utf8');
  return raw?JSON.parse(raw):{};
}
