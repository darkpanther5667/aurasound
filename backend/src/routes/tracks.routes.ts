import { Router } from 'express';
import { getTrending, searchTracks, getTrackStream, proxyTrackAudio } from '../controllers/tracks.controller.js';

const router = Router();

router.get('/trending', getTrending);
router.get('/search', searchTracks);
router.get('/:id/stream', getTrackStream);
router.get('/:id/audio', proxyTrackAudio);

export default router;
