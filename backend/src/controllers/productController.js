const productRepository = require('../repositories/productRepository');

const getAllProducts = async (req, res) => {
    try {
        const products = await productRepository.getAll();

        res.status(200).json({
            message: 'Products retrieved successfully!',
            products: products
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve products.',
            error: error.message
        });
    }
};

const addProduct = async (req, res) => {
    try {
        const {
            category_id,
            product_name,
            description,
            price,
            stock
        } = req.body;

        if (
            !category_id ||
            !product_name ||
            price === undefined ||
            price === null ||
            price === '' ||
            stock === undefined ||
            stock === null ||
            stock === ''
        ) {
            return res.status(400).json({
                message: 'Please provide category_id, product_name, price, and stock.'
            });
        }

        if (
            isNaN(Number(price)) ||
            isNaN(Number(stock)) ||
            Number(price) <= 0 ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: 'Price must be greater than 0 and stock cannot be negative.'
            });
        }

        const result = await productRepository.create(
            category_id,
            product_name,
            description,
            price,
            stock
        );

        res.status(201).json({
            message: 'Product added successfully!',
            product_id: result.insertId
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to add product.',
            error: error.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            product_name,
            description,
            price,
            stock,
            category_id
        } = req.body;

        if (
            !category_id ||
            !product_name ||
            price === undefined ||
            price === null ||
            price === '' ||
            stock === undefined ||
            stock === null ||
            stock === ''
        ) {
            return res.status(400).json({
                message: 'Please provide category_id, product_name, price, and stock.'
            });
        }

        if (
            isNaN(Number(price)) ||
            isNaN(Number(stock)) ||
            Number(price) <= 0 ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: 'Price must be greater than 0 and stock cannot be negative.'
            });
        }

        const result = await productRepository.update(
            id,
            product_name,
            description,
            price,
            stock,
            category_id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        res.status(200).json({
            message: 'Product updated successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update product.',
            error: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await productRepository.deleteById(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        res.status(200).json({
            message: 'Product deleted successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete product.',
            error: error.message
        });
    }
};

module.exports = {
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct
};