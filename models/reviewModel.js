const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a review'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating'],
      min: [1, 'A review must have a rating above or equal to 1.0'],
      max: [5, 'A review must have a rating below or equal to 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.66666, 47, 4.7
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // Parent referencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    // Child referencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  // Options object
  {
    // To make sure that virtual properties are also shown when outputting the document as JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// Static method

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this points to the current model
  // this.aggregate([
  //   {
  //     $match: { tour: tourId },
  //   },
  //   {
  //     $group: {
  //       _id: '$tour',
  //       nRating: { $sum: 1 },
  //       avgRating: { $avg: '$rating' },
  //     },
  //   },
  // ]);

  // The above code will return an array of objects, but we want to update the tour document
  // with the calculated average rating and the number of ratings. So we will use the following
  // code instead:
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        // _id: '$tour',
        _id: null,
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats);

  // Update the tour document
  if (stats.length > 0) {
    await this.model('Tour').findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating.toFixed(2),
    });
  } else {
    await this.model('Tour').findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  // this.constructor points to the model that created the document
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this points to the current query
  // this.r points to the review document
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
