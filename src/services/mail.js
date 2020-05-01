import Nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import nodeFs from 'fs';
import nodePath from 'path';
import glob from 'glob';
import config from './config';

const { readFileSync } = nodeFs;
const { resolve, join } = nodePath;
const currentPath = __dirname;
const DEFAULT_LANG = 'fr';

export default async function sendMail(recipients, options = {}) {
  const to = [].concat(recipients).join(';');
  const conf = config.get('mail:transporter');
  if (!conf.auth || (!conf.auth.user && !conf.auth.pass)) {
    delete conf.auth;
  }
  const opts = {
    from: config.get('mail:default_from'),
    subject: '',
    text: '',
    ...options,
  };
  const transporter = Nodemailer.createTransport(conf);
  const mailOptions = { to, ...opts };
  return transporter.sendMail(mailOptions);
}

function compileTemplates(path, ext) {
  return glob.sync(`${path}.*${ext}`)
    .reduce((acc, curr) => {
      const langRegex = new RegExp(`([a-z]+)${ext.replace('.', '\\.')}$`);
      const [, lang] = langRegex.exec(curr);
      return Object.assign(acc, {
        [lang]: Handlebars.compile(readFileSync(curr).toString()),
      });
    }, {});
}

export function prepareSendMailFromTemplate(template, subject) {
  const path = resolve(join(currentPath, '..', 'templates', 'mail', template));
  const templates = {
    txt: compileTemplates(path, '.txt.hbs'),
  };

  return async (to, { data = {}, lang = DEFAULT_LANG }) => {
    if (!templates.txt[lang]) {
      throw new Error('No mail template found');
    }

    const opts = { subject };
    if (templates.txt[lang]) {
      opts.text = templates.txt[lang](data);
    }

    // @todo: async in queue management
    sendMail(to, opts);
  };
}

export const sendPasswordResetMail = prepareSendMailFromTemplate(
  'password-reset',
  'Réinitialisation de votre mot de passe Stargate',
);

export const sendUserCreateMail = prepareSendMailFromTemplate(
  'create-user',
  'Initialisation de votre mot de passe Stargate',
);
