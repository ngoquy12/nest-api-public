export enum ProductStatus {
  ACTIVE = 'ACTIVE', //
  INACTIVE = 'INACTIVE', // Tạm dừng kinh doanh
}

export const ProductStatusLabels = {
  [ProductStatus.ACTIVE]: 'Đang kinh doanh',
  [ProductStatus.INACTIVE]: 'Tạm dừng kinh doanh',
};
