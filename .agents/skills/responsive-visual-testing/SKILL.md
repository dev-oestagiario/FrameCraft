---
name: responsive-visual-testing
description: Depuração visual da aplicação e testes regressivos dos principais fluxos em resoluções diversas.
---
# Visual QA
Antes de concluir qualquer mudança visual:
1. Verificar: 360×740, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080.
2. Testar criação, seleção de texto, edição numérica e textual, movimento, zoom, exportar PNG/WebP/JSON e importar JSON.
3. Usar Playwright (quando instalado) para screenshots; checar console e `scrollWidth <= clientWidth` da página.
4. Verificar se o canvas amplia sem cortar a origem, e se barra de ferramentas permanece acessível em mobile.
5. Cobrir estados: chave ausente, chave inválida, modelo vazio, modelo indisponível, quota 429, JSON inválido e sucesso.
6. Revisar texto cortado, overlay sobre botão, hover, focus, contraste e modais com teclado.
7. Reportar testes que não executaram; nunca declarar screenshot/teste realizado sem navegador disponível.
