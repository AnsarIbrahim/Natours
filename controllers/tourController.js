const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

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

// GeoSpatial Query

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // /tours-within/:distance/center/:latlng/unit/:unit
  // /tours-within/233/center/-40,45/unit/mi
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Convert distance to radians
  // Divide distance by radius of the Earth
  // Radius of the Earth = 3963.2 miles or 6378.1 kilometers
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // If there is no lat or lng, throw an error
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  // GeoSpatial Query
  // Find all documents within a certain distance from a starting point
  // GeoJSON: { type: 'Point', coordinates: [lng, lat] }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  // Send response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});
