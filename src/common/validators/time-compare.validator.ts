import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'timeCompare', async: false })
export class TimeCompareValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object: any = args.object;
    const startTime = object.startTime;
    const endTime = object.endTime;

    if (!startTime || !endTime) return true;

    // Chuyển thời gian thành phút để so sánh
    const startMinutes = this.convertToMinutes(startTime);
    const endMinutes = this.convertToMinutes(endTime);

    if (args.property === 'startTimeCompare') {
      return startMinutes < endMinutes;
    } else if (args.property === 'endTimeCompare') {
      return endMinutes > startMinutes;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    if (args.property === 'startTimeCompare') {
      return 'Giờ bắt đầu phải trước giờ kết thúc.';
    } else if (args.property === 'endTimeCompare') {
      return 'Giờ kết thúc phải sau giờ bắt đầu.';
    }
    return 'Giờ không hợp lệ.';
  }

  private convertToMinutes(time: string): number {
    const [timePart, modifier] = time.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);

    let totalMinutes = (hours % 12) * 60 + minutes;
    if (modifier.toUpperCase() === 'PM') {
      totalMinutes += 12 * 60;
    }

    return totalMinutes;
  }
}
