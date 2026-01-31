# Documento de Requisitos do Produto (PRD)

## Metadados
- **Projeto:** Climafort App (Plataforma de Gestão de Orçamentos)
- **Data:** 28/01/2026

## Visão Geral do Produto
O Climafort App é uma plataforma web baseada em React e TypeScript desenhada para ajudar empresas a gerenciar orçamentos, materiais, serviços e perfis de empresa de forma eficiente, com autenticação e funcionalidades de dashboard.

## Objetivos Principais
1. Habilitar autenticação e registro seguro de usuários.
2. Fornecer um dashboard intuitivo como interface principal.
3. Facilitar a criação, edição e visualização detalhada de orçamentos de negócios com cálculos automáticos.
4. Gerenciar catálogo de materiais e serviços usados nos orçamentos.
5. Permitir o gerenciamento de perfis de usuário e configurações da empresa para uma experiência personalizada.

## Funcionalidades Chave
- **Autenticação:** Login e registro de usuários para acesso seguro.
- **Dashboard:** Interface principal do usuário após o login.
- **Gestão de Orçamentos:** Criação completa de orçamentos, edição e visualizações detalhadas.
- **Gestão de Materiais:** Manutenção do inventário ou catálogo de materiais.
- **Gestão de Serviços:** Manutenção da lista de serviços oferecidos pela empresa.
- **Configurações e Perfil:** Personalização de preferências e informações da empresa/usuário.

## Resumo do Fluxo do Usuário
1. O usuário se registra ou faz login na plataforma via páginas de autenticação.
2. Após o login, o usuário acessa o dashboard.
3. O usuário navega para a gestão de orçamentos para criar ou editar orçamentos e ver detalhes com cálculos.
4. O usuário gerencia materiais e serviços separadamente para manter as informações atualizadas para a geração de orçamentos.
5. O usuário acessa as configurações da empresa e páginas de perfil para atualizar dados.

## Critérios de Validação
- O usuário deve conseguir se registrar e fazer login com credenciais válidas.
- O dashboard deve carregar com sucesso e exibir resumos ou links rápidos relevantes.
- Usuários conseguem criar, editar e visualizar orçamentos com precisão, com todos os cálculos refletindo a lógica de negócios correta.
- Materiais e serviços podem ser adicionados, editados e removidos corretamente, persistindo as mudanças.
- Configurações da empresa e perfis de usuário atualizam com sucesso e persistem preferências.
- A UI da aplicação é responsiva, acessível e mantém estilo consistente conforme padrões TailwindCSS e Shadcn/UI.

## Resumo Técnico
**Tech Stack:**
- TypeScript, React, Vite, TailwindCSS, Shadcn/UI, Zustand, React Query, Supabase.

**Estrutura de Funcionalidades:**
- **Autenticação:** `src/pages/Login.tsx`, `src/pages/Register.tsx`
- **Dashboard:** `src/pages/Index.tsx`
- **Gestão de Orçamentos:** `src/pages/NewQuote.tsx`, `src/pages/QuoteDetail.tsx`, `src/store/quotesStore.ts`, `src/services/quotesService.ts`
- **Gestão de Materiais:** `src/pages/Materials.tsx`, `src/store/materialsStore.ts`
- **Gestão de Serviços:** `src/pages/Services.tsx`, `src/store/servicesStore.ts`
- **Configurações:** `src/pages/Settings.tsx`, `src/pages/Profile.tsx`
