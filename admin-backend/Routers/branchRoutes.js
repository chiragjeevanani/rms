const express = require('express');
const router = express.Router();
const branchController = require('../Controllers/branchController');

router.post('/', branchController.createBranch);
router.get('/', branchController.getBranches);
router.put('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

module.exports = router;
