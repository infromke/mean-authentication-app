# [MERN, Legacy] Authentication App

> [!CAUTION]
> ESTA É UMA VERSÃO LEGADO (MERN STACK)

Este repositório foi preservado para fins de histórico e comparação técnica. A versão atualizada, utilizando Angular 21, TypeScript e práticas de segurança avançadas, encontra-se na branch [main](https://github.com/infrmke/mean-authentication-system/tree/main).

Esta aplicação representa o estágio inicial do projeto, desenvolvido com a stack MERN (MongoDB, Express, React e Node.js). Ela serviu como base para o estudo de padrões de design e fluxos de autenticação segura.

## Síntese da Transição

Esta branch documenta a implementação original em JavaScript puro e React. Se você deseja ver a evolução deste projeto para uma arquitetura mais escalável, confira as principais mudanças na branch principal:

- **Front-end**: Migração de React 19 (Vite) para Angular 21 (Signals & RxJS);
- **Linguagem**: Transição de JavaScript (CommonJS/ESM) para TypeScript 6+;
- **Estilização**: Evolução de SASS modular para componentes reativos e integrados.

## Visão Geral Técnica

O projeto implementa um sistema completo de autenticação e autorização que possui foco em estabelecer fluxos seguros de autenticação e gestão de usuários.

- **Front-end**: React 19+ (Vite);
- **E-mail Service**: SMTP via Brevo para notificações transacionais;
- **Database**: MongoDB Atlas com indexação TTL para expiração automática de tokens OTP.

## Arquitetura e Padrões de Design

O projeto é **híbrido**, tendo classes (Singleton) para camadas que mantêm responsabilidades fixas (Controllers/Services/Repositories) e também tendo funções modulares para lógica auxiliar.

- **Monólito Modular**: Back-end organizado em módulos desacoplados, facilitando a manutenção e testes;
- **Global Error Handling**: Middleware centralizado para tratamento de erros, garantindo respostas padronizadas em toda a API;
- **Middleware-Chain**: Uso intensivo de camadas para sanitização de dados, proteção de rotas JWT (jsonwebtoken) e controle de fluxo.

## Tech Stack e Bibliotecas

### Back-end (Node.js 22.21 e Express 5.2)

- **Database**: `MongoDB` (via mongoose);
- **Security**: `bcrypt` para hashing e validação de senhas, `jsonwebtoken` para autenticação Stateless, `express-rate-limit` para limitar tráfego e proteger a API contra ataques de brute force, e `express-validator` para a validação de inputs;
- **Communication**: `nodemailer` para integração SMTP com a Brevo;
- **Utils**: `cookie-parser` para manipulação de cookies (HttpOnly) e `CORS` para a segurança do navegador.

### Front-end (React 19.2)

- **Routing**: React Router;
- **State Management**: Context API e hooks;
- **Styling**: `SASS` (SCSS) para arquitetura CSS modular;
- **UI/UX**: `lucide-react` para ícones e `react-hot-toast` para feedback visual;
- **Client**: `Axios` com configuração de interceptors e "withCredentials".

## Funcionalidades

- **Gestão de Acesso**: Cadastro, login e verificação de e-mail com liberdade para exclusão de conta;
- **Autenticação Dinâmica**: Verificação de e-mail e recuperação de senha por meio de códigos One-Time Password (OTP);
- **Segurança Proativa**: Tokens JWT armazenados em cookies HttpOnly e secure, e expiração customizada de tokens e expiração automática no banco de dados (MongoDB TTL);
- **Conceitos RESTful API**: Paginação via limit e offset, endpoints semânticos e sanitização de inputs;
- **Feedback ao Usuário**: Mensagens de erro padronizadas e UI reativa para estados de carregamento e expiração de sessões.

## Como rodar o projeto

Os **pré-requisitos** principais são os seguintes: Node.js (18+), npm ou yarn para gerenciamento de pacotes e uma conta na Brevo (para o envio de e-mails). Contudo, antes de qualquer coisa, o projeto requer uma instância ativa do MongoDB. Siga os passos abaixo:

1. Faça login no MongoDB Atlas
2. Crie um novo Projeto e um Cluster (Shared/Gratuito)
3. Em Database Access, crie um usuário e salve a senha
4. Em Network Access, libere o acesso ao seu IP
5. Clique em Connect e selecione "Drivers" para obter sua URI de conexão. Ela terá o formato `mongodb+srv://<usuario>:<senha>@cluster0.mongodb.net/<nome_do_banco>`.

Após cumprir com as condições acima, clone o repositório.

```shell
    git clone https://github.com/infrmke/mean-authentication-system.git
    cd mean-authentication-system

    # Para rodar esta versão específica (MERN), basta mudar para a branch legacy:
    git checkout legacy/react-mern
```

**Back-end**

1. Navegue até a pasta do servidor e instale as dependências:

```shell
    cd backend
    npm install
```

2. Crie um arquivo ".env" na raiz da pasta _backend_ e preencha com as variáveis listadas na seção "Variáveis de Ambiente".

3. Execute a API:

```shell
    npm run dev
```

---

**Front-end**

1. Abra um novo terminal, navegue até a pasta do cliente e instale as dependências:

```shell
    cd frontend
    npm install
```

2. Crie um arquivo ".env" na raiz da pasta _frontend_ e defina a URL da API como `VITE_API_URL`.

3. Execute a aplicação:

```shell
    npm run dev
```

---

**Concurrently**

Após instalar as dependências de cada diretório, é possível agilizar a execução do projeto com a biblioteca `concurrently`, que permite rodar o servidor e o cliente simultaneamente com um único comando a partir da raiz do projeto.

1. Na **raiz** do projeto, instale as dependências (o concurrently):

```shell
    npm install
```

2. Execute o comando abaixo para subir o back-end e o front-end de uma só vez:

```shell
    npm run dev
```

**Atenção**: certifique-se de que os arquivos .env tanto na pasta `/backend` quanto na pasta `/frontend` foram configurados corretamente antes de iniciar.

## Documentação API

<p align="center">
  <a href="https://www.postman.com/infrkme/workspace/public/collection/37979308-76d4549e-cb2d-4b6e-be1f-91a07d2ce862?action=share&creator=37979308">
    <img src="https://run.pstmn.io/button.svg" alt="Run in Postman" height="35">
  </a>
</p>

Você pode testar todos os endpoints da API diretamente no Postman através da coleção acima. Faça questão de configurar uma Variable `base_url` que aponte para a sua instância local ou de produção antes de realizar requisições a API.

## Variáveis de Ambiente

Para rodar o projeto, você vai precisar adicionar as seguintes variáveis de ambiente nos seus respectivos ".env":

**Back-end**

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

---

**Front-end**

- `VITE_PORT`
