import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import { streamToCloudinary } from '../utils/upload';
import { env } from '../config/env';
import { logger } from '../config/logger';

const COOKIE = {
  httpOnly: true, secure: env.IS_PROD,
  sameSite: env.IS_PROD ? ('none' as const) : ('lax' as const),
  maxAge: getRefreshTokenExpiry(), path: '/',
};

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, country } = req.body as {
    name: string; email: string; password: string; country?: string;
  };
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) { sendError(res, 'An account with this email already exists', 409); return; }
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hash, country: country ?? null },
    select: { id:true, name:true, email:true, role:true, country:true,
              bio:true, avatarUrl:true, status:true, createdAt:true },
  });
  const payload = { id:user.id, email:user.email, role:user.role, name:user.name };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.refreshToken.create({
    data: { token:refreshToken, userId:user.id, expiresAt: new Date(Date.now()+getRefreshTokenExpiry()) },
  });
  res.cookie('refreshToken', refreshToken, COOKIE);
  logger.info(`Registered: ${user.email}`);
  sendSuccess(res, { user, accessToken }, 'Account created successfully', 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email:string; password:string };
  const user = await prisma.user.findUnique({ where: { email } });
  const hash = user?.password ?? '$2b$12$invalidhashtopreventtimingattacks00000000000';
  const ok   = await bcrypt.compare(password, hash);
  if (!user || !ok) { sendError(res, 'Invalid email or password', 401); return; }
  if (user.status === 'BANNED')    { sendError(res, 'Account suspended.', 403); return; }
  if (user.status === 'SUSPENDED') { sendError(res, 'Account temporarily suspended.', 403); return; }
  const payload = { id:user.id, email:user.email, role:user.role, name:user.name };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.refreshToken.deleteMany({ where: { userId:user.id, expiresAt:{ lt:new Date() } } });
  await prisma.refreshToken.create({
    data: { token:refreshToken, userId:user.id, expiresAt: new Date(Date.now()+getRefreshTokenExpiry()) },
  });
  res.cookie('refreshToken', refreshToken, COOKIE);
  logger.info(`Login: ${user.email}`);
  sendSuccess(res, {
    user: { id:user.id, name:user.name, email:user.email, role:user.role,
            country:user.country, avatarUrl:user.avatarUrl, bio:user.bio,
            status:user.status, createdAt:user.createdAt },
    accessToken,
  }, 'Login successful');
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken as string|undefined;
  if (!token) { sendError(res, 'No refresh token', 401); return; }
  let payload;
  try { payload = verifyRefreshToken(token); }
  catch { res.clearCookie('refreshToken',{path:'/'}); sendError(res,'Invalid token',401); return; }
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    res.clearCookie('refreshToken',{path:'/'}); sendError(res,'Token expired',401); return;
  }
  const user = await prisma.user.findUnique({ where: { id:payload.id } });
  if (!user || user.status==='BANNED') {
    await prisma.refreshToken.delete({ where:{token} }).catch(()=>{});
    res.clearCookie('refreshToken',{path:'/'}); sendError(res,'Account inactive',401); return;
  }
  await prisma.refreshToken.delete({ where:{token} });
  const p2 = { id:user.id, email:user.email, role:user.role, name:user.name };
  const na = signAccessToken(p2); const nr = signRefreshToken(p2);
  await prisma.refreshToken.create({
    data: { token:nr, userId:user.id, expiresAt:new Date(Date.now()+getRefreshTokenExpiry()) },
  });
  res.cookie('refreshToken', nr, COOKIE);
  sendSuccess(res, { accessToken:na }, 'Token refreshed');
}
export const refreshToken = refresh;

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken as string|undefined;
  if (token) await prisma.refreshToken.deleteMany({ where:{token} }).catch(()=>{});
  res.clearCookie('refreshToken', {...COOKIE, maxAge:0});
  sendSuccess(res, null, 'Logged out');
}

export async function logoutAll(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) { sendError(res,'Unauthorized',401); return; }
  await prisma.refreshToken.deleteMany({ where:{ userId:req.user.id } });
  res.clearCookie('refreshToken', {...COOKIE, maxAge:0});
  sendSuccess(res, null, 'Logged out from all devices');
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id:req.user!.id },
    select: { id:true, name:true, email:true, role:true, country:true, bio:true,
              avatarUrl:true, status:true, createdAt:true,
              _count:{ select:{ posts:true, comments:true } } },
  });
  if (!user) { sendError(res,'Not found',404); return; }
  sendSuccess(res, user, 'User fetched');
}

export async function updateMe(req: AuthRequest, res: Response): Promise<void> {
  const { name, bio, country } = req.body as { name?:string; bio?:string; country?:string };
  const updated = await prisma.user.update({
    where: { id:req.user!.id },
    data: {
      ...(name    !== undefined && { name }),
      ...(bio     !== undefined && { bio }),
      ...(country !== undefined && { country }),
    },
    select: { id:true, name:true, email:true, role:true, country:true,
              bio:true, avatarUrl:true, status:true, createdAt:true },
  });
  sendSuccess(res, updated, 'Profile updated');
}

export async function updateAvatar(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file?.buffer) { sendError(res,'No image',400); return; }
  if (!env.CLOUDINARY_CLOUD_NAME) { sendError(res,'Uploads not configured',503); return; }
  const cur = await prisma.user.findUnique({ where:{id:req.user!.id}, select:{avatarPublicId:true} });
  if (cur?.avatarPublicId) {
    const { cloudinary } = await import('../config/cloudinary');
    await cloudinary.uploader.destroy(cur.avatarPublicId).catch(()=>{});
  }
  const result = await streamToCloudinary(req.file.buffer, 'taleswithsylvia/avatars',
    [{ width:400, height:400, crop:'fill', gravity:'face', quality:'auto:good' }]);
  const updated = await prisma.user.update({
    where: { id:req.user!.id },
    data: { avatarUrl:result.secure_url, avatarPublicId:result.public_id },
    select: { id:true, avatarUrl:true },
  });
  sendSuccess(res, updated, 'Avatar updated');
}
