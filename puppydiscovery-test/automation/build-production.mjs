import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(process.cwd(),'puppydiscovery-test');
const OUT=path.resolve(process.cwd(),'puppydiscovery-dist');

function rm(p){ if(fs.existsSync(p)) fs.rmSync(p,{recursive:true,force:true}); }
function copy(src,dst){
  const stat=fs.statSync(src);
  if(stat.isDirectory()){
    fs.mkdirSync(dst,{recursive:true});
    for(const name of fs.readdirSync(src)){
      if(['automation','server','.DS_Store'].includes(name)) continue;
      copy(path.join(src,name),path.join(dst,name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  let buf=fs.readFileSync(src);
  if(src.endsWith('.html')){
    let html=buf.toString('utf8');
    const isOperations = src.includes(path.sep + 'operations' + path.sep);
    if(!isOperations) html=html.replace(/<meta name="robots" content="noindex,nofollow">/g,'');
    if(!html.includes('site.js')){
      const rel=path.relative(path.dirname(src),ROOT).split(path.sep).filter(Boolean);
      const prefix=rel.length? '../'.repeat(rel.length):'./';
      html=html.replace('</body>',\`<script src="\${prefix}site.js"></script></body>\`);
    }
    buf=Buffer.from(html);
  }
  fs.writeFileSync(dst,buf);
}

rm(OUT);
fs.mkdirSync(OUT,{recursive:true});
for(const name of fs.readdirSync(ROOT)){
  if(['automation','server','production-robots.txt','SEO-DEPLOYMENT-NOTE.txt'].includes(name)) continue;
  copy(path.join(ROOT,name),path.join(OUT,name));
}
if(fs.existsSync(path.join(ROOT,'production-robots.txt'))){
  fs.copyFileSync(path.join(ROOT,'production-robots.txt'),path.join(OUT,'robots.txt'));
}
const SERVER=path.join(ROOT,'server');
for(const name of ['api','package.json','vercel.json']){
  const src=path.join(SERVER,name);
  if(fs.existsSync(src)) copy(src,path.join(OUT,name));
}
console.log('Built production bundle at',OUT);
