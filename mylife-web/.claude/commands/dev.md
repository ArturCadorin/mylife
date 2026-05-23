# /dev — Iniciar e monitorar o servidor frontend

Inicia o servidor Next.js (`npm run dev`) e verifica se está saudável.

## Passos

1. **Verificar se já está rodando**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Se retornar qualquer código HTTP → servidor já está no ar. Informe ao usuário e pule o passo 2.

2. **Iniciar em background** (somente se não estiver rodando)

```bash
cd "c:\Artur - DEV. Projetos Pessoais\Controle Financeiro\mylife-web" && npm run dev
```

Use `run_in_background: true`. Aguarde ~5s e verifique novamente com `curl`.

3. **Confirmar saúde**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

- `200` ou `307` → OK, servidor no ar em http://localhost:3000
- Outro código ou erro → leia os últimos 30 linhas do arquivo de output do background task para diagnosticar.

4. **Reportar ao usuário**

Informe: URL, status HTTP, e se houve algum erro de compilação visível no output.

## Dicas

- O Next.js sempre redireciona `/` → `/login` com 307 quando não autenticado — isso é comportamento normal, não erro.
- Erros de build TypeScript aparecem no output do processo — leia-os se o status não for 200/307.
- O backend Spring Boot deve estar rodando em http://localhost:8080 para as chamadas de API funcionarem.
