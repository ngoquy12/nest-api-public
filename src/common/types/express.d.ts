import { JwtPayloadUser } from 'src/modules/auths/interfaces/jwt-payload-user';

declare module 'express' {
  interface Request {
    user: JwtPayloadUser;
  }
}
