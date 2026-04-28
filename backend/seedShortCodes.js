require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('./Models/Item');
const Combo = require('./Models/Combo');

mongoose.connect(process.env.MONGODB_URL)
.then(async () => {
  console.log("Connected to DB:", process.env.MONGODB_URL);
  const items = await Item.find({});
  let n = 101;
  for (let item of items) {
    if (!item.alphaShortCode || !item.numericShortCode) {
      const baseWord = item.name.split(' ')[0].substring(0, 2).toUpperCase() || 'IT';
      item.alphaShortCode = baseWord + (Math.floor(Math.random() * 90) + 10); 
      item.numericShortCode = (n++).toString();
      await item.save();
      console.log(`Updated Item: ${item.name} -> Alpha: ${item.alphaShortCode}, Numeric: ${item.numericShortCode}`);
    } else {
      console.log(`Item already has codes: ${item.name} -> Alpha: ${item.alphaShortCode}, Numeric: ${item.numericShortCode}`);
    }
  }

  const combos = await Combo.find({});
  let c = 501;
  for (let combo of combos) {
    if (!combo.alphaShortCode || !combo.numericShortCode) {
      const baseWord = combo.name.split(' ')[0].substring(0, 2).toUpperCase() || 'CB';
      combo.alphaShortCode = 'CB' + (Math.floor(Math.random() * 90) + 10);
      combo.numericShortCode = (c++).toString();
      await combo.save();
      console.log(`Updated Combo: ${combo.name} -> Alpha: ${combo.alphaShortCode}, Numeric: ${combo.numericShortCode}`);
    } else {
      console.log(`Combo already has codes: ${combo.name} -> Alpha: ${combo.alphaShortCode}, Numeric: ${combo.numericShortCode}`);
    }
  }

  console.log("Migration complete");
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
