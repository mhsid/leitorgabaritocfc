# Confere — leitor de gabaritos

Aplicativo estático para celular, pronto para GitHub Pages. Sem servidor, cadastro, bibliotecas remotas ou envio de fotos. O código funciona inteiramente no navegador.

## Publicar no GitHub Pages

1. Crie um repositório e envie **o conteúdo desta pasta**, com `index.html` na raiz. Não envie o ZIP fechado. Inclua a pasta `assets`.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, selecione a branch **main**, pasta **/(root)** e salve.
4. Aguarde o endereço exibido pelo GitHub. Abra esse endereço HTTPS no navegador do celular.
5. Em **Preparar**, importe o arquivo separado `estudantes-9ano-IMPORTAR.json`.

A lista de estudantes e os backups são arquivos privados de uso local. Não os inclua no repositório. O pacote público não contém os nomes.

Documentação: [publicação no GitHub Pages](https://docs.github.com/en/pages) e [HTTPS no Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## Primeira correção

1. Importe a lista: 76 estudantes, sendo 26 no 9º A, 31 no 9º B e 19 no 9º C.
2. Selecione turma, estudante, inglês ou espanhol e o cartão do dia.
3. Abra a câmera e capture a foto. Também é possível fotografar/selecionar uma imagem com o seletor de arquivo.
4. Fotografe de perto a **grade inteira**, na posição vertical, com os seis blocos visíveis. A folha deve estar plana, sem sombras, sem brilho e com as bolinhas preenchidas a caneta escura.
5. Toque no centro de quatro bolinhas, na ordem indicada. Use o controle de ampliação e role a imagem para posicionar com precisão:
   - A da primeira questão (canto superior esquerdo).
   - E da primeira questão da última coluna (canto superior direito).
   - E da última questão (canto inferior direito).
   - A da última questão da primeira coluna (canto inferior esquerdo).
6. Toque em **Ler marcações**. Confira a posição dos círculos sobre a imagem e revise as 90 respostas. Se os círculos não coincidirem com as bolinhas, desfaça o alinhamento e leia novamente.
7. Corrija qualquer leitura divergente, marque que conferiu as respostas e salve.
8. Selecione o outro dia e repita; depois avance ao próximo estudante.
9. Em **Resultados**, filtre uma turma ou mantenha todas, baixe o PDF e uma cópia de segurança.

A revisão é obrigatória. Os destaques ajudam a encontrar dúvidas, mas não substituem conferir o cartão inteiro. É possível usar **Preencher respostas manualmente** para inserir ou revisar um cartão salvo.

## Modelo e numeração

O leitor usa o modelo enviado: **6 colunas, 15 questões por coluna e alternativas A–E**. A ordem é de cima para baixo em cada coluna, avançando da esquerda para a direita.

O segundo cartão foi considerado com a **mesma disposição física** do primeiro. O aplicativo interpreta suas posições como questões 91–180. Se o segundo cartão usar outro desenho, será necessário adaptar as coordenadas antes de utilizá-lo. Se você imprimir o modelo 1–90 duas vezes, selecione o 2º dia para a segunda folha: A1/E76/E90/A15 impressos corresponderão a A91/E166/E180/A105 no sistema. Identifique as folhas para não trocar o dia.

Não há reconhecimento automático do nome nem do dia da prova: você os seleciona antes da foto. A leitura é assistida por quatro pontos de alinhamento, não uma detecção totalmente automática da folha.

## Gabarito e resultados

As 180 respostas foram transcritas das duas fotos fornecidas:

- Linguagens: 1–45; questões 1–5 usam o idioma selecionado por estudante.
- Ciências Humanas: 46–90.
- Ciências da Natureza: 91–135.
- Matemática: 136–180.

Inglês 1–5: D, A, D, D, B. Espanhol 1–5: C, A, D, E, A.

O gabarito inteiro está visível em **Preparar** para conferência. Cada acerto vale uma unidade; branco e dupla não pontuam. O resultado é quantidade de acertos, sem cálculo de TRI. Um cartão ausente aparece como pendente, nunca como zero acertos. Totais parciais mostram o denominador das questões efetivamente lidas, por exemplo 62/90.

## Dados e recuperação

- Fotos ficam só na memória da página e são descartadas ao salvar ou descartar a leitura.
- Nomes, idioma, respostas e resultados são gravados em `localStorage`, no navegador e dispositivo usados.
- Não há sincronização entre aparelhos nem armazenamento em nuvem.
- Limpar dados do navegador, mudar a URL do site ou usar navegação privada pode fazer os dados desaparecerem ou ficarem inacessíveis.
- O PDF é o relatório final. Para **retomar** o trabalho em outro celular ou navegador, baixe também a **cópia de segurança JSON** e use **Preparar → Restaurar cópia**.
- Não há cache offline do aplicativo. Para reabri-lo pelo GitHub Pages, mantenha conexão disponível. A leitura e a geração do PDF, depois que a página carrega, são locais.

## Câmera e compatibilidade

O botão de câmera usa `getUserMedia`, que requer HTTPS (ou localhost) e permissão do usuário. Se o acesso for negado ou o navegador não suportar a função, utilize o seletor de fotografia. Imagens JPG, PNG e WebP são aceitas conforme o navegador; se uma imagem HEIC não abrir, fotografe novamente ou converta para JPG.

[Requisitos da API de câmera](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Validação realizada e limites

- Testes automatizados de pontuação completa/parcial, idiomas, limites de área, branco, dupla e baixa confiança.
- Teste de transformação de perspectiva e leitura de 90 respostas em imagem sintética.
- Modelo original enviado: 90 posições identificadas como em branco.
- Mesmo modelo preenchido artificialmente: 90/90 resultados esperados, incluindo branco e dupla.
- PDF de teste de duas páginas validado com um leitor de PDF; primeira página inspecionada visualmente.
- **Ainda não validado com fotografias reais de cartões preenchidos, câmera física de celular ou teste visual completo da interface.** O ambiente de execução bloqueou a prévia local. Faça um teste com cartões de respostas conhecidas no aparelho que será usado, compare as 180 respostas e ajuste a captura antes de usar na correção da turma.

O preenchimento fraco, a sombra, o desfoque, a distorção da lente e a folha curva podem provocar erros. A transformação corrige perspectiva de uma superfície plana, mas não desamassa papel nem corrige curvatura. O sistema usa intensidade das bolinhas, não IA/OCR nem um serviço externo.

## Manutenção

O site já está pronto, sem instalação ou compilação para publicar. `bundle.js` é a versão entregue ao navegador; `app.js` contém a interface e `core.js` a leitura, a pontuação e a geração de PDF.

Se editar `app.js` ou `core.js`, execute `node build.mjs` e publique também o `bundle.js` atualizado. Para testar a lógica com Node.js: `npm test`. O código usa somente APIs nativas.
