import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Cria um transporter de email baseado nas variáveis de ambiente
 */
function createTransporter() {
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    };
    if (!config.auth.user || !config.auth.pass) {
        console.warn('⚠️ Configuração de email não encontrada. Emails não serão enviados.');
        return null;
    }
    return nodemailer.createTransport(config);
}
/**
 * Envia email de boas-vindas após registro de membro
 */
export async function sendWelcomeEmail(email, name, churchName) {
    const transporter = createTransporter();
    if (!transporter) {
        console.warn(`⚠️ Email não enviado para ${email} - configuração SMTP não disponível`);
        return;
    }
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@churchapp.com';
    const fromName = process.env.SMTP_FROM_NAME || 'ChurchApp';
    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: `Bem-vindo(a) à ${churchName}!`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo(a) à ${churchName}!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>É com grande alegria que recebemos você como membro da nossa igreja!</p>
              <p>Sua conta foi criada com sucesso e você já pode acessar o sistema.</p>
              <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>
              <p>Que Deus abençoe sua jornada conosco!</p>
              <p style="margin-top: 30px;">
                <strong>Equipe ${churchName}</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
        text: `
      Bem-vindo(a) à ${churchName}!

      Olá ${name},

      É com grande alegria que recebemos você como membro da nossa igreja!

      Sua conta foi criada com sucesso e você já pode acessar o sistema.

      Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.

      Que Deus abençoe sua jornada conosco!

      Equipe ${churchName}
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error(`❌ Erro ao enviar email para ${email}:`, error);
        // Não lança erro para não quebrar o fluxo de registro
        // O registro deve continuar mesmo se o email falhar
    }
}
/**
 * Envia notificação para admins sobre limite de membros atingido
 */
export async function sendMemberLimitReachedNotification(adminEmails, churchName, currentMembers, maxMembers) {
    const transporter = createTransporter();
    if (!transporter || adminEmails.length === 0) {
        return;
    }
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@churchapp.com';
    const fromName = process.env.SMTP_FROM_NAME || 'ChurchApp';
    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: adminEmails.join(', '),
        subject: `⚠️ Limite de Membros Atingido - ${churchName}`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #EF4444;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .warning {
              background-color: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Limite de Membros Atingido</h1>
            </div>
            <div class="content">
              <p>Prezado(a) Administrador(a),</p>
              <div class="warning">
                <p><strong>Atenção!</strong></p>
                <p>O limite de membros do plano da igreja <strong>${churchName}</strong> foi atingido.</p>
                <p><strong>Membros atuais:</strong> ${currentMembers}</p>
                <p><strong>Limite do plano:</strong> ${maxMembers}</p>
              </div>
              <p>Novos membros não poderão se registrar até que o limite seja aumentado ou membros sejam removidos.</p>
              <p>Por favor, considere fazer upgrade do plano ou entre em contato com o suporte.</p>
            </div>
          </div>
        </body>
      </html>
    `,
        text: `
      ⚠️ Limite de Membros Atingido

      Prezado(a) Administrador(a),

      Atenção! O limite de membros do plano da igreja ${churchName} foi atingido.

      Membros atuais: ${currentMembers}
      Limite do plano: ${maxMembers}

      Novos membros não poderão se registrar até que o limite seja aumentado ou membros sejam removidos.

      Por favor, considere fazer upgrade do plano ou entre em contato com o suporte.
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error(`❌ Erro ao enviar notificação de limite:`, error);
    }
}
/**
 * Envia notificação para admins sobre tentativa de registro quando limite está próximo
 */
export async function sendMemberRegistrationAttemptNotification(adminEmails, churchName, memberName, memberEmail) {
    const transporter = createTransporter();
    if (!transporter || adminEmails.length === 0) {
        return;
    }
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@churchapp.com';
    const fromName = process.env.SMTP_FROM_NAME || 'ChurchApp';
    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: adminEmails.join(', '),
        subject: `Nova Tentativa de Registro - ${churchName}`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nova Tentativa de Registro</h1>
            </div>
            <div class="content">
              <p>Prezado(a) Administrador(a),</p>
              <p>Uma nova tentativa de registro foi realizada na igreja <strong>${churchName}</strong>.</p>
              <p><strong>Nome:</strong> ${memberName}</p>
              <p><strong>Email:</strong> ${memberEmail}</p>
              <p>Por favor, verifique se o registro foi concluído com sucesso ou se houve algum problema.</p>
            </div>
          </div>
        </body>
      </html>
    `,
        text: `
      Nova Tentativa de Registro

      Prezado(a) Administrador(a),

      Uma nova tentativa de registro foi realizada na igreja ${churchName}.

      Nome: ${memberName}
      Email: ${memberEmail}

      Por favor, verifique se o registro foi concluído com sucesso ou se houve algum problema.
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error(`❌ Erro ao enviar notificação de tentativa de registro:`, error);
    }
}
