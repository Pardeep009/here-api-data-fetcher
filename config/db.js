const mongoose = require('mongoose');

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
