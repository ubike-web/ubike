const { createTransport } = require("nodemailer");

const transport = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  const info = await transport.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html,
  });
  console.log("Email sent:", info.messageId);
};

module.exports = {
  sendMail,
};
