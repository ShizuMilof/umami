import { ok, unauthorized, badRequest, checkPassword, createSecureToken } from 'next-basics';
import { getUser } from 'queries';
import { secret } from 'lib/crypto';
import { NextApiRequestBody } from 'interface/nextApi';
import { NextApiResponse } from 'next';

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    isAdmin: boolean;
  };
}

export default async (
  req: NextApiRequestBody<LoginRequestBody>,
  res: NextApiResponse<LoginResponse>,
) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return badRequest(res);
  }

  const user = await getUser({ username });

  if (user && checkPassword(password, user.password)) {
    const { id: userId, username, isAdmin } = user;
    const token = createSecureToken({ userId, username, isAdmin }, secret());

    return ok(res, { token, user });
  }

  return unauthorized(res);
};
