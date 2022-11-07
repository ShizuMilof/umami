import { NextApiRequestAuth } from 'interface/nextApi';
import { useAuth } from 'lib/middleware';
import { NextApiResponse } from 'next';
import { ok, unauthorized } from 'next-basics';
import { NextResponse } from 'next/server';

export default async (req: NextApiRequestAuth, res: NextApiResponse & NextResponse) => {
  await useAuth(req, res);

  if (req.auth) {
    return ok(res, req.auth);
  }

  return unauthorized(res);
};
