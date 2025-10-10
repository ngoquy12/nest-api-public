import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsBeforeToday(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBeforeToday',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true; // Allow empty values when optional

          const date = new Date(value);
          const now = new Date();
          return !isNaN(date.getTime()) && date < now;
        },
        defaultMessage() {
          return 'Ngày sinh phải nhỏ hơn ngày hiện tại';
        },
      },
    });
  };
}
