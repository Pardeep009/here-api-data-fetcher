const mongoose = require('mongoose');
const { sendMail } = require('../middlewares/nodeMailer');

const connectDB = async (dbUrl) => {
	try {
		await mongoose.connect(dbUrl, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
		});
		console.log('database running.....');
	} catch (err) {
		const mailOptions = {
			from: process.env.username,
			to: process.env.username,
			subject: 'DB connection Issue',
			text: `cannot connect to database`,
		  };
		  sendMail(mailOptions);
		console.error(err.message, 'cannot connect to database');
	}
};

const disConnectDB = async () => {
	try {
		await mongoose.connection.close();
		console.log('disconnected');
	} catch (err) {
		console.error('db connection not closed');
	}
};

const clearDB = async () => {
	try {
		const collections = Object.keys(mongoose.connection.collections);
		// eslint-disable-next-line no-restricted-syntax
		for (const collectionName of collections) {
			const collection = mongoose.connection.collections[collectionName];
			// eslint-disable-next-line no-await-in-loop
			await collection.deleteMany();
		}
	} catch (error) {
		console.error(error);
	}
};

module.exports = { connectDB, disConnectDB, clearDB };
