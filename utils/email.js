import nodemailer from "nodemailer";
import HTML_TEMPLATE from "./mail-template.js";

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: process.env.SERVICE,
        host: process.env.EMAIL_HOST,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        }
    })

    //Emails options
    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: HTML_TEMPLATE(options.message),
    }


    await transporter.sendMail(mailOptions);
}

export { sendEmail };
