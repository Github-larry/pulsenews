// routes/posts.routes.ts
// All post-related routes including comments, likes, reports
import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler }  from '../utils/asyncHandler';
import { uploadPostImage } from '../utils/upload';
import {
  authenticate, optionalAuth, validateRequest, handleUploadError,
} from '../middleware';
import {
  createPostValidator, commentValidator,
  reportValidator, paginationValidator, cuidParamValidator,
} from '../validators';
import * as posts    from '../controllers/posts.controller';
import * as comments from '../controllers/comments.controller';
import * as reports  from '../controllers/reports.controller';

const router = Router();

// ── Helper: wrap multer to handle errors cleanly ──────────────
function withUpload(middleware: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    (middleware as Function)(req, res, (err: Error) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  };
}

// ── Public / optional auth ────────────────────────────────────
router.get('/',
  optionalAuth,
  paginationValidator,
  validateRequest,
  asyncHandler(posts.getPosts)
);

router.get('/stats',
  asyncHandler(posts.getStats)
);

router.get('/:id',
  optionalAuth,
  cuidParamValidator('id'),
  validateRequest,
  asyncHandler(posts.getPost)
);

// ── Authenticated ─────────────────────────────────────────────
router.post('/',
  authenticate,
  withUpload(uploadPostImage),
  createPostValidator,
  validateRequest,
  asyncHandler(posts.createPost)
);

router.patch('/:id',
  authenticate,
  withUpload(uploadPostImage),
  cuidParamValidator('id'),
  validateRequest,
  asyncHandler(posts.updatePost)
);

router.delete('/:id',
  authenticate,
  cuidParamValidator('id'),
  validateRequest,
  asyncHandler(posts.deletePost)
);

router.post('/:id/like',
  authenticate,
  cuidParamValidator('id'),
  validateRequest,
  asyncHandler(posts.toggleLike)
);

// ── Comments ──────────────────────────────────────────────────
router.get('/:postId/comments',
  paginationValidator,
  validateRequest,
  asyncHandler(comments.getComments)
);

router.post('/:postId/comments',
  authenticate,
  commentValidator,
  validateRequest,
  asyncHandler(comments.createComment)
);

router.delete('/comments/:commentId',
  authenticate,
  asyncHandler(comments.deleteComment)
);

// ── Reports ───────────────────────────────────────────────────
router.post('/:postId/report',
  authenticate,
  reportValidator,
  validateRequest,
  asyncHandler(reports.createReport)
);

export default router;
