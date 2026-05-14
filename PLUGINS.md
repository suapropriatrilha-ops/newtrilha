# Plugins Instalados no Claude Code

Lista completa dos plugins instalados neste ambiente, como invocá-los e o que cada um faz.

---

## 1. superpowers — Metodologias de desenvolvimento
Skills para fluxos de trabalho estruturados.

| Comando | Descrição |
|---|---|
| `/superpowers:brainstorming` | Explora intenção do usuário antes de implementar |
| `/superpowers:writing-plans` | Cria planos para tarefas multi-etapas |
| `/superpowers:executing-plans` | Executa planos com checkpoints de revisão |
| `/superpowers:test-driven-development` | TDD antes de escrever código |
| `/superpowers:systematic-debugging` | Debugging sistemático |
| `/superpowers:verification-before-completion` | Verifica antes de declarar pronto |
| `/superpowers:requesting-code-review` | Solicita revisão de código |
| `/superpowers:receiving-code-review` | Recebe feedback de revisão |
| `/superpowers:using-git-worktrees` | Isola workspace com worktrees |
| `/superpowers:subagent-driven-development` | Implementa com subagentes |
| `/superpowers:dispatching-parallel-agents` | Despacha agentes em paralelo |
| `/superpowers:finishing-a-development-branch` | Finaliza branch (merge/PR) |
| `/superpowers:writing-skills` | Cria/edita skills |
| `/superpowers:using-superpowers` | Como usar o sistema de skills |

---

## 2. vercel — Plataforma Vercel
Skills e agentes para Next.js, deploy, AI SDK, etc.

### Skills

| Comando | Descrição |
|---|---|
| `/vercel:deploy` | Deploy preview ou produção (passe `prod` para produção) |
| `/vercel:env` | Gerencia variáveis de ambiente |
| `/vercel:bootstrap` | Inicializa projeto Vercel |
| `/vercel:status` | Status do projeto |
| `/vercel:marketplace` | Integrações marketplace |
| `/vercel:nextjs` | Guia Next.js App Router |
| `/vercel:ai-sdk` | AI SDK |
| `/vercel:ai-gateway` | Roteamento de modelos AI |
| `/vercel:shadcn` | Componentes shadcn/ui |
| `/vercel:auth` | Clerk, Auth0, Descope |
| `/vercel:vercel-storage` | Blob, Edge Config, Neon, Upstash |
| `/vercel:vercel-functions` | Serverless/Edge Functions |
| `/vercel:routing-middleware` | Middleware de rotas |
| `/vercel:vercel-firewall` | WAF e firewall |
| `/vercel:runtime-cache` | Cache runtime |
| `/vercel:next-cache-components` | Cache Components Next.js 16 |
| `/vercel:turbopack` | Bundler Turbopack |
| `/vercel:workflow` | Workflows duráveis |
| `/vercel:chat-sdk` | Chatbots multi-plataforma |
| `/vercel:vercel-sandbox` | MicroVMs isoladas |
| `/vercel:vercel-cli` | CLI Vercel |
| `/vercel:vercel-agent` | Code review AI |
| `/vercel:env-vars` | Variáveis de ambiente |
| `/vercel:next-upgrade` | Upgrade Next.js |
| `/vercel:next-forge` | Monorepo Turborepo |
| `/vercel:react-best-practices` | Boas práticas React |
| `/vercel:knowledge-update` | Atualiza conhecimento Vercel |
| `/vercel:verification` | Verifica fluxo end-to-end |
| `/vercel:deployments-cicd` | CI/CD |

### Agentes (via Agent tool)

| Agente | Descrição |
|---|---|
| `vercel:ai-architect` | Arquitetura de apps com AI |
| `vercel:deployment-expert` | Estratégias de deploy |
| `vercel:performance-optimizer` | Performance e Core Web Vitals |

---

## 3. feature-dev — Desenvolvimento de features

| Comando / Agente | Descrição |
|---|---|
| `/feature-dev:feature-dev` | Desenvolvimento guiado de feature |
| `feature-dev:code-architect` | Projeta arquitetura de feature |
| `feature-dev:code-explorer` | Explora codebase existente |
| `feature-dev:code-reviewer` | Revisa código com filtro de confiança |

---

## 4. code-review — Revisão de código

| Comando | Descrição |
|---|---|
| `/code-review:code-review` | Revisa um PR |

---

## 5. commit-commands — Git/commits

| Comando | Descrição |
|---|---|
| `/commit-commands:commit` | Cria commit |
| `/commit-commands:commit-push-pr` | Commit, push e abre PR |
| `/commit-commands:clean_gone` | Limpa branches deletados no remoto |

---

## 6. claude-md-management — CLAUDE.md

| Comando | Descrição |
|---|---|
| `/claude-md-management:revise-claude-md` | Atualiza CLAUDE.md com aprendizados da sessão |
| `/claude-md-management:claude-md-improver` | Audita e melhora arquivos CLAUDE.md |

---

## 7. claude-code-setup — Configuração Claude Code

| Comando | Descrição |
|---|---|
| `/claude-code-setup:claude-automation-recommender` | Recomenda automações (hooks, subagents, skills, MCP) |

---

## 8. skill-creator — Criação de skills

| Comando | Descrição |
|---|---|
| `/skill-creator:skill-creator` | Cria, edita, testa e otimiza skills |

---

## 9. frontend-design — Design frontend

| Comando | Descrição |
|---|---|
| `/frontend-design:frontend-design` | UI distintiva e production-grade |

---

## 10. code-simplifier

| Agente | Descrição |
|---|---|
| `code-simplifier:code-simplifier` | Simplifica código preservando funcionalidade |

---

## 11. context7 (MCP) — Documentação atualizada
Use para buscar docs atuais de libs/frameworks (React, Next.js, Prisma, etc.).

| Ferramenta MCP | Descrição |
|---|---|
| `mcp__plugin_context7_context7__resolve-library-id` | Resolve ID da biblioteca |
| `mcp__plugin_context7_context7__query-docs` | Consulta docs atualizadas |

---

## 12. Supabase (MCP) — Banco de dados

Principais ferramentas MCP:

| Ferramenta | Descrição |
|---|---|
| `list_tables` | Lista tabelas |
| `apply_migration` | Aplica migração |
| `execute_sql` | Executa SQL |
| `get_logs` | Logs do projeto |
| `get_advisors` | Avisos de segurança/performance |
| `deploy_edge_function` | Deploy de edge function |
| `create_branch` / `merge_branch` / `rebase_branch` | Branches de banco |
| `list_projects` / `get_project` | Gerencia projetos |
| `generate_typescript_types` | Gera tipos TS |
| `search_docs` | Busca docs Supabase |

---

## Skills sem plugin (built-in / utilitárias)

| Comando | Descrição |
|---|---|
| `/init` | Cria novo CLAUDE.md |
| `/review` | Revisa PR |
| `/security-review` | Revisão de segurança do branch |
| `/simplify` | Revisa código alterado para reuso/qualidade |
| `/loop` | Roda prompt em intervalo recorrente |
| `/schedule` | Agenda agentes remotos (cron) |
| `/claude-api` | Apps com Claude API / Anthropic SDK |
| `/update-config` | Configura `settings.json` |
| `/keybindings-help` | Customiza atalhos |
| `/fewer-permission-prompts` | Reduz prompts de permissão |

---

## Como invocar

- **Skills**: digite `/<plugin>:<skill>` no chat (ex: `/vercel:deploy prod`)
- **Agentes**: peça ao Claude para usá-los (ex: "use o agente Explore para procurar X") — eles são despachados via tool `Agent`
- **MCP tools**: invocadas automaticamente pelo Claude quando relevante (Supabase, Context7)
