const mongoose = require('mongoose');
const Branch = require('../Models/Branch');

/**
 * Returns an array of ObjectIds for all branches belonging to
 * the logged-in admin's restaurant.
 * 
 * If a specific branchId is requested (and it is valid), returns just that.
 * If no restaurantId is available (legacy / no auth), returns null (no filter).
 * 
 * @param {object} req  - Express request (needs req.admin.restaurantId from JWT)
 * @returns {{ filter: object, branchIds: ObjectId[]|null }}
 */
const getAdminBranchFilter = async (req) => {
  const { branchId } = req.query;

  if (req.staff && req.staff.branchId) {
    const oid = new mongoose.Types.ObjectId(req.staff.branchId);
    return { filter: { branchId: oid }, branchIds: [oid] };
  }

  const restaurantId = req.admin?.restaurantId;

  // ── Specific branch selected ────────────────────────────────────────────────
  if (
    branchId &&
    branchId !== 'all' &&
    branchId !== 'undefined' &&
    branchId !== '[object Object]' &&
    mongoose.Types.ObjectId.isValid(branchId)
  ) {
    const oid = new mongoose.Types.ObjectId(branchId);
    return { filter: { branchId: oid }, branchIds: [oid] };
  }

  // ── All branches for this admin's restaurant ────────────────────────────────
  if (restaurantId && mongoose.Types.ObjectId.isValid(String(restaurantId))) {
    const branches = await Branch.find({
      restaurantId: new mongoose.Types.ObjectId(String(restaurantId))
    }).select('_id');

    const branchIds = branches.map((b) => b._id);

    if (branchIds.length === 0) {
      // Admin has no branches yet → return empty result guard
      return { filter: { branchId: { $in: [] } }, branchIds: [] };
    }

    return { filter: { branchId: { $in: branchIds } }, branchIds };
  }

  // ── Fallback: no restaurantId in token (old token / public route) ───────────
  return { filter: {}, branchIds: null };
};

module.exports = getAdminBranchFilter;
