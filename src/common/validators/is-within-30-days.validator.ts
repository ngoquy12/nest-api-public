import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import dayjs from 'dayjs';

@ValidatorConstraint({ name: 'IsWithin30DaysValidator', async: false })
export class IsWithin30DaysValidator implements ValidatorConstraintInterface {
  validate(dateString: string): boolean {
    const inputDate = dayjs(dateString);
    const today = dayjs();
    const diff = inputDate.diff(today, 'day');

    return diff <= 30;
  }
}
