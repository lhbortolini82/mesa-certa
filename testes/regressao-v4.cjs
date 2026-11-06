'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'dados/colecao.json'),'utf8'));
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const fields=['diversao','facilidade','estrategia','interacao','rejogabilidade','empolgacao','caos','ritmo'];
assert.equal(data.jogos.length,40);assert.equal(new Set(data.jogos.map(g=>g.id)).size,40);
for(const g of data.jogos){assert.deepEqual(Object.keys(g.minhasNotas).sort(),fields.slice().sort());for(const v of Object.values(g.minhasNotas))assert.ok(Number.isInteger(v)&&v>=1&&v<=5);}
for(const p of data.perfis)assert.equal(Object.values(data.modeloNotas.pesosPorPerfil[p.id]).reduce((a,b)=>a+b,0),100);
const embedded=JSON.parse(html.match(/<script id="embeddedData" type="application\/json">([\s\S]*?)<\/script>/)[1]);assert.deepEqual(embedded,data);
function engine(saved=null){
 const storage={'mesa-certa-avaliacoes-v2':saved?JSON.stringify(saved):null};
 const el={textContent:'',classList:{add(){},remove(){}}};
 const ctx=vm.createContext({URLSearchParams,document:{getElementById:id=>id==='embeddedData'?{textContent:JSON.stringify(data)}:el},window:{location:{search:'?jogadores=3.5'}},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},setTimeout:()=>0,clearTimeout(){}});
 const cut=script.slice(0,script.indexOf("    document.addEventListener('click'"));
 vm.runInContext(cut+`;render=()=>{};renderRatingEditor=()=>{};globalThis.api={state,rankAll,getBest,baseFit,ownRatings,gameScenarioFits,backupData,importRatings,readPersonal,get personal(){return personal}};})();`,ctx);
 return ctx.api;
}
(async()=>{
 const api=engine();assert.equal(api.personal.peso,60);assert.equal(api.state.pessoas,4);
 const csv=fs.readFileSync(path.join(__dirname,'TOP10_35_MESAS.csv'),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1);
 let scenarios=0,cells=0;
 for(const p of data.perfis)for(let n=2;n<=8;n++){
  const expected=csv.map(row=>row.split(';')).filter(r=>r[0]===p.id&&Number(r[1])===n).sort((a,b)=>Number(a[2])-Number(b[2])).map(r=>r[3]);
  assert.deepEqual(Array.from(api.rankAll(p.id,n,true).slice(0,10),g=>g.nome),expected,`CSV ${p.id}/${n}`);
  for(const variants of [false,true]){
   const ranks=api.rankAll(p.id,n,variants);assert.equal(new Set(ranks.map(g=>g.id)).size,ranks.length);
   for(let i=0;i<ranks.length;i++){const g=ranks[i];assert.notEqual(g.classificacao[p.id][n],'—');assert.ok(variants||!g.selectionStatus.startsWith('VAR.'));assert.ok(Number.isFinite(g.score));if(i)assert.ok(ranks[i-1].score>=g.score);}
   Object.assign(api.state,{perfil:p.id,pessoas:n,variantes:variants});assert.ok(api.getBest().length<=10);scenarios++;
  }
 }
 for(const g of data.jogos){const fits=api.gameScenarioFits(g);assert.equal(fits.length,35);for(const c of fits){const rank=api.rankAll(c.perfil,c.pessoas,api.state.variantes).findIndex(x=>x.id===g.id);assert.equal(c.rank,rank<0?null:rank+1);cells++;}}
 const key='skull-king|familia|geral',entry={notas:{diversao:5,ritmo:2},observacao:'Registro anterior V3',atualizadaEm:'2026-11-01'};
 for(const peso of [0,20,50,80]){const a=engine({peso,avaliacoes:{[key]:entry}});assert.equal(a.personal.peso,peso);assert.equal(JSON.stringify(a.personal.avaliacoes[key]),JSON.stringify(entry));}
 const a=engine({peso:50,avaliacoes:{[key]:entry}}),g=data.jogos.find(g=>g.id==='skull-king');
 const ranked=a.rankAll('familia',4,true).find(x=>x.id===g.id);assert.ok(Math.abs(ranked.personalIndex-(ranked.fitBase*.65+ranked.my.score*.35))<1e-9);
 const backup=JSON.stringify(a.backupData());a.personal.avaliacoes={};await a.importRatings({size:backup.length,text:async()=>backup});assert.equal(a.personal.avaliacoes[key].notas.diversao,5);assert.equal(a.readPersonal().peso,50);
 const before=JSON.stringify(a.personal);await a.importRatings({size:20,text:async()=>'{invalido'});assert.equal(JSON.stringify(a.personal),before);
 const synthetic={...g,minhasNotas:{...g.minhasNotas,estrategia:2}};
 assert.ok(api.baseFit(synthetic,'familia')>api.baseFit({...synthetic,minhasNotas:{...synthetic.minhasNotas,estrategia:5}},'familia'));
 assert.ok(api.baseFit({...synthetic,minhasNotas:{...synthetic.minhasNotas,estrategia:5}},'estrategicos')>api.baseFit(synthetic,'estrategicos'));
 console.log(`OK: 320 notas; 35 rankings iguais ao CSV; ${scenarios} cenários; ${cells} células inversas; pesos V3 preservados; combinação contextual 65/35; roundtrip JSON; intensidade por perfil.`);
})().catch(err=>{console.error(err);process.exitCode=1});
