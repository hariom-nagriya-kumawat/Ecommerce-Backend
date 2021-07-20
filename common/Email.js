const commonSmtp = require("./index");
const fs = require("fs");
var path = require("path");

const AvailiableTemplates = {
  SIGNUP_CONFIRMATION: "signupConfirm",
  SIGNUP_CONFIRMATION_ARABIC: "signupConfirmArabic",
  SIGNUP: "signup",
  SIGNUP_ARABIC: "signupArabic",
  FORGET_PASSWORD: "forgotPassword",
  FORGET_PASSWORD_ARABIC: "forgotPasswordArabic",
  EMAIL_CHANGE: "emailChange",
  STATUS_CHANGE: "statusChange",
};
class Email {
  constructor(req) {
    const host =
      req.headers && req.headers.referer
        ? req.headers.referer.split("/")
        : null;
    this.host = host ? [host[0], host[1], host[2]].join("/") : null;
    this.body = "";
    this.subject = "";
    this.to = "";
    this.cc = [];
    this.attachments = [];
  }
  async setTemplate(templateName, replaceObject = {}) {
    if (!templateName) {
      throw new Error("Please provide template name", 400);
    }
    switch (templateName) {
      case AvailiableTemplates.SIGNUP_CONFIRMATION:
        this.subject = "[E-Service] Please confirm your email address";
        break;
      case AvailiableTemplates.SIGNUP_CONFIRMATION_ARABIC:
        this.subject =
          "[E-Service] يرجى تأكيد عنوان البريد الإلكتروني الخاص بك";
        break;
      case AvailiableTemplates.SIGNUP:
        this.subject = "[E-Service] Registration";
        break;
      case AvailiableTemplates.SIGNUP_ARABIC:
        this.subject = "[E-Service] التسجيل";
        break;
      case AvailiableTemplates.FORGET_PASSWORD:
        this.subject = "[E-Service] Reset Password";
        break;
      case AvailiableTemplates.FORGET_PASSWORD_ARABIC:
        this.subject = "[E-Service] إعادة تعيين كلمة المرور";
        break;
      case AvailiableTemplates.EMAIL_CHANGE:
        this.subject = "[E-Service] Email Change";
        break;
      case AvailiableTemplates.STATUS_CHANGE:
        this.subject = "[E-Service] Account Status Change";
        break;
      default:
        throw new Error("Invalid template name", 400);
    }
    let content = fs.readFileSync(
      path.join(__dirname, `./emailtemplates/${templateName}.html`),
      "utf8"
    );
    replaceObject.webURL = this.host;

    for (const key in replaceObject) {
      if (replaceObject.hasOwnProperty(key)) {
        const val = replaceObject[key];
        content = content.replace(new RegExp(`{${key}}`, "g"), val);
      }
    }
    this.body = content;
    return content;
  }
  setSubject(subject) {
    this.subject = subject;
  }
  setBody(body) {
    this.body = body;
  }
  setAttachements(attachments) {
    this.attachments = attachments;
  }
  setCC(cc) {
    this.cc = cc;
  }
  async sendEmail(email) {
    if (!email) {
      throw new Error("Please provide email.");
    }
    const mailOption = {
      from: "E-Service <nadira.khan.sdbg@gmail.com>",
      to: this.to || email,
      cc: this.cc,
      subject: this.subject,
      html: this.body,
      debug: true,
      attachments: this.attachments,
    };
    const resp = await commonSmtp.smtpTransport.sendMail(mailOption);
    return resp;
  }
}

module.exports = {
  Email,
  AvailiableTemplates,
};
