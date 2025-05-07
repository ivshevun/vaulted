export function extractJwtFromBearer(bearerJwt: string) {
  return bearerJwt.split('Bearer ')[1];
}
