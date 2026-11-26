const cartRepository = require('../repositories/cartRepository');

const checkCartOwner = (req, res, next) => {
    const { user_id } = req.params;

    if (Number(user_id) !== Number(req.user.user_id)) {
        return res.status(403).json({
            message: 'Access denied. You can only access your own cart.'
        });
    }

    next();
};

const getCart = async (req, res) => {
    try {
        const { user_id } = req.params;

        const carts = await cartRepository.getByUserId(user_id);

        if (carts.length === 0) {
            return res.status(200).json({
                message: 'Cart is empty.',
                items: []
            });
        }

        const cart_id = carts[0].cart_id;

        const items = await cartRepository.getItems(cart_id);

        res.status(200).json({
            message: 'Cart retrieved successfully!',
            cart_id: cart_id,
            items: items
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve cart.',
            error: error.message
        });
    }
};

const addToCart = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { product_id, quantity } = req.body;

        if (
            !Number.isInteger(Number(product_id)) ||
            Number(product_id) <= 0 ||
            quantity === undefined ||
            quantity === null ||
            quantity === '' ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                message: 'Valid product ID and positive whole-number quantity are required.'
            });
        }

        const products = await cartRepository.getProductById(product_id);

        if (products.length === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        const product = products[0];

        const carts = await cartRepository.getByUserId(user_id);

        let cart_id;

        if (carts.length === 0) {
            const newCart = await cartRepository.createCart(user_id);
            cart_id = newCart.insertId;
        } else {
            cart_id = carts[0].cart_id;
        }

        const existingItems = await cartRepository.getCartItem(
            cart_id,
            product_id
        );

        let totalQuantity = Number(quantity);

        if (existingItems.length > 0) {
            totalQuantity += Number(existingItems[0].quantity);
        }

        if (totalQuantity > Number(product.stock)) {
            return res.status(400).json({
                message: 'Not enough stock available.'
            });
        }

        if (existingItems.length > 0) {
            await cartRepository.updateCartItemQuantity(
                totalQuantity,
                existingItems[0].cart_item_id
            );
        } else {
            await cartRepository.createCartItem(
                cart_id,
                product_id,
                quantity
            );
        }

        res.status(201).json({
            message: 'Product added to cart successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to add product to cart.',
            error: error.message
        });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { user_id, cart_item_id } = req.params;
        const { quantity } = req.body;

        if (
            quantity === undefined ||
            quantity === null ||
            quantity === '' ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                message: 'Quantity must be a positive whole number.'
            });
        }

        const items = await cartRepository.getCartItemWithStock(
            cart_item_id,
            user_id
        );

        if (items.length === 0) {
            return res.status(404).json({
                message: 'Cart item not found.'
            });
        }

        if (Number(quantity) > Number(items[0].stock)) {
            return res.status(400).json({
                message: 'Not enough stock available.'
            });
        }

        await cartRepository.updateCartItemQuantity(
            quantity,
            cart_item_id
        );

        res.status(200).json({
            message: 'Cart quantity updated successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update cart quantity.',
            error: error.message
        });
    }
};

const removeCartItem = async (req, res) => {
    try {
        const { user_id, cart_item_id } = req.params;

        const result = await cartRepository.deleteCartItem(
            cart_item_id,
            user_id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Cart item not found.'
            });
        }

        res.status(200).json({
            message: 'Product removed from cart successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to remove product from cart.',
            error: error.message
        });
    }
};

module.exports = {
    checkCartOwner,
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem
};