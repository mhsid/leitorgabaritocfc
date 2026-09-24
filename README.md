# Confere 2.2 — cartão oficial de 90 questões

## Pronto para usar

O desenho oficial enviado em 24/09 já está incorporado: quatro blocos com **24, 24, 24 e 18 questões**, lidos de cima para baixo, da esquerda para a direita. Não é necessário cadastrar novamente esse cartão nem marcar pontos na fotografia.

O leitor aceita folha colorida ou impressa em preto e branco, com preenchimentos escuros a caneta azul ou preta. Questões sem preenchimento são identificadas como **Em branco** e não interrompem a leitura; na correção, valem zero acertos. Duplas e marcações incertas são destacadas para conferência.

## Atualizar no GitHub Pages

1. Baixe uma cópia de segurança na aba Resultados do site atual.
2. Extraia o ZIP e substitua os arquivos do repositório pelo conteúdo da pasta extraída, mantendo `index.html` na raiz. Inclua `auto.js` e o novo `bundle.js`.
3. Aguarde a publicação do GitHub Pages e recarregue o site no celular. Confirme **v2.2** no cabeçalho.
4. Mantenha o mesmo navegador e endereço para conservar os registros locais. Backups das versões anteriores são aceitos.

Para a primeira publicação: Settings → Pages → Deploy from a branch → main → /(root). Abra a URL HTTPS fornecida pelo GitHub. Importe separadamente `estudantes-9ano-IMPORTAR.json` na aba Preparar, sem publicar esse arquivo no repositório.

O pacote não contém nomes da lista nem as fotos pessoais fornecidas. O modelo embutido guarda somente coordenadas de bolinhas.

## Corrigir

1. Selecione turma, estudante, língua estrangeira e dia.
2. Fotografe a folha inteira: quatro quadrados pretos nos cantos, com os três quadrados no alto à esquerda. Mantenha a folha plana, nítida e sem sombras fortes.
3. A leitura inicia automaticamente após a captura. Use o seletor de imagem se preferir uma foto já tirada.
4. Confira a sobreposição na foto e as respostas. Ajuste qualquer divergência, confirme a revisão e salve o cartão.
5. Repita no outro dia. Baixe o relatório PDF e uma cópia de segurança em Resultados.

O desenho fornecido é do **1º dia**. Se o 2º dia usar a mesma disposição, o sistema interpreta suas 90 posições como questões 91–180. Se o desenho mudar, cadastre o cartão completo em branco desse dia em Preparar.

Caso já tenha cadastrado um modelo diferente, ele continua tendo prioridade para não perder sua configuração. Para voltar ao padrão, selecione o dia em Preparar e clique em **Usar modelo oficial neste dia**. Isso não modifica os resultados salvos.

O exemplo anterior de 40 questões permanece disponível para teste de leitura, sem possibilidade de salvá-lo como uma prova de 90.

## Respostas corretas e estudantes

A nova imagem define a disposição do cartão, não as respostas corretas. Foram preservados os gabaritos das duas fotos originais e a lista das turmas de 9º ano, independentemente da turma ou do nome impressos no exemplo.

- Linguagens: 1–45, com inglês/espanhol nas questões 1–5.
- Ciências Humanas: 46–90.
- Ciências da Natureza: 91–135.
- Matemática: 136–180.

Confira o gabarito na aba Preparar. O relatório contém quantidade de acertos, sem cálculo de TRI. Um cartão ausente fica pendente, nunca é convertido em zero. O nome, a matrícula e o QR code não são usados para selecionar estudante ou idioma: essas escolhas são feitas na tela.

## Dados

Fotos são processadas em memória e descartadas ao salvar ou descartar a leitura. Respostas, estudantes e modelos personalizados ficam no armazenamento local deste navegador. Não há envio de dados ao servidor, sincronização entre aparelhos ou garantia de funcionamento offline após fechar a página.

Limpar os dados do navegador pode apagar os registros. Use a cópia JSON para restaurar ou transferir o trabalho; o PDF serve como relatório. A câmera requer HTTPS e permissão do usuário.

## Validação desta versão

- Cartão oficial original enviado: 90 posições localizadas e 90 respostas em branco.
- Versão em tons de cinza do cartão oficial: 90/90 posições em branco reconhecidas.
- Cartão oficial com preenchimentos artificiais pretos, brancos nas mudanças de bloco e uma dupla: 90/90 resultados esperados.
- Cartão oficial em cinza com preenchimentos artificiais azuis, perspectiva, sombra e leve desfoque simulados: 90/90 resultados esperados.
- Ordem dos blocos 24/24/24/18 e pontuação dos dois dias verificadas.
- 13 testes automatizados passaram, incluindo leitura em cinza, caneta azul, branco, dupla, validação de modelo e contagem por área.
- A foto real do cartão anterior, extraída da captura de tela de erro, continua passando: 40/40 posições conferidas, incluindo questão 34 em branco.

Ainda não há teste com fotografia física do cartão oficial de 90 questões preenchido, nem validação visual completa no celular. Testes com preenchimentos artificiais não medem a precisão em condições reais. Faça a primeira leitura com respostas conhecidas e confira todas as respostas antes de salvar. Desfoque, cantos cortados, papel curvado e preenchimento muito claro podem exigir nova captura.

## Manutenção

Site estático, sem bibliotecas externas. `auto.js` contém detecção, leitura e geometria oficial; `core.js`, pontuação/PDF; `app.js`, interface; `bundle.js`, código entregue ao navegador. Após alterações: `node build.mjs`. Testes: `npm test`.
