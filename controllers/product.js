const Product = require("../models/product");
const formidable = require("formidable");
const { errorHandler } = require("../helpers/dbErrorHandler");
const _ = require("lodash");
const fs = require("fs");

exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error_message: "Product not found!"
        });
      }
      req.product = product;
      next();
    });
};

exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

exports.create = (req, res) => {
  const form = formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, file) => {
    if (err) {
      return res
        .status(400)
        .json({ error_message: "Image could not be uploaded" });
    }

    //check for all fields
    const { name, description, price, category, shipping, quantity } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !shipping ||
      !quantity
    ) {
      return res.status(400).json({
        error_message: "All fields are required"
      });
    }

    let product = new Product(fields);
    //files.photo photo is the name of the field that will be sent from the front end.

    if (file.photo) {
      if (file.photo.size > 1000000) {
        return res
          .status(400)
          .json({ error_message: "Image should be less than 1Mb in size" });
      }

      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error_message: errorHandler(err)
        });
      }
      res.json(result);
    });
  });
};

exports.update = (req, res) => {
  const form = formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, file) => {
    if (err) {
      return res
        .status(400)
        .json({ error_message: "Image could not be uploaded" });
    }
    //check for all fields
    /*const { name, description, price, category, shipping, quantity } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !shipping ||
      !quantity
    ) {
      return res.status(400).json({
        error_message: "All fields are required"
      });
    }
*/
    let product = req.product;
    product = _.extend(product, fields);
    //files.photo photo is the name of the field that will be sent from the front end.

    if (file.photo) {
      if (file.photo.size > 1000000) {
        return res
          .status(400)
          .json({ error_message: "Image should be less than 1Mb in size" });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error_message: errorHandler(err)
        });
      }
      res.json(result);
    });
  });
};

exports.list = (req, res) => {
  // http://localhost:8000/api/products?sortBy=sold&order=desc&limit=3
  // http://localhost:8000/api/products?sortBy=createdAt&order=asc&limit=3

  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, productList) => {
      if (err) {
        return res.status(400).json({
          error_message: "There is no products!"
        });
      }
      res.status(200).json({
        productList
      });
    });
};

/***** 
It will find products based on the the req product category,
other products that belongs to the same category will be returned
*/
exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  //The below request list all related product linked to the productId on the request except that one
  Product.find({ _id: { $ne: req.product }, category: req.product.category })
    .select("-photo")
    .limit(limit)
    .populate("category", "_id name")
    .exec((err, relatedProduct) => {
      if (err || !relatedProduct) {
        res.status(400).json({
          error_message: "Related products not found"
        });
      }
      res.status(201).json({
        relatedProduct
      });
    });
};

exports.listCategories = (req, res) => {
  Product.distinct("category", {}, (err, category) => {
    if (err) {
      res.status(400).json({
        error_message: "Categories not found!"
      });
    }
    res.status(200).json({
      category
    });
  });
};

exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1]
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  Product.find(findArgs)
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error_message: "Products not found"
        });
      }
      res.json({
        size: data.length,
        data
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    //return res.json(req.product.photo.data);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error_message: errorHandler(err)
      });
    }
    res.status(200).json({
      message: "Product successfully deleted"
    });
  });
};

exports.listSearch = (req, res) => {
  // create query object to hold search value and category value
  const query = {};
  //assign search value to query.name
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: "i" };
    //assign category to query.category
    if (req.query.category && req.query.category != "All") {
      query.category = req.query.category;
    }
    //find product based on query object with 2 properties
    //search and category

    Product.find(query, (err, products) => {
      if (err) {
        return res.status(400).json({
          error_message: errorHandler(err)
        });
      }
      res.status(200).json(products);
    }).select("-photo");
  }
};
exports.decreaseQuantity = (req, res, next) => {
  let bulkOpts = req.body.order.products.map(item => {
    return {
      updateOne: {
        filter: { _id: item._id },
        update: { $inc: { quantity: -item.count, sold: +item.count } }
      }
    };
  });

  Product.bulkWrite(bulkOpts, {}, (error, product) => {
    if (error) {
      return res.status(400).json({
        error_message: "Could not update the product"
      });
    }
    next();
  });
};
