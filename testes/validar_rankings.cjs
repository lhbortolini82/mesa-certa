'use strict';
// Executar na raiz do site: node testes/validar_rankings.cjs
const fs=require('fs'), vm=require('vm'),assert=require('assert'), path=require('path');
const root=path.resolve(__dirname,'..');
const h=fs.readFileSync(path.join(root,'index.html'),'utf8');
const d=JSON.parse(fs.readFileSync(path.join(root,'dados','colecao.json'),'utf8'));
const dataMatch=h.match(/<script id="embeddedData" type="application\/json">([\s\S]*?)<\/script>/);
assert(dataMatch && JSON.stringify(JSON.parse(dataMatch[1]))===JSON.stringify(d),'Dados embutidos e externos divergentes');
const i=h.indexOf('    const allowedProfiles'),j=h.indexOf('    function getSupport(',i);
assert(i>0 && j>i,'Motor do ranking V4 não localizado');
const js=`const DATA=${JSON.stringify(d)};const params=new URLSearchParams(''); ${h.slice(i,j)};({state,personal,rankAll,baseFit,effectiveStatus})`;
const x=vm.runInNewContext(js,{URLSearchParams,localStorage:{getItem:()=>null},document:{}},{timeout:30000});
assert(d.jogos.length===40);assert(d.jogos.every(g=>Object.values(g.minhasNotas||{}).length===8));
assert(x.personal.peso===60);
for(const p of d.perfis){for(let n=2;n<=8;n++){
 const r=x.rankAll(p.id,n,true), noVariant=x.rankAll(p.id,n,false);
 assert(r.length>=1 && r.length<=40,`${p.id} ${n}: opções inválidas`);
 assert(new Set(r.map(g=>g.id)).size===r.length,`${p.id} ${n}: duplicatas`);
 assert(r.every(g=>g.classificacao[p.id][String(n)]!=='—'),`${p.id} ${n}: quantidade incompatível`);
 assert(noVariant.every(g=>!g.selectionStatus.startsWith('VAR.')),`${p.id} ${n}: variante não desabilitada`);
 assert(!r.some(g=>['Jaipur','Flip 7','Rebel Princess','Trio','Claim 2'].includes(g.nome)));
}}
assert(x.rankAll('casais',2)[0].nome==='Claim: Edição Limitada');
assert(x.rankAll('familia',4)[0].nome==='Skull King');
assert(x.rankAll('churrasco',4)[0].nome==='Magical Athlete (2025)');
assert(x.effectiveStatus(d.jogos.find(g=>g.id==='claim-edicao-limitada'),'churrasco',2)==='SITUACIONAL');
const old=x.personal.peso;x.personal.peso=0;const editorial=x.rankAll('casuais',4).slice(0,8).map(x=>x.nome);
x.personal.peso=80;const pessoal=x.rankAll('casuais',4).slice(0,8).map(x=>x.nome);x.personal.peso=old;
assert.notDeepStrictEqual(editorial,pessoal,'Peso pessoal não alterou ranking');
console.log('OK — 40 jogos; 320 notas; 35 mesas; filtros de variantes; pesos 0–80%; dados embutidos sincronizados.');
