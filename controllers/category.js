const Category = require("../models/category");
const { errorHandler } = require("../helpers/dbErrorHandler");
const _ = require("lodash");

exports.create = (req, res) => {
  const category = new Category(req.body);
  category.save((err, data) => {
    if (err) {
      return res.status(400).json({ error_message: errorHandler(err) });
    }
    res.status(200).json({ data });
  });
};

exports.categoryById = (req, res, next, id) => {
  Category.findById(id).exec((err, category) => {
    if (err || !category) {
      return res.status(400).json({
        message: "Category not found!"
      });
    }
    req.category = category;
    next();
  });
};

exports.read = (req, res) => {
  return res.json(req.category);
};

exports.update = (req, res) => {
  let category = req.category;
  category.name = req.body.name;

  category.save((err, category) => {
    if (err) {
      return res.status(400).json({
        error_message: errorHandler(err)
      });
    }
    res.status(200).json({
      category
    });
  });
};

exports.remove = (req, res) => {
  let category = req.category;
  category.remove((err, category) => {
    if (err) {
      return res.status(400).json({
        error_message: errorHandler(err)
      });
    }
    res.status(200).json({
      category,
      message: "Category successfully deleted"
    });
  });
};

exports.list = (req, res) => {
  Category.find().exec((err, categories) => {
    if (err) {
      return res.status(400).json({
        message: "No categories recorded!"
      });
    }
    res.status(201).json({
      categories
    });
  });
};
