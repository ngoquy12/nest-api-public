import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsNotFarFuture(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFarFuture',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true; // Allow empty values when optional

          const date = new Date(value);
          if (isNaN(date.getTime())) return false;

          const now = new Date();
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(now.getFullYear() + 1);

          return date <= oneYearFromNow;
        },
        defaultMessage() {
          return 'Ngày bắt đầu làm việc không được quá 1 năm trong tương lai';
        },
      },
    });
  };
}

