import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'noOnlySpaces', async: false })
export class NoOnlySpaces implements ValidatorConstraintInterface {
  validate(text: any): boolean {
    if (typeof text !== 'string') return false;
    return text.trim().length > 0;
  }

  defaultMessage(): string {
    return 'Vui lòng không nhập khoảng trắng';
  }
}
