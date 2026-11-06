// Executar na pasta do projeto: node scripts/sincronizar-dados.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'dados/colecao.json'), 'utf8'));
if (!Array.isArray(data.jogos) || !data.jogos.length || !Array.isArray(data.perfis) || !data.escolhasRapidas) throw new Error('Estrutura da coleção inválida');
if (new Set(data.jogos.map(g => g.id)).size !== data.jogos.length) throw new Error('IDs duplicados');
for (const p of data.perfis) for (let n=2;n<=8;n++) {
  for (const g of data.jogos) if (!g.classificacao?.[p.id]?.[n]) throw new Error(`Classificação ausente: ${g.id}/${p.id}/${n}`);
  const names = data.escolhasRapidas[p.id]?.[n] || [];
  if (names.length > 4) throw new Error('Use até quatro destaques por mesa');
  for (const name of names) if (!data.jogos.some(g=>g.nome===name)) throw new Error(`Destaque inexistente: ${name}`);
}
const file = path.join(root, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const re = /(<script id="embeddedData" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error('Bloco de dados offline não encontrado');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
fs.writeFileSync(file, html.replace(re, (_, start, end) => start + json + end));
console.log(`Dados validados e cópia offline sincronizada: ${data.jogos.length} jogos.`);
