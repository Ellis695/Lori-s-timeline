require("dotenv").config();

const fs = require("fs/promises");

const RESEND_API_URL = "https://api.resend.com/emails";

const emailTransporter = {
  async sendMail(options) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is missing from the server environment.");
    }

    const from =
      process.env.RESEND_FROM_EMAIL ||
      "Lori's Timeline <onboarding@resend.dev>";

    const payload = {
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };

    if (options.text) payload.text = options.text;
    if (options.html) payload.html = options.html;
    if (options.replyTo || options.reply_to) {
      payload.reply_to = options.replyTo || options.reply_to;
    }

    if (options.attachments && options.attachments.length) {
      payload.attachments = await Promise.all(
        options.attachments.map(async (attachment) => {
          let contentBuffer;

          if (attachment.path) {
            contentBuffer = await fs.readFile(attachment.path);
          } else if (attachment.content) {
            contentBuffer = Buffer.isBuffer(attachment.content)
              ? attachment.content
              : Buffer.from(attachment.content);
          } else {
            throw new Error(
              `Attachment "${attachment.filename || "unknown"}" has no path or content.`
            );
          }

          const item = {
            filename: attachment.filename || "attachment",
            content: contentBuffer.toString("base64"),
          };

          if (attachment.contentType || attachment.content_type) {
            item.content_type = attachment.contentType || attachment.content_type;
          }
          if (attachment.cid) item.content_id = attachment.cid;

          return item;
        })
      );
    }

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        result.message ||
        result.error ||
        `Resend request failed with HTTP ${response.status}.`;
      throw new Error(detail);
    }

    return {
      messageId: result.id,
      accepted: payload.to,
      response: result,
    };
  },
};

module.exports = emailTransporter;
