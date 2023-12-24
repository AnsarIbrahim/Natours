const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// Route Handlers
exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// Aggregation Pipeline
// 1. Match
exports.getTourStats = catchAsync(async (req, res, next) => {
  // Aggregate returns an aggregate object
  const stats = await Tour.aggregate([
    {
      // Match documents
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      // Group documents
      $group: {
        // _id: null,
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        // _id: '$price',
        numTours: { $sum: 1 }, // Add 1 for each document
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' }, // Calculate average
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' }, // Calculate minimum
        maxPrice: { $max: '$price' }, // Calculate maximum
      },
    },
    {
      // Sort documents
      $sort: { avgPrice: 1 },
    },
    // {
    //   // Filter documents
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// 2. Unwind
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // Aggregate returns an aggregate object
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      // Deconstruct an array field from the input documents to output a document for each element
      $unwind: '$startDates',
    },
    {
      // Match documents
      $match: {
        // Filter documents
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      // Group documents
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 }, // Add 1 for each document
        tours: { $push: '$name' }, // Add name for each document
      },
    },
    {
      // Add fields
      $addFields: { month: '$_id' },
    },
    {
      // Project fields
      $project: {
        _id: 0, // Hide _id field
      },
    },
    {
      // Sort documents
      $sort: { numTourStarts: -1 },
    },
    {
      // Limit documents
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});
