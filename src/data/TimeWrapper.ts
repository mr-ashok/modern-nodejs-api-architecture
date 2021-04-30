const MILLISECONDS_IN_A_SECOND = 1000;
const SECONDS_IN_A_MINUTE = 60;
const MINUTES_IN_A_HOUR = 60;
const HOURS_IN_A_DAY = 24;
const DAYS_IN_A_MONTH = 30;

/* eslint-disable class-methods-use-this */
export default class TimeWrapper {
    daysInMillis(days: number): number {
        return this.hoursInMillis(days * HOURS_IN_A_DAY);
    }

    getDate(): Date {
        return new Date();
    }

    getElapsedTime(): number {
        // eslint-disable-next-line no-restricted-syntax
        return Date.now();
    }

    hoursInMillis(hours: number): number {
        return this.minutesInMillis(hours * MINUTES_IN_A_HOUR);
    }

    minutesInMillis(minutes: number): number {
        return this.secondsInMillis(minutes * SECONDS_IN_A_MINUTE);
    }

    monthsInMillis(months: number): number {
        return this.daysInMillis(months * DAYS_IN_A_MONTH);
    }

    secondsInMillis(seconds: number): number {
        return seconds * MILLISECONDS_IN_A_SECOND;
    }
}
/* eslint-enable class-methods-use-this */
