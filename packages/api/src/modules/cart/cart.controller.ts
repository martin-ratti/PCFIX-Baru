import { Request, Response } from 'express';
import { CartService } from './cart.service';

const cartService = new CartService();

export const syncCart = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.body.userId);
        const items = req.body.items;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const cart = await cartService.syncCart(userId, items || []);
        res.json({ success: true, data: cart });
    } catch (error) {
        console.error('Cart Sync Error:', error);
        res.status(500).json({ success: false, error: 'Failed to sync cart' });
    }
};

export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.userId);
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const cart = await cartService.getCart(userId);
        res.json({ success: true, data: cart });
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({ success: false, error: 'Failed to get cart' });
    }
};
