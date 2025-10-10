import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsAgeBetween18And60(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAgeBetween18And60',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true; // Allow empty values when optional

          const date = new Date(value);
          if (isNaN(date.getTime())) return false;

          const today = new Date();
          let age = today.getFullYear() - date.getFullYear();
          const m = today.getMonth() - date.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
            age--;
          }

          return age >= 16 && age < 60;
        },
        defaultMessage() {
          return 'Tuổi phải từ 16 đến dưới 60';
        },
      },
    });
  };
}
