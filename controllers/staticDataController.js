const StaticData = require("../models/StaticData");

// ── GET all entries, optionally filtered by category
exports.getAll = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const items = await StaticData.find(filter).sort({ category: 1, sortOrder: 1, label: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch static data", error: err.message });
  }
};

// ── GET single entry
exports.getById = async (req, res) => {
  try {
    const item = await StaticData.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Entry not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── CREATE new entry
exports.create = async (req, res) => {
  try {
    const { category, label, value, hexCode, sortOrder } = req.body;

    if (!category || !label || !value) {
      return res.status(400).json({ message: "category, label and value are required" });
    }

    const item = await StaticData.create({ category, label, value, hexCode, sortOrder });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A entry with this value already exists in this category" });
    }
    res.status(500).json({ message: err.message });
  }
};

// ── UPDATE entry
exports.update = async (req, res) => {
  try {
    const { label, value, hexCode, isActive, sortOrder } = req.body;

    const item = await StaticData.findByIdAndUpdate(
      req.params.id,
      { label, value, hexCode, isActive, sortOrder },
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: "Entry not found" });
    res.json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A entry with this value already exists in this category" });
    }
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE entry
exports.remove = async (req, res) => {
  try {
    const item = await StaticData.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Entry not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── SEED default data (called on server start if empty)
exports.seedDefaults = async () => {
  try {
    const count = await StaticData.countDocuments();
    if (count > 0) return;

    const defaults = [
      // Plate Thickness
      { category: "plateThickness", label: "1.14 mm", value: "1.14", sortOrder: 1 },
      { category: "plateThickness", label: "1.70 mm", value: "1.70", sortOrder: 2 },
      { category: "plateThickness", label: "2.28 mm", value: "2.28", sortOrder: 3 },
      { category: "plateThickness", label: "2.54 mm", value: "2.54", sortOrder: 4 },
      { category: "plateThickness", label: "2.84 mm", value: "2.84", sortOrder: 5 },
      { category: "plateThickness", label: "3.94 mm", value: "3.94", sortOrder: 6 },

      // Screen Ruling
      { category: "screenRuling", label: "85 LPI", value: "85", sortOrder: 1 },
      { category: "screenRuling", label: "100 LPI", value: "100", sortOrder: 2 },
      { category: "screenRuling", label: "120 LPI", value: "120", sortOrder: 3 },
      { category: "screenRuling", label: "133 LPI", value: "133", sortOrder: 4 },
      { category: "screenRuling", label: "150 LPI", value: "150", sortOrder: 5 },

      // Job Type
      { category: "jobType", label: "Wide Web", value: "Wide Web", sortOrder: 1 },
      { category: "jobType", label: "Narrow Web", value: "Narrow Web", sortOrder: 2 },
      { category: "jobType", label: "Stationary", value: "Stationary", sortOrder: 3 },
      { category: "jobType", label: "Other", value: "Other", sortOrder: 4 },

      // Plate Type
      { category: "plateType", label: "Flexo", value: "Flexo", sortOrder: 1 },
      { category: "plateType", label: "Offset", value: "Offset", sortOrder: 2 },
      { category: "plateType", label: "Digital", value: "Digital", sortOrder: 3 },

      // Colour Library
      { category: "colourLibrary", label: "Pantone 485 C (Red)", value: "Pantone 485 C", hexCode: "#DA291C", sortOrder: 1 },
      { category: "colourLibrary", label: "Pantone 286 C (Blue)", value: "Pantone 286 C", hexCode: "#0032A0", sortOrder: 2 },
      { category: "colourLibrary", label: "Pantone 348 C (Green)", value: "Pantone 348 C", hexCode: "#00843D", sortOrder: 3 },
      { category: "colourLibrary", label: "Pantone 109 C (Yellow)", value: "Pantone 109 C", hexCode: "#FFD700", sortOrder: 4 },
      { category: "colourLibrary", label: "Pantone Black C", value: "Pantone Black C", hexCode: "#2B2B2C", sortOrder: 5 },
    ];

    await StaticData.insertMany(defaults);
    console.log("✅ Static data seeded with defaults");
  } catch (err) {
    console.error("Static data seed error:", err.message);
  }
};
