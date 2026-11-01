import { Response } from 'express';
import { PostStatus } from '@prisma/client';
import slugify from 'slugify';
import xss from 'xss';
import { prisma } from '../config/prisma';
import { streamToCloudinary } from '../utils/upload';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response';
import { AuthRequest } from '../types';
import { env } from '../config/env';

const SEL = {
  id:true, slug:true, title:true, description:true,
  category:true, location:true, imageUrl:true,
  status:true, featured:true, viewCount:true,
  likeCount:true, commentCount:true, createdAt:true, updatedAt:true,
  author: { select:{ id:true, name:true, avatarUrl:true, country:true } },
};

export async function getPosts(req: AuthRequest, res: Response): Promise<void> {
  const page  = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const skip  = (page-1)*limit;
  const category   = req.query.category   as string|undefined;
  const search     = req.query.search     as string|undefined;
  const sort       = (req.query.sort      as string)||'latest';
  const authorId   = req.query.authorId   as string|undefined;
  const includeAll = req.query.includeAll === 'true';

  const statusFilter = includeAll && authorId && req.user?.id===authorId
    ? {} : { status: PostStatus.APPROVED };

  const where = {
    ...statusFilter,
    ...(category && { category }),
    ...(authorId && { authorId }),
    ...(search && { OR: [
      { title:       { contains:search, mode:'insensitive' as const } },
      { description: { contains:search, mode:'insensitive' as const } },
      { location:    { contains:search, mode:'insensitive' as const } },
      { category:    { contains:search, mode:'insensitive' as const } },
    ]}),
  };

  const orderBy = sort==='trending' ? { likeCount:'desc' as const }
    : sort==='views' ? { viewCount:'desc' as const } : { createdAt:'desc' as const };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({ where, select:SEL, orderBy, skip, take:limit }),
    prisma.post.count({ where }),
  ]);

  let liked = new Set<string>();
  if (req.user) {
    const ls = await prisma.like.findMany({
      where: { userId:req.user.id, postId:{ in:posts.map(p=>p.id) } }, select:{ postId:true },
    });
    liked = new Set(ls.map(l=>l.postId));
  }
  sendSuccess(res, posts.map(p=>({...p,isLiked:liked.has(p.id)})), 'Posts fetched', 200,
    buildPaginationMeta(total,page,limit));
}

export async function getPost(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const post = await prisma.post.findFirst({
    where: { OR:[{id},{slug:id}], status:PostStatus.APPROVED },
    select: { ...SEL, comments: {
      select: { id:true, content:true, createdAt:true,
        author:{ select:{ id:true, name:true, avatarUrl:true } } },
      orderBy: { createdAt:'desc' }, take:50,
    }},
  });
  if (!post) { sendError(res,'Post not found',404); return; }
  prisma.post.update({ where:{id:post.id}, data:{ viewCount:{increment:1} } }).catch(()=>{});
  let isLiked = false;
  if (req.user) {
    const l = await prisma.like.findUnique({ where:{ postId_userId:{ postId:post.id, userId:req.user.id } } });
    isLiked = !!l;
  }
  sendSuccess(res, {...post,isLiked}, 'Post fetched');
}

export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  const { title, description, category, location } = req.body as {
    title:string; description:string; category:string; location?:string;
  };
  const safeTitle = xss(title.trim());
  const safeDesc  = xss(description.trim());
  const safeLoc   = location ? xss(location.trim()) : null;

  let slug = slugify(safeTitle, { lower:true, strict:true });
  if (await prisma.post.findUnique({ where:{slug} })) slug = `${slug}-${Date.now()}`;

  const status = req.user!.role==='ADMIN' ? PostStatus.APPROVED : PostStatus.PENDING;

  let imageUrl: string|null = null;
  let imagePublicId: string|null = null;
  if (req.file?.buffer && env.CLOUDINARY_CLOUD_NAME) {
    try {
      const r = await streamToCloudinary(req.file.buffer, 'taleswithsylvia/posts');
      imageUrl = r.secure_url; imagePublicId = r.public_id;
    } catch {}
  }

  const post = await prisma.post.create({
    data: { slug, title:safeTitle, description:safeDesc, category,
            location:safeLoc, imageUrl, imagePublicId, status, authorId:req.user!.id },
    select: SEL,
  });
  sendSuccess(res, post,
    status===PostStatus.APPROVED ? 'Story published!' : 'Story submitted for review!', 201);
}

export async function updatePost(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const post = await prisma.post.findUnique({ where:{id}, select:{authorId:true,imagePublicId:true} });
  if (!post) { sendError(res,'Not found',404); return; }
  if (post.authorId!==req.user!.id && req.user!.role!=='ADMIN') { sendError(res,'Not allowed',403); return; }
  const { title, description, category, location } = req.body as {
    title?:string; description?:string; category?:string; location?:string;
  };
  let imageUrl: string|undefined; let imagePublicId: string|undefined;
  if (req.file?.buffer && env.CLOUDINARY_CLOUD_NAME) {
    if (post.imagePublicId) {
      const { cloudinary } = await import('../config/cloudinary');
      await cloudinary.uploader.destroy(post.imagePublicId).catch(()=>{});
    }
    try {
      const r = await streamToCloudinary(req.file.buffer,'taleswithsylvia/posts');
      imageUrl=r.secure_url; imagePublicId=r.public_id;
    } catch {}
  }
  const updated = await prisma.post.update({
    where:{id}, select:SEL,
    data: {
      ...(title       && { title:       xss(title.trim()) }),
      ...(description && { description: xss(description.trim()) }),
      ...(category    && { category }),
      ...(location!==undefined && { location: location ? xss(location.trim()) : null }),
      ...(imageUrl    && { imageUrl, imagePublicId }),
    },
  });
  sendSuccess(res, updated, 'Post updated');
}

export async function deletePost(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const post = await prisma.post.findUnique({ where:{id}, select:{authorId:true,imagePublicId:true} });
  if (!post) { sendError(res,'Not found',404); return; }
  if (post.authorId!==req.user!.id && req.user!.role!=='ADMIN') { sendError(res,'Not allowed',403); return; }
  if (post.imagePublicId && env.CLOUDINARY_CLOUD_NAME) {
    const { cloudinary } = await import('../config/cloudinary');
    await cloudinary.uploader.destroy(post.imagePublicId).catch(()=>{});
  }
  await prisma.post.delete({ where:{id} });
  sendSuccess(res, null, 'Deleted');
}

export async function toggleLike(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.id;
  const post = await prisma.post.findUnique({ where:{id,status:PostStatus.APPROVED}, select:{id:true} });
  if (!post) { sendError(res,'Not found',404); return; }
  const ex = await prisma.like.findUnique({ where:{ postId_userId:{postId:id,userId} } });
  if (ex) {
    await prisma.$transaction([
      prisma.like.delete({ where:{ postId_userId:{postId:id,userId} } }),
      prisma.post.update({ where:{id}, data:{ likeCount:{decrement:1} } }),
    ]);
    sendSuccess(res,{liked:false},'Unliked');
  } else {
    await prisma.$transaction([
      prisma.like.create({ data:{postId:id,userId} }),
      prisma.post.update({ where:{id}, data:{ likeCount:{increment:1} } }),
    ]);
    sendSuccess(res,{liked:true},'Liked');
  }
}

export async function getStats(_r: AuthRequest, res: Response): Promise<void> {
  const [totalPosts,totalUsers,totalLikes,totalComments] = await prisma.$transaction([
    prisma.post.count({ where:{status:PostStatus.APPROVED} }),
    prisma.user.count(), prisma.like.count(), prisma.comment.count(),
  ]);
  sendSuccess(res,{totalPosts,totalUsers,totalLikes,totalComments},'Stats');
}
