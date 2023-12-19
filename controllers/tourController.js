const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  // Add some query parameters to req.query
  // This will be handled by getAllTours()
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  // Call next() to pass control to the next middleware function
  next();
};

// Route Handlers
exports.getAllTours = async (req, res) => {
  try {
    // EXECUTE QUERY
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({});
    // newTour.save();

    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent!',
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({ _id: req.params.id })

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    // Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

// Aggregation Pipeline
// 1. Match
exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

// 2. Unwind
exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
