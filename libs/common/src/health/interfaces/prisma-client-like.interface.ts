export interface PrismaClientLike {
  $queryRaw(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<unknown>;
}
