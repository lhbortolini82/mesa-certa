# Mesa Certa — Minha Coleção de Jogos

Site estático em português, baseado exclusivamente no pacote V3: 40 jogos-base, cinco perfis, filtros de 2 a 8 pessoas, até dez recomendações por mesa, consulta por jogo e avaliações pessoais. HTML, CSS e JavaScript sem dependências externas, banco de dados, login ou serviço pago.

## Arquivos e fonte dos dados

- `index.html`: interface, estilos, lógica e cópia dos dados para uso offline.
- `dados/colecao.json`: fonte principal da coleção, classificações, destaques, variantes e regras da casa.
- `scripts/sincronizar-dados.cjs`: valida a estrutura básica e atualiza a cópia offline a partir do JSON; usa apenas Node.js, sem instalar pacotes.
- `.nojekyll`: publicação direta dos arquivos estáticos no GitHub Pages.

Em HTTP(S), o site busca `./dados/colecao.json`. Sem rede, usa os dados embutidos no HTML. Após editar a coleção, execute `node scripts/sincronizar-dados.cjs` para manter ambas as cópias iguais. O site não precisa de Node.js para funcionar no GitHub Pages.

## Adicionar jogos

No array `jogos` do JSON, copie a estrutura de um jogo e preencha `id` (único e estável), `nome`, `jogadores`, `afinidade`, `classificacao`, `observacao`, `fonte`, `variante` e `ajustes`. Complete a classificação para cada perfil e cada quantidade de 2 a 8. As avaliações são vinculadas ao ID.

Classificações reconhecidas: `PRIORIDADE`, `BOA`, `SITUACIONAL`, `POUCO INDICADO`, `—`, `VAR. comunidade` e `VAR. teste`. Use `—` quando incompatível. A descrição textual de quantidade não define elegibilidade: quem controla isso é `classificacao`.

Se apropriado, inclua o nome exato em `escolhasRapidas`. Atualize `versao` e `historico`; sincronize os dados e teste.

## Retirar jogos

Remova o objeto de `jogos` e as referências ao nome em `escolhasRapidas`. Registre no histórico. Exporte as notas antes: avaliações de IDs removidos deixam de aparecer e são ignoradas numa importação enquanto o jogo estiver ausente. Não reutilize IDs para outros títulos.

## Alterar recomendações e rankings

Edite `classificacao` e `afinidade` do jogo e os destaques em `escolhasRapidas[perfil][quantidade]`. Os destaques são listas ordenadas de até quatro nomes exatos. Esses fatores geram a ordem editorial; não existe uma lista fixa de dez títulos para cada mesa.

O algoritmo original em `eligibleGames`/`rankAll`, no HTML, também contém ajustes específicos de alguns jogos. Foi preservado. As avaliações relevantes combinam-se com o índice editorial conforme o peso pessoal escolhido (0 a 80%). Sem notas relevantes, a ordem editorial é mantida. Jogos incompatíveis continuam excluídos; listas menores que dez são esperadas.

## Variantes e Skull King Familiar

Edite `variante`, `ajustes` e as classificações pertinentes no JSON. Variantes comunitárias ou experimentais devem continuar identificadas como não oficiais. As regras personalizadas estão em `regrasDaCasa.regras`. Não confunda regras da mesa com o regulamento da editora.

## Perfis e quantidades de jogadores

Nomes, ícones e descrições estão em `perfis`. Mantenha os IDs ao renomear perfis para preservar o vínculo com as notas. Para alterar recomendações de 2 a 8 pessoas, edite as chaves numéricas em `classificacao` e `escolhasRapidas`.

Adicionar/remover perfis ou ampliar o intervalo exige também revisar o HTML: `allowedProfiles`, `criterionWeights`, limites do estado, geração dos botões, matriz `gameScenarioFits`, escopos de avaliação e validação de importação. Revise ainda o script de sincronização e os textos da interface. Não basta mudar somente os rótulos do JSON.

## Preservar e importar avaliações pessoais

As notas ficam no `localStorage`, na chave `mesa-certa-avaliacoes-v2`, no navegador e origem em que foram registradas. **Não há sincronização automática entre dispositivos.** Atualizar o site mantendo a origem, os IDs e a chave preserva as notas, desde que o navegador não apague seus dados.

1. No site antigo, clique em **Exportar minhas notas** e guarde o JSON em local privado.
2. Abra o site publicado no navegador desejado e clique em **Importar notas**.
3. Selecione o backup. A importação mescla registros e substitui os de mesmo jogo/perfil/quantidade, além de restaurar o peso das notas.

HTML local, prévia localhost e GitHub Pages são origens diferentes: notas não migram sozinhas. Navegação privada e limpeza do navegador podem apagá-las. A avaliação específica complementa/substitui os critérios preenchidos na avaliação geral do perfil. Critérios vazios são neutros.

Nunca envie backups pessoais ao repositório público. O `.gitignore` exclui o nome padrão exportado e `backups/`, mas backups renomeados também precisam ficar fora do repositório.

## Publicação inicial no GitHub Pages

Após autorização para tornar os arquivos públicos, crie o repositório público `mesa-certa` e envie estes arquivos para a branch `main`. Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, branch **main**, pasta **/(root)** e salve.

Essa configuração publica automaticamente a cada push na `main`, sem workflow personalizado. O endereço será `https://USUARIO.github.io/mesa-certa/`. Aguarde o deploy e teste o endereço real antes de considerar a publicação concluída.

[Documentação oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Publicar atualizações mantendo o endereço

Na cópia local do repositório:

```powershell
git pull --ff-only
# Edite dados/colecao.json e, quando necessário, index.html.
node scripts/sincronizar-dados.cjs
git diff
git add index.html dados/colecao.json README.md scripts .gitignore .nojekyll
git commit -m "Atualiza a coleção Mesa Certa"
git push origin main
```

Antes do commit, revise os arquivos para não incluir notas privadas ou credenciais. Mantenha o mesmo proprietário, nome do repositório e configuração do Pages para preservar o endereço. Confira o deploy em Actions/Settings → Pages e teste filtros, consulta por jogo e backup no site publicado. Se algo falhar, reverta o commit problemático com `git revert` e publique a correção.

Para uma edição simples pelo GitHub, altere os arquivos no navegador e faça commit na `main`; lembre-se de sincronizar o HTML offline também. Não altere rankings ou regras sem revisar a intenção da mudança.
