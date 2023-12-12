const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const checkId = (req, res, next, val) => {
  exports.id = val * 1;
  exports.tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  req.tour = tour;
  next();
};

const app = express();

// MIDDLEWARES
app.use(morgan('dev'));

app.use(express.json());

app.use(express.static(`${__dirname}/public`));

// ROUTES
app.param('id', checkId);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
