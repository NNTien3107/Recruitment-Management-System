import { Injectable, Logger } from '@nestjs/common';

export interface NotificationPayload {
  [key: string]: unknown;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Gửi thông báo đến người dùng (Thành viên Thành sẽ kết nối với Nodemailer/Mailtrap tại đây).
   *
   * @param userId ID người nhận thông báo
   * @param type Loại sự kiện thông báo (ví dụ: 'APPLICATION_STATUS_CHANGED')
   * @param payload Dữ liệu chi tiết gửi kèm
   */
  async notify(userId: string, type: string, payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `[Thông báo] Gửi đến User ${userId} | Loại: ${type} | Nội dung: ${JSON.stringify(payload)}`,
    );
  }
}

