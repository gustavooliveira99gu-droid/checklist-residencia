# Checklist Residência Médica

Aplicativo web (HTML + CSS + JavaScript puro) para gerenciar seus estudos para a residência médica. Roda 100% no navegador, salva tudo em `localStorage` e pode ser publicado gratuitamente no GitHub Pages.

## Arquivos do projeto

- `index.html`
- `style.css`
- `script.js`
- `README.md`

## 1. Criar o repositório no GitHub

1. Acesse [github.com/new](https://github.com/new).
2. Nome sugerido: `checklist-residencia`.
3. Deixe como **público** (necessário para o GitHub Pages gratuito).
4. Crie o repositório vazio (sem README, sem .gitignore).

## 2. Enviar os arquivos

No terminal, dentro da pasta do projeto:

```bash
git init
git add index.html style.css script.js README.md
git commit -m "Checklist Residência Médica"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/checklist-residencia.git
git push -u origin main
```

Envie **apenas** esses 4 arquivos (não é necessário nenhum outro).

## 3. Ativar o GitHub Pages

1. No repositório, vá em **Settings > Pages**.
2. Em "Source", escolha a branch `main` e a pasta `/root`.
3. Salve. Em alguns minutos o app estará disponível em:

```
https://SEU_USUARIO.github.io/checklist-residencia/
```

## 4. Onde colocar o Google OAuth Client ID

Abra `script.js` e procure no topo do arquivo por:

```js
const GOOGLE_CLIENT_ID = "COLE_SEU_CLIENT_ID_AQUI";
```

Substitua pelo Client ID gerado no passo 5. Sem isso, o app funciona normalmente (checklist, progresso, backup), mas o botão **Conectar Google Agenda** ficará inativo.

## 5. Como configurar o Google Calendar API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto novo (ou use um existente).
3. Vá em **APIs e Serviços > Biblioteca**, busque por **Google Calendar API** e clique em **Ativar**.
4. Vá em **APIs e Serviços > Tela de consentimento OAuth**:
   - Tipo de usuário: Externo.
   - Preencha nome do app, e-mail de suporte e e-mail de contato.
   - Em "Escopos", não é necessário adicionar nada manualmente.
   - Em "Usuários de teste", adicione seu próprio e-mail Google (enquanto o app não for verificado pelo Google).
5. Vá em **APIs e Serviços > Credenciais > Criar Credenciais > ID do cliente OAuth**:
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Nome: "Checklist Residência Médica".
   - **Não** preencha "URIs de redirecionamento" (não é necessário para este fluxo).
6. Copie o **Client ID** gerado e cole em `script.js` (passo 4).

## 6. Authorized JavaScript Origin

Depois que o GitHub Pages estiver ativo, volte na credencial OAuth criada (**Credenciais > seu Client ID > editar**) e em **Origens JavaScript autorizadas**, adicione exatamente:

```
https://SEU_USUARIO.github.io
```

(sem `/checklist-residencia` no final, apenas o domínio raiz). Salve.

Se for testar localmente antes de publicar, adicione também a origem local, por exemplo:

```
http://localhost:5500
```

## Observações importantes

- O app nunca armazena senha do Google — a autenticação usa o Google Identity Services (OAuth), e apenas um token de acesso temporário fica em memória durante o uso.
- O Client Secret **não** é usado neste projeto (fluxo 100% client-side, sem backend).
- Todos os dados (temas, especialidades, progresso, agendamentos) ficam salvos no `localStorage` do navegador. Use **Exportar Backup** periodicamente para não perder informações ao trocar de computador ou limpar o navegador.
- Para restaurar um backup, use **Importar Backup** nas Configurações e selecione o arquivo `.json` exportado anteriormente.
