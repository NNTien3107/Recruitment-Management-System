import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Env } from '../config/env.validation';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly transport?: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly from?: string;

  constructor(config: ConfigService<Env, true>) {
    const host = config.get('SMTP_HOST', { infer: true });
    if (!host) return;

    const port = config.get('SMTP_PORT', { infer: true });
    const user = config.get('SMTP_USER', { infer: true });
    const pass = config.get('SMTP_PASS', { infer: true });
    this.from = config.get('SMTP_FROM', { infer: true });
    this.transport = createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465 && config.get('NODE_ENV', { infer: true }) === 'production',
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  get enabled() {
    return Boolean(this.transport);
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transport || !this.from) {
      throw new Error('SMTP chưa được cấu hình');
    }
    await this.transport.sendMail({
      from: this.from,
      to: { name: '', address: to },
      subject,
      text,
    });
  }

  onModuleDestroy() {
    this.transport?.close();
  }
}
