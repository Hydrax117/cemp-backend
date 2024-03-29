import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        }
    })

    //Emails options
    let mailOptions = {
        from: process.env.EMAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
    }


    await transporter.sendMail(mailOptions);
}

export { sendEmail };
