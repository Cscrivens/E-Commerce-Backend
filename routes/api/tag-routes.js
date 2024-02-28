const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// GET all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.findAll({
      include: [{ model: Product, through: ProductTag }],
    });
    res.status(200).json(tags);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET one tag by id
router.get('/:id', async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id, {
      include: [{ model: Product, through: ProductTag }],
    });
    if (!tag) {
      res.status(404).json({ message: 'No tag found with this id' });
      return;
    }
    res.status(200).json(tag);
  } catch (err) {
    res.status(500).json(err);
  }
});

// POST create new tag
router.post('/', async (req, res) => {
  try {
    const tag = await Tag.create(req.body);
    if (req.body.productIds && req.body.productIds.length) {
      const productTagIdArr = req.body.productIds.map((product_id) => {
        return {
          tag_id: tag.id,
          product_id,
        };
      });
      await ProductTag.bulkCreate(productTagIdArr);
    }
    res.status(200).json(tag);
  } catch (err) {
    res.status(400).json(err);
  }
});

// PUT update tag by id
router.put('/:id', async (req, res) => {
  try {
    const tag = await Tag.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    if (req.body.productIds && req.body.productIds.length) {
      const productTags = await ProductTag.findAll({
        where: { tag_id: req.params.id },
      });
      const productTagIds = productTags.map(({ product_id }) => product_id);
      const newProductTags = req.body.productIds
        .filter((product_id) => !productTagIds.includes(product_id))
        .map((product_id) => {
          return {
            tag_id: req.params.id,
            product_id,
          };
        });
      const productTagsToRemove = productTags
        .filter(({ product_id }) => !req.body.productIds.includes(product_id))
        .map(({ id }) => id);
      await Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    }
    res.status(200).json(tag);
  } catch (err) {
    res.status(400).json(err);
  }
});

// DELETE one tag by id
router.delete('/:id', async (req, res) => {
  try {
    const tag = await Tag.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (!tag) {
      res.status(404).json({ message: 'No tag found with this id' });
      return;
    }
    res.status(200).json(tag);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;

