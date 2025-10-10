import { BadRequestException, NotFoundException } from '@nestjs/common';

export async function ensureExists<T>(
  findFn: () => Promise<T>,
  errorMessage: string,
) {
  const result = await findFn();
  if (result) throw new BadRequestException(errorMessage);
}

export async function ensureNotExists<T>(
  findFn: () => Promise<T | null>,
  errorMessage: string,
): Promise<T> {
  const result = await findFn();
  if (!result) throw new NotFoundException(errorMessage);
  return result;
}
