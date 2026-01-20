require('dotenv').config();

const { sequelize } = require('./models');
const { app } = require('./app');

const port = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.authenticate();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
