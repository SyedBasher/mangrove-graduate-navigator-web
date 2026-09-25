import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root=process.argv[2] || '.';
const forbiddenPaths=[
  /^src\//,
  /^config\//,
  /^supabase\//,
  /^netlify\/functions\//,
  /^scripts\/audit-(?:free-engine|paid-report)/,
  /^scripts\/package-personalization-review\.mjs$/,
  /^scripts\/capture-report-visual-qa\.mjs$/,
  /^web\/report-qa(?:\.html|\.js)$/,
];
const rx = (...parts) => new RegExp(parts.join(''), 'i');
const sensitive=[
  ['private Gmail/Googlemail address',/[A-Z0-9._%+-]+@(?:gmail|googlemail)\.com/i],
  ['Supabase service-role secret',rx('SUPABASE_','(?:SERVICE_ROLE|SECRET)_KEY')],
  ['Supabase modern secret key literal',/sb_secret_[A-Za-z0-9_-]{16,}/],
  ['Mangrove upstream secret',/MANGROVE_UPSTREAM_KEY\s*[:=]/i],
  ['bKash server credential',rx('BKASH_','(?:PASSWORD|APP_SECRET|APP_KEY|USERNAME)')],
  ['Cloudflare API token variable',/CLOUDFLARE_API_TOKEN\s*[:=]/i],
  ['Turnstile secret',rx('TURNSTILE_','SECRET')],
  ['private key block',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['private scoring source marker',rx('CAREER_','WEIGHTS|capability_','weights|preference_','targets')],
];
const textExt=/\.(?:html?|js|mjs|cjs|css|json|md|txt|xml|yml|yaml|toml|svg)$/i;
const files=[];
function walk(dir){
  if(!existsSync(dir)) return;
  for(const name of readdirSync(dir)){
    if(name==='.git'||name==='node_modules'||name==='dist'||name==='build') continue;
    const full=join(dir,name);
    const rel=relative(root,full).replaceAll('\\','/');
    const st=statSync(full);
    if(st.isDirectory()) walk(full); else files.push(rel);
  }
}
walk(root);
const failures=[];
for(const path of files){
  for(const re of forbiddenPaths) if(re.test(path)) failures.push('forbidden private path: '+path);
  if(!textExt.test(path)) continue;
  const s=readFileSync(join(root,path),'utf8');
  for(const [name,re] of sensitive) if(re.test(s)) failures.push(name+': '+path);
}
if(failures.length){
  console.error('PUBLIC BOUNDARY AUDIT FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('PUBLIC BOUNDARY AUDIT PASS: '+files.length+' files checked');
