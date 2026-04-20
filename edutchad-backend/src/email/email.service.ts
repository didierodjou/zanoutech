// src/email/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Récupérer les variables d'environnement avec des valeurs par défaut
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || 'admin@edutchad.td';
    const smtpPassword = process.env.SMTP_PASSWORD || '';

    console.log('📧 Configuration SMTP:', { host: smtpHost, port: smtpPort, user: smtpUser });

    // Configuration du transporteur SMTP
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true pour 465, false pour les autres ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  async sendWelcomeEmail(to: string, firstName: string, lastName: string, password: string) {
    const subject = 'Bienvenue sur EduTchad - Vos identifiants de connexion';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">EduTchad</h1>
          <p style="color: #6b7280; font-size: 16px;">Plateforme de Gestion Scolaire</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0;">Bonjour ${firstName} ${lastName},</h2>
          <p style="color: #4b5563;">Votre compte professeur a été créé avec succès sur la plateforme EduTchad.</p>
        </div>

        <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #0369a1; margin-top: 0;">Vos identifiants de connexion</h3>
          <p style="color: #1e293b;"><strong>Email :</strong> ${to}</p>
          <p style="color: #1e293b;"><strong>Mot de passe :</strong> <span style="background-color: #fef9c3; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</span></p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="color: #4b5563;">Pour vous connecter :</p>
          <ol style="color: #4b5563;">
            <li>Rendez-vous sur la page de connexion professeur</li>
            <li>Entrez votre email et le mot de passe ci-dessus</li>
            <li>Vous pourrez changer votre mot de passe après votre première connexion</li>
          </ol>
        </div>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>Ce message est automatique, merci de ne pas y répondre.</p>
          <p>&copy; ${new Date().getFullYear()} EduTchad - Tous droits réservés</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"EduTchad" <${process.env.SMTP_USER || 'admin@edutchad.td'}>`,
      to,
      subject,
      html,
    };

    try {
      console.log(`📧 Envoi d'email à ${to}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, firstName: string, lastName: string, newPassword: string) {
    const subject = 'EduTchad - Réinitialisation de votre mot de passe';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">EduTchad</h1>
          <p style="color: #6b7280; font-size: 16px;">Plateforme de Gestion Scolaire</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0;">Bonjour ${firstName} ${lastName},</h2>
          <p style="color: #4b5563;">Votre mot de passe a été réinitialisé par l'administrateur.</p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #92400e; margin-top: 0;">Nouveau mot de passe</h3>
          <p style="color: #1e293b;"><strong>Email :</strong> ${to}</p>
          <p style="color: #1e293b;"><strong>Nouveau mot de passe :</strong> <span style="background-color: #fef9c3; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${newPassword}</span></p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="color: #4b5563;">Nous vous recommandons de changer ce mot de passe après votre prochaine connexion.</p>
        </div>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>Ce message est automatique, merci de ne pas y répondre.</p>
          <p>&copy; ${new Date().getFullYear()} EduTchad - Tous droits réservés</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"EduTchad" <${process.env.SMTP_USER || 'admin@edutchad.td'}>`,
      to,
      subject,
      html,
    };

    try {
      console.log(`📧 Envoi d'email de réinitialisation à ${to}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Connexion SMTP établie avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion SMTP:', error);
      return false;
    }
  }
}