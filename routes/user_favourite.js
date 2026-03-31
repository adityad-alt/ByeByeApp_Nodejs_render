// routes/favouriteRoutes.js

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const Favourite = require("../models/byebyeUserFavouriteList");


// ✅ GET → Get all favourites of logged-in user
// Optional query: ?item_type=Packages|Boats|Food|...
router.get("/", auth, async (req, res) => {
  try {
    const user_id = req.user?.user_id ?? req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    const { item_type } = req.query;

    const where = { user_id };
    if (item_type) {
      where.item_type = item_type;
    }

    const favourites = await Favourite.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      data: favourites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// ✅ POST → Add to favourites
router.post("/", auth, async (req, res) => {
  try {
    const user_id = req.user?.user_id ?? req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    const { item_id, item_type } = req.body;

    if (!item_id && item_id !== 0) {
      return res.status(400).json({
        message: "item_id is required",
      });
    }

    // check if already exists (per item + type for this user)
    const existing = await Favourite.findOne({
      where: { user_id, item_id, item_type },
    });

    if (existing) {
      return res.status(400).json({
        message: "Already in favourites",
      });
    }

    const favourite = await Favourite.create({
      user_id,
      item_id,
      item_type,
    });

    return res.status(201).json({
      success: true,
      data: favourite,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ DELETE → Remove favourite by its row id
// DELETE /user-favourite/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const user_id = req.user?.user_id ?? req.user?.id;
    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const favId = req.params.id;
    if (!favId) {
      return res
        .status(400)
        .json({ success: false, message: "Favourite id is required" });
    }

    const deleted = await Favourite.destroy({
      where: { id: favId, user_id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Favourite not found" });
    }

    return res.json({
      success: true,
      message: "Favourite removed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;