const nodemailer = require('nodemailer')


const transporter = nodemailer.createTransport({
    service: 'gmail',
    // port: 465,
    // secure: true,
    auth: {
        user: "divasole.emporium@gmail.com",
        pass: "bevnsxgoefzfzbzf",
    },
});


const email = async (obj) => {
    const info = await transporter.sendMail(obj);
    return info
}

 module.exports = email