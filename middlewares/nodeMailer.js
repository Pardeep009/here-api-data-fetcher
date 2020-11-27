const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: `${process.env.username}`,
		pass: `${process.env.password}`,
	},
});

exports.sendMail = (mailOptions) => {
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
		} else {
			console.log(`Email sent: ${info}`);
		}
	});
};
