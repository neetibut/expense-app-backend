const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const Expense = require("../models/Expense");

// @route   GET /api/expenses
// @desc    Get all expenses for a user with searching and filtering
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { category, startDate, endDate, minAmount, maxAmount, description } =
      req.query;

    // Build the query object
    const query = { user: req.user.id };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        query.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.amount.$lte = parseFloat(maxAmount);
      }
    }

    // Search by description keyword
    if (description) {
      // Use a regular expression for case-insensitive partial match
      query.description = { $regex: description, $options: "i" };
    }

    // Fetch expenses based on the query
    const expenses = await Expense.find(query).sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post("/", auth, async (req, res) => {
  const { amount, category, date, description } = req.body;

  try {
    const newExpense = new Expense({
      user: req.user.id,
      amount,
      category,
      date,
      description,
    });

    const expense = await newExpense.save();
    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put(
  "/:id",
  [
    auth,
    [
      check("amount", "Amount must be a number").optional().isNumeric(),
      check("category", "Category is invalid")
        .optional()
        .isIn([
          "Food",
          "Transportation",
          "Utilities",
          "Entertainment",
          "Healthcare",
          "Other",
        ]),
      check("date", "Date must be a valid date").optional().isISO8601(),
      check("description", "Description must be a string")
        .optional()
        .isString(),
    ],
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Build expenseFields object
    const { amount, category, date, description } = req.body;

    const expenseFields = {};
    if (amount !== undefined) expenseFields.amount = amount;
    if (category) expenseFields.category = category;
    if (date) expenseFields.date = date;
    if (description) expenseFields.description = description;

    try {
      // Find expense by ID
      let expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ msg: "Expense not found" });
      }

      // Check user ownership
      if (expense.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: "User not authorized" });
      }

      // Update expense
      expense = await Expense.findByIdAndUpdate(
        req.params.id,
        { $set: expenseFields },
        { new: true }
      );

      res.json(expense);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Expense not found" });
      }
      res.status(500).send("Server Error");
    }
  }
);

// @route DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    // Find the expense by ID
    let expense = await Expense.findById(req.params.id);

    // If expense not found
    if (!expense) {
      return res.status(404).json({ msg: "Expense not found" });
    }

    // Check user ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Delete the expense
    await Expense.findByIdAndDelete(req.params.id);

    res.json({ msg: "Expense removed" });
  } catch (err) {
    console.error(err.message);

    // If the ObjectId is invalid
    if (err.kind === "ObjectId" || err.name === "CastError") {
      return res.status(404).json({ msg: "Expense not found" });
    }

    res.status(500).send("Server Error");
  }
});

module.exports = router;
