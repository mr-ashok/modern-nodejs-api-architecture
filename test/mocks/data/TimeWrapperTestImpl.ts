import TimeWrapper from '../../../src/data/TimeWrapper';

export default class TimeWrapperTestImpl extends TimeWrapper {
    private mockedDate = new Date('2021-01-01');

    advanceTimeBy(time: number, unit: 'day' | 'hour' | 'minute' | 'second' | 'milliseconds'): void {
        let advanceBy: number;
        switch (unit) {
            case 'day':
                advanceBy = this.daysInMillis(time);
                break;
            case 'hour':
                advanceBy = this.hoursInMillis(time);
                break;
            case 'minute':
                advanceBy = this.minutesInMillis(time);
                break;
            case 'second':
                advanceBy = this.secondsInMillis(time);
                break;
            case 'milliseconds':
                advanceBy = time;
                break;
            default:
                throw new Error(`Time unit - ${unit} is not supported`);
        }
        this.setDate(new Date(this.getElapsedTime() + advanceBy));
    }

    getDate(): Date {
        return this.mockedDate;
    }

    getElapsedTime(): number {
        return this.mockedDate.getTime();
    }

    setDate(date: Date): void {
        this.mockedDate = date;
    }
}
