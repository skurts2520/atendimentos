# Meus Atendimentos

Sistema web simples para registrar atendimentos de manutenção de impressoras e PCs, com cadastro das empresas contratantes e histórico/contagem de atendimentos.

**Stack:** HTML + jQuery + Tailwind (CDN) + Supabase (banco e login). Sem build, é só abrir ou hospedar os arquivos estáticos.

## Modo demonstração (ver sem configurar nada)

Com `DEMO_MODE = true` no `config.js` (já vem assim), o sistema roda só no navegador, com dados de exemplo.
Login: **demo@demo.com** / **demo123**. Os dados ficam no localStorage daquele navegador.

Quando for usar de verdade, mude para `DEMO_MODE = false` e siga os passos abaixo.

## Como colocar para funcionar

1. **Supabase**
   - Crie uma conta em https://supabase.com e um projeto novo (plano gratuito).
   - Vá em *SQL Editor > New query*, cole o conteúdo de `supabase.sql` e clique em *Run*.
   - Vá em *Project Settings > API* e copie a **Project URL** e a chave **anon public**.
   - Em *Authentication > Providers > Email*, se não quiser confirmar e-mail, desative "Confirm email".

2. **Configuração**
   - Abra `config.js` e cole a URL e a anon key.

3. **Testar local**
   - Abra `index.html` no navegador (ou use a extensão Live Server do VS Code).
   - Clique em "Criar conta", depois entre com e-mail e senha.

4. **Git + hospedagem grátis (GitHub Pages)**
   ```bash
   git init
   git add .
   git commit -m "Primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
   git push -u origin main
   ```
   No GitHub: *Settings > Pages > Branch: main / root*. O site fica em `https://SEU-USUARIO.github.io/SEU-REPO/`.

## Segurança

- A anon key pode ficar no código; ela é pública por design.
- Os dados são protegidos pelo RLS (políticas no `supabase.sql`): cada usuário só acessa o que ele mesmo criou.
- Depois de criar a sua conta, desative novos cadastros em *Authentication > Sign In / Providers > Allow new users to sign up*, para ninguém mais criar conta no seu sistema.

## Funcionalidades

- Login por e-mail e senha
- Cadastro de empresas (nome, contato, telefone, e-mail, endereço)
- Registro de atendimentos (empresa, cliente atendido, data, tipo, status, problema e solução)
- Painel com total geral, mês, ano, em aberto, e contagem por empresa e por mês
- Filtros por empresa e mês no histórico

## Próximos passos possíveis

- Exportar relatório mensal por empresa (CSV/PDF) para cobrança
- Campos de valor/horas de cada atendimento
- Anexar fotos (Supabase Storage)
