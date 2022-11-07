import { NextApiRequest } from 'next';
import { Auth } from './auth';

export interface NextApiRequestQueryBody<TQuery, TBody> extends NextApiRequest {
  auth?: Auth;
  query: TQuery & { [key: string]: string | string[] };
  body: TBody;
}

export interface NextApiRequestQuery<TQuery> extends NextApiRequest {
  auth?: Auth;
  query: TQuery & { [key: string]: string | string[] };
}

export interface NextApiRequestBody<TBody> extends NextApiRequest {
  auth?: Auth;
  body: TBody;
}

export interface NextApiRequestAuth extends NextApiRequest {
  auth?: Auth;
}
