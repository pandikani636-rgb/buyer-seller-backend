if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: 'config/config.env' });
}

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const errorMiddleware = require('./middlewares/error');
const path = require("path");
const cors = require('cors');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');
const categoryRoutes = require('./routes/categoryRoute');
const contactusRoutes = require('./routes/contactusRoute');
const roleRoutes = require('./routes/roleRoute');
const subCategoryRoutes = require('./routes/subCategoryRoute');

app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', payment);
app.use('/api/v1', categoryRoutes);
app.use('/api/v1', contactusRoutes);
app.use('/api/v1', roleRoutes);
app.use('/api/v1', subCategoryRoutes);
const seller = require('./routes/sellerRoutes');
app.use('/api/v1/seller', seller);

// serve uploaded images
app.use('/admin/product/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(errorMiddleware);

module.exports = app;
