import { registerDecorator } from 'class-validator';

export function NoSpecialCharacters(message?: string, regex?: RegExp) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noSpecialCharacters',
      target: object.constructor,
      propertyName,
      options: {
        message: message || 'Trường này không được chứa ký tự đặc biệt',
      },
      validator: {
        validate(value: any) {
          const pattern = regex || /^[\p{L}\d\s-]+$/u;
          return typeof value === 'string' && pattern.test(value);
        },
      },
    });
  };
}
