const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// Route Handlers
exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  await Tour.findByIdAndDelete(req.params.id);
  // Tour.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

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
