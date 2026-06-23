// abaixo: mock de variáveis de ambiente que o Zod exige para inicializar a API

process.env.MONGODB_URI = 'MONGODB_URI=mongodb://localhost:27017/mean_auth_cluster'
process.env.DB_NAME = 'dev_db'

process.env.JWT_ACCESS_SECRET = '7b61a4f29ce52118a838806c2dab5e45a2d59b9242ca57e66406ca20bb57c099'
process.env.JWT_RESET_SECRET = 'f4bc4ea111b170ce12b1157e5a2aeb7f4f832f4bc1363ae1c307a652fa6088b7'

process.env.SMTP_MAILER = 'mailer@example.com'
process.env.SMTP_HOST = 'smtp-link.host.com'
process.env.SMTP_PORT = '111'

process.env.SMTP_USER = 'smtp-user@smtp-host.com'
process.env.SMTP_PWD = 'U4JvD9e7XrP5r46dSKbYHyqwQTznBuUIqyApBPDBqPmMAdhE'
