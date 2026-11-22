const fs=require('fs'),cp=require('child_process');
const base=process.env.BASE_SHA;
if(!base)throw Error('BASE_SHA required');
const groups=[['js/asset-manifest.js'],['js/town-battle.js'],['js/webp-redirect.js'],['battle-field.html'],['js/story-data.js']];
for(const files of groups){
 const saved=new Map(files.map(f=>[f,fs.readFileSync(f)]));
 try{
  for(const f of files)fs.writeFileSync(f,cp.execFileSync('git',['show',base+':'+f],{maxBuffer:16*1024*1024}));
  const r=cp.spawnSync(process.execPath,['tools/test-field-edit.cjs'],{encoding:'utf8',timeout:100000,maxBuffer:2*1024*1024});
  console.log('FIELD_DIAG:'+JSON.stringify({files,status:r.status,output:(r.stdout||'').split('\n').filter(x=>/dragging a fighter|failed|all passed/.test(x)),error:r.error?.code}));
 }finally{for(const [f,s]of saved)fs.writeFileSync(f,s)}
}
