import { Request, Response } from 'express';
import { FavoriteService } from './favorites.service';

const favoriteService = new FavoriteService();

export const getByUserId = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.userId);

        const favorites = await favoriteService.getFavoritesByUserId(userId);

        const products = favorites.map(f => f.producto);

        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener favoritos' });
    }
};

export const toggleFavorite = async (req: Request, res: Response) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ success: false, error: 'Faltan IDs de usuario/producto' });
        }

        const result = await favoriteService.toggleFavorite(Number(userId), Number(productId));
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al alternar favorito' });
    }
};