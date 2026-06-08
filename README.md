# [MEAN] Authentication App

Uma aplicação de autenticação desenvolvida com a stack MongoDB, Express.js, Angular e Node.js, focada em segurança, reatividade e arquitetura escalável.

O app está hospedado na Render e pode ser acessado [aqui](https://auth-app-web.onrender.com). Contudo, **leve em consideração** que o servidor pode levar 30 ou 50 segundos para "acordar" no primeiro acesso.

## Visão Geral Técnica

O projeto conta com um ecossistema de gestão de identidades (IAM) que lida com o ciclo de vida completo do usuário desde o cadastro e verificação (por OTP) até o controle de acesso. O sistema utiliza camadas de cache em memória para otimizar a performance e limitadores de tráfego que seguem padrões da IETF para garantir a estabilidade sob carga.

- **Front-end**: Angular 21+ (Signals, Observables (RxJS) e Standalone Components);
- **Back-end**: Node.js 22+ com Express 5+ totalmente estruturado em TypeScript 6+;
- **Database**: MongoDB Atlas com indexação TTL e índices compostos.

## Arquitetura e Padrões de Design

A aplicação foi estruturada sob o conceito de Monólito Modular com responsabilidades separadas em uma estrutura em camadas. Também, o projeto possui uma abordagem híbrida onde utiliza Classes Singleton para camadas de persistência e orquestração e funções modulares para utilitários.

- **Modularização por Domínio**: Organização estrita em módulos (User, Session, OTP), onde cada domínio possui seus próprios Controllers, Services, Repositories e Schemas;
- **Padronização RFC 7807 (Problem Details)**: Implementação do padrão IETF para respostas de erro, fornecendo mensagens consistentes e semânticas;
- **Encadeamento de Middlewares**: Pipeline de execução para sanitização de inputs, proteção de rotas via interceptores JWT e controle de fluxo;
- **POJO Persistence Pattern**: Camada de persistência otimizada com .lean(), garantindo que a lógica de negócio lide apenas com objetos JavaScript puros, aumentando a performance e previsibilidade;
- **Pipeline Type-Safe para Erros**: União entre o suporte nativo a erros assíncronos do Express 5 e a palavra-chave "throw" do JavaScript, o que permite o encerramento imediato de fluxos;
- **Sistema de Tipos Estrito e Defensivo**: Arquitetura configurada sem o uso de "any" e sim "unknown" com Type Narrowing para manipulação dados. Ainda, contratos de dados concentrados em arquivos de definição específicos ou análogos ao seu domínio;
- **Validação de Infraestrutura Fail-Fast**: Centralização e validação das variáveis de ambiente (process.env) logo na inicialização da API, garantindo que o servidor sequer suba caso falte alguma.

## Tech Stack e Bibliotecas

### Back-end (Node.js 22.21, Express 5.2 e TypeScript 6.0)

- **Runtime & Tooling**: `typescript` para checagem estática estrita de tipos, `tsx` para execução em desenvolvimento, além de padronização de código automatizada com `ESLint` e diretrizes de formatação cross-editor via `EditorConfig`;
- **Security**: `jsonwebtoken` para autenticação Stateless, `bcrypt` para hashing e validação de senhas e `CORS` para políticas de segurança cross-origin;
- **Session Management**: `cookie-parser` para a manipulação segura de credenciais em cookies;
- **Resilience**: `node-cache` para redução de latência em dados de sessão e perfil, e `express-rate-limit` implementando a Internet Draft (draft-ietf-httpapi-ratelimit-headers) para evitar bots, sobrecarregamento e brute-force;
- **Data Validation & Type Inference**: Validação de esquemas e contratos HTTP utilizando `Zod`, com uso estendido para a inferência automática de DTOs nativos via z.infer;
- **Communication**: `nodemailer` integrado ao SMTP da Brevo para fluxos transacionais de OTP;
- **Observability**: Logging de tráfego para monitoramento de requisições HTTP com `morgan`.

### Front-end (Standalone-first Angular 21.1)

- **Dependency Injection (DI)**: Uso extensivo da função inject() em vez de constructors;
- **State Management**: Uso de Signals para gerenciamento de estado e RxJS (Observables) para fluxos assíncronos complexos;
- **Forms**: Reactive Forms para a construção de formulários para validações tipadas e detalhadas;
- **Testing & Quality**: Suíte de testes com `Vitest` e `jsdom` para garantir a confiabilidade dos componentes;
- **UI/UX**: Estilização modular com `SASS` (SCSS), ícones via `lucide-angular` e feedback com `ngx-toastr`.

## Funcionalidades

- **Autenticação Stateless**: Login com persistência segura via Cookies HttpOnly/Secure. Implementação de Declaration Merging para acoplar o ciclo de vida do usuário autenticado diretamente ao objeto Request do Express de forma nativa;
- **Fluxo de Confiança (OTP)**: Verificação de conta e recuperação de senha via One-Time Password, com expiração automática via MongoDB TTL;
- **Paginação Dinâmica**: Listagem de dados com suporte a size, page e sort, inspirado pelo padrão Spring Data JPA;
- **Caching Estruturado**: Sistema de cache inteligente que armazena dados já sanitizados e formatados para otimizar a listagem de usuários e busca por ID, verificação de integridade da sessão ativa e validação de status do token de redefinição de senha;
- **Segurança Proativa**: Proteção contra ataques de força bruta (Rate Limiting por IP) e tratamento especializado de colisões de dados (E11000);
- **Sanitização RESTful**: Endpoints semânticos com filtragem de campos sensíveis (senha) em todas as respostas da API;
- **Unificação de Identificadores**: Padronização de identificadores para o formato String (id), ocultando detalhes de implementação do MongoDB (\_id) em toda a camada de transporte (API e Front-end).

## Como rodar o projeto

O projeto utiliza o `concurrently` em sua raiz para facilitar a inicialização de ambas as camadas simultaneamente. Os **pré-requisitos** para rodá-lo são: Node.js (18+), npm ou yarn para gerenciamento de pacotes e uma conta no serviço de e-mails Brevo.

Antes de rodar a aplicação, você precisa preparar sua instância ativa do MongoDB. Siga os passos abaixo:

1. Faça login no MongoDB Atlas
2. Crie um novo Projeto e um Cluster (Shared/Gratuito)
3. Em Database Access, crie um usuário e salve a senha
4. Em Network Access, libere o acesso ao seu IP
5. Clique em Connect e selecione "Drivers" para obter sua URI de conexão. Você a usará na variável "MONGODB_URI" no arquivo .env.

Após cumprir com as condições acima, clone o repositório.

```shell
    git clone https://github.com/infromke/mean-authentication-system.git
    cd mean-authentication-system
```

1. Instale as dependências

Baixe todas as dependências de cada `package.json`:

```shell
    npm run install-all
```

2. Crie um arquivo ".env" na raiz da pasta `backend` e o preencha com as variáveis listadas na seção "Variáveis de Ambiente". Ainda, configure o ponto de entrada da API em `src/environments/` na pasta `frontend`.

3. Inicie a aplicação em modo de desenvolvimento:

```shell
    npm run dev
```

**Atenção**: certifique-se de que todas as variáveis de ambiente foram configuradas corretamente antes de iniciar!

## Documentação da API

<p align="center">
  <a href="https://www.postman.com/infrkme/workspace/public/collection/37979308-2861d888-a975-4ae5-9f66-8feaef4a3b48?action=share&creator=37979308">
    <img src="https://run.pstmn.io/button.svg" alt="Run in Postman" height="35">
  </a>
</p>

Os endpoints da API podem ser acessados e testados através da coleção pública no Postman expressa acima. Certifique-se de configurar o ambiente (environment) com a variável `baseUrl` apontando para o servidor que você definiu.

As respostas de erro seguem o padrão application/problem+json. Um exemplo de erro de validação segue abaixo:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Your request has invalid fields",
  "instance": "/sessions/login/",
  "errors": [
    {
      "field": "email",
      "message": "Provide a valid e-mail address"
    },
    {
      "field": "email",
      "message": "Email cannot be empty"
    },
    {
      "field": "password",
      "message": "Password cannot be empty"
    }
  ]
}
```

## Planos Futuros

No momento, apenas um: a criação de uma funcionalidade de "Perfil" onde o usuário será capaz de alterar seu nome, definir um avatar, trocar seu e-mail (que precisará ser verificado de novo) e trocar sua senha.

## Variáveis de Ambiente

Para rodar o projeto, você vai precisar adicionar as seguintes variáveis de ambiente no ".env" do seu back-end:

- `NODE_ENV`
- `SERVER_PORT`
- `CLIENT_PORT`
- `MONGODB_URI`
- `DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_RESET_SECRET`
- `SMTP_MAILER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PWD`

## Créditos

A inspiração inicial para o começo do projeto foi o Youtuber [GreatStack](https://www.youtube.com/@GreatStackDev), por meio do seu próprio projeto de autenticação MERN.

Com essa base, tive a oportunidade de reestruturar o projeto original como um todo e aprimorá-lo. Assim, a transição deste projeto de uma stack MERN para MEAN representa um grande salto técnico.

No final de tudo isso, eu aprendi a...

- Implementar o padrão Controller-Service-Repository;
- Refatorar e migrar a lógica de uma stack MERN para MEAN (Angular 19+);
- Gerenciar fluxos assíncronos e reatividade com RxJS e Observables;
- Utilizar Signals e Standalone Components para uma performance otimizada no Front-end;
- Refatorar e migrar um ecossistema inteiro de JavaScript puro para TypeScript estrito;
- Garantir a segurança da API com JWT, CORS, Rate Limiting e HttpOnly Cookies;
- Construir e-mails XHTML e gerenciar fluxos de e-mail automatizados;
- Implementar Caching de dados para reduzir a carga no banco de dados e melhorar o tempo de resposta;
- Utilizar índices compostos e índices TTL no MongoDB para automação de ciclo de vida de dados;
- Implementar logging de requisições com o Morgan para examinar seu tráfego em desenvolvimento;
- Utilizar o Zod para criar esquemas de validação.
