# Confere 2.1 — leitura automática de cartão SAS

## Correção de 24/09

A versão anterior dependia de contornos vermelhos e falhava em impressões em tons de cinza. Esta versão usa contraste local para identificar a grade e compensa variações de iluminação. Aceita tinta azul, recupera linhas com contornos parcialmente encobertos e não exige respostas preenchidas para localizar as questões. Branco continua sendo registrado como branco e vale zero acertos, sem interromper a leitura.

## O que mudou

A fotografia é alinhada automaticamente pelos quadrados pretos nos quatro cantos. Os três marcadores superiores à esquerda indicam a orientação. O leitor localiza as linhas de cinco bolinhas impressas e analisa seu preenchimento. Não é necessário tocar em pontos da imagem.

O aplicativo continua selecionando estudante, turma, idioma e dia antes da leitura, calculando acertos por área e total, guardando respostas no navegador e exportando PDF e backup. O nome, a matrícula e o QR code impressos não são reconhecidos nem usados para selecionar o estudante.

## Publicar ou atualizar no GitHub

Extraia o ZIP e envie seu conteúdo para a raiz do repositório, substituindo os arquivos anteriores. Inclua `auto.js` e o novo `bundle.js`. No GitHub Pages, use Settings → Pages → Deploy from a branch → main → /(root). Abra a URL HTTPS no celular.

Se o site já está no ar, mantenha o mesmo endereço para preservar os dados locais. Baixe um backup antes de atualizar. As cópias da versão anterior são aceitas. Depois da publicação, recarregue a página; em Preparar deverá aparecer “Modelo automático · cartão SAS”.

A lista `estudantes-9ano-IMPORTAR.json` continua separada: importe em Preparar se necessário, sem publicá-la no repositório. A captura de tela recebida contém nome e matrícula e não foi incluída no pacote público.

## Testar agora com o exemplo recebido

1. Selecione turma, estudante, idioma e dia.
2. Use “Fotografar ou escolher imagem” com a imagem do cartão SAS fornecido, ou fotografe uma impressão colorida ou em preto e branco com preenchimentos escuros a caneta azul ou preta.
3. Inclua a folha inteira e seus quatro cantos. Os três quadrados precisam ficar no alto à esquerda. Evite fundo preto, sombras fortes e papel curvado.
4. A leitura começa automaticamente. Se a foto estiver de lado, use “Girar foto”.
5. Confira as respostas detectadas. Azul indica as bolinhas localizadas; verde indica uma resposta selecionada. Respostas em branco, duplas ou incertas ficam destacadas.

**O exemplo tem 40 questões. Ele é lido como TESTE e não pode ser salvo nem pontuado como um cartão de 90.** Não foram inventadas as outras 50 posições. A prova impressa no exemplo é diferente do simulado de 180 questões cujas respostas foram enviadas anteriormente.

## Quando os cartões completos chegarem

Em Preparar, selecione o dia e carregue uma imagem nítida do cartão completo, com as 90 respostas em branco. Faça isso uma vez para cada dia. O aplicativo extrai automaticamente as posições; não é preciso marcar cantos. Apenas as coordenadas são salvas, sem fotografia, nome, matrícula ou QR code.

Na correção, fotografe cada cartão preenchido e revise antes de salvar. O leitor verifica a coincidência entre a grade e o modelo. Se não conseguir alinhar ou reconhecer a grade com segurança, pede outra foto em vez de preencher respostas inventadas.

Também existe detecção direta de 90 linhas sem modelo cadastrado, quando todas as bordas das bolinhas estão visíveis. Cadastrar a folha em branco é preferível, pois preenchimentos podem encobrir os círculos. O desenho completo ainda precisa ser validado quando fornecido: o cadastro não garante compatibilidade com qualquer organização de cartão.

## Padrão suportado nesta versão

- Folha SAS colorida ou em preto e branco com quatro marcadores de canto e três quadrados no alto à esquerda.
- Alternativas A–E em círculos e preenchimento escuro a caneta azul ou preta.
- Blocos com linhas regularmente espaçadas; leitura de cima para baixo em cada bloco, da esquerda para a direita.
- Grade de respostas na parte inferior da folha, conforme o exemplo. O algoritmo detecta os círculos, sem assumir seis colunas ou quinze questões por bloco.
- Não suporta cantos cortados, orientação de cabeça para baixo sem girar, layout arbitrário, folha dobrada ou marcações com cores claras.
- Não é detecção contínua em vídeo: a câmera captura uma foto e a leitura ocorre automaticamente em seguida.

## Gabarito e relatórios

As respostas corretas anteriores foram preservadas: Linguagens 1–45, Humanas 46–90, Natureza 91–135, Matemática 136–180. Inglês/espanhol altera 1–5 por estudante. A nova imagem é uma referência de cartão, não um novo gabarito de respostas.

Confira as respostas oficiais em Preparar antes de usar na prova. Se o gabarito de respostas mudar, ele também deverá ser atualizado. Branco e dupla contam como erro; cartão ausente fica pendente. O PDF mostra acertos brutos, não TRI.

## Armazenamento e câmera

Fotos são processadas em memória e descartadas ao salvar ou sair da leitura. Estudantes, respostas e modelos geométricos ficam em `localStorage` neste navegador. Nada é enviado a um servidor. O backup JSON permite continuar em outro aparelho; o PDF é o relatório. Limpar dados do navegador pode apagar o trabalho. Não há sincronização nem instalação offline.

A câmera exige HTTPS e permissão; o seletor de imagem é a alternativa. JPG, PNG e WebP funcionam conforme o navegador. O sistema não requer bibliotecas remotas.

## Testes realizados

- 12 testes automatizados de contagem, idiomas, leitura, modelo de 90 posições e rejeição de marcadores ausentes/posições inválidas.
- Imagem original recebida: 40 linhas identificadas automaticamente, todas em branco.
- Preenchimentos artificiais sobre a imagem recebida: 40/40 respostas esperadas, incluindo branco e dupla.
- Mesma imagem preenchida com perspectiva, gradiente de sombra e leve desfoque simulados: 40/40 respostas esperadas.
- Teste de cantos cortados: imagem rejeitada.
- Grade de 90 questões criada apenas para teste do algoritmo: cadastro e leitura aprovados. **Essa grade sintética não é o cartão oficial de 90 questões.**

A foto real visível na captura de tela de 24/09 foi recortada para retirar a interface e testada: 40/40 posições corresponderam à conferência visual, incluindo a questão 34 em branco. Câmera física, interface em celular e o cartão oficial de 90 questões ainda não foram validados. Os testes sintéticos não equivalem a uma taxa de precisão medida em uso real. Faça um teste com respostas conhecidas antes de corrigir a turma; confira todas as respostas antes de salvar.

## Código

`auto.js`: reconhecimento dos marcadores, correção de perspectiva, descoberta de grade e leitura automática. `core.js`: classificação, pontuação e PDF. `app.js`: interface. `bundle.js`: versão usada pelo navegador.

Após alterar o código: `node build.mjs`. Testes: `npm test`. Não há dependências para instalar. `tests/auto.test.js` gera uma folha anônima em memória; dados pessoais não integram os testes distribuídos.
