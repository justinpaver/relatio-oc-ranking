import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import { setRankByRankValue } from './RobloxRankingAPI';

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_AUTH_KEY = process.env.SERVER_AUTH_KEY;

app.use(express.json());

function authorizeRequest(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    
    if (!SERVER_AUTH_KEY || authHeader !== `Bearer ${SERVER_AUTH_KEY}`) {
        return res.status(401).json({ 
            success: false, 
            error: "Unauthorized: Invalid or missing server authorization key." 
        });
    }
    next();
}

app.post('/rank-user', authorizeRequest, async (req: Request, res: Response) => {
    const { userId, rankValue } = req.body;

    if (!userId || typeof rankValue !== 'number') {
        return res.status(400).json({ 
            success: false, 
            error: "Missing required parameters: userId (string) and rankValue (number)." 
        });
    }

    try {
        const newRole = await setRankByRankValue(String(userId), Number(rankValue));
        
        res.status(200).json({
            success: true,
            message: `User ${userId} successfully ranked to ${newRole.displayName} (Rank ${newRole.rank}).`,
            data: {
                userId: String(userId),
                displayName: newRole.displayName,
                rank: newRole.rank
            }
        });
    } catch (error) {
        console.error(`Ranking operation failed: ${error.message}`);
        res.status(500).json({
            success: false,
            error: `Ranking failed due to a server or API error: ${error.message}`
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Ranking API server running on port ${PORT}`);
    if (!SERVER_AUTH_KEY) {
        console.warn('⚠️ WARNING: SERVER_AUTH_KEY is not set. The authorization middleware will effectively fail all requests.');
    }
});
