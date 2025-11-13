import { registerAs } from '@nestjs/config';

export default registerAs('mailer', () => ({
  transport: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_PORT === '465',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  },
  defaults: {
    from: process.env.MAIL_FROM,
  },
  template: {
    dir: __dirname + '/../modules/mailer/templates',
    adapter: require('handlebars'),
    options: {
      strict: true,
    },
  },
}));
